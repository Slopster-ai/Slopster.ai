# AWS Setup Guide

This guide walks you through setting up the AWS infrastructure for Slopster.ai video processing.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of S3, SQS, and Lambda

## Step 1: Create S3 Bucket

```bash
# Replace with your bucket name and region
AWS_REGION=us-east-1
BUCKET_NAME=slopster-videos-dev

aws s3 mb s3://${slopster-videos-dev} --region ${us-east-1}

# Enable CORS
aws s3api put-bucket-cors --bucket ${BUCKET_NAME} --cors-configuration file://aws-cors.json
```

Create `aws-cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

## Step 2: Create SQS Queue

```bash
# Create standard SQS queue
aws sqs create-queue \
  --queue-name video-processing-queue \
  --region ${AWS_REGION} \
  --attributes VisibilityTimeout=900,ReceiveMessageWaitTimeSeconds=20

# Get queue URL
QUEUE_URL=$(aws sqs get-queue-url \
  --queue-name video-processing-queue \
  --region ${AWS_REGION} \
  --query 'QueueUrl' \
  --output text)

echo "Queue URL: ${QUEUE_URL}"
```

## Step 3: Create IAM Role for Lambda

Create `lambda-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create the role:
```bash
aws iam create-role \
  --role-name SlopsterVideoProcessorRole \
  --assume-role-policy-document file://lambda-trust-policy.json
```

Create `lambda-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::slopster-videos-dev/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach policies:
```bash
aws iam put-role-policy \
  --role-name SlopsterVideoProcessorRole \
  --policy-name SlopsterVideoProcessorPolicy \
  --policy-document file://lambda-policy.json
```

## Step 4: Create FFmpeg Lambda Layer

Download FFmpeg binary for Amazon Linux 2:

```bash
mkdir -p lambda-layer/bin
cd lambda-layer

# Download pre-built FFmpeg for Lambda
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-amd64-static/ffmpeg bin/
cp ffmpeg-*-amd64-static/ffprobe bin/
chmod +x bin/ffmpeg bin/ffprobe

# Create layer zip
zip -r ffmpeg-layer.zip .
```

Create the layer:
```bash
aws lambda publish-layer-version \
  --layer-name ffmpeg \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region ${AWS_REGION}
```

Note the `LayerVersionArn` from the output.

## Step 5: Deploy Lambda Function

```bash
cd aws/lambda/video-processor
npm install

# Package the function
zip -r function.zip . -x "*.git*" "node_modules/aws-sdk/*"

# Create the function
aws lambda create-function \
  --function-name SlopsterVideoProcessor \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/SlopsterVideoProcessorRole \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 900 \
  --memory-size 3008 \
  --layers YOUR_FFMPEG_LAYER_ARN \
  --environment Variables="{AWS_REGION=${AWS_REGION},S3_BUCKET=${BUCKET_NAME},SUPABASE_URL=your-supabase-url,SUPABASE_SERVICE_KEY=your-service-key}" \
  --region ${AWS_REGION}
```

## Step 6: Add SQS Trigger to Lambda

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name SlopsterVideoProcessor \
  --region ${AWS_REGION} \
  --query 'Configuration.FunctionArn' \
  --output text)

# Add event source mapping
aws lambda create-event-source-mapping \
  --function-name SlopsterVideoProcessor \
  --event-source-arn YOUR_QUEUE_ARN \
  --batch-size 1 \
  --region ${AWS_REGION}
```

## Step 7: Create IAM User for Application

Create a programmatic user with access to S3 and SQS:

```bash
aws iam create-user --user-name slopster-app

# Attach necessary policies
aws iam attach-user-policy \
  --user-name slopster-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-user-policy \
  --user-name slopster-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonSQSFullAccess

# Create access key
aws iam create-access-key --user-name slopster-app
```

Save the `AccessKeyId` and `SecretAccessKey` to your `.env.local`:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=slopster-videos-dev
AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/video-processing-queue
```

## Testing

Test the Lambda function manually:

```bash
aws lambda invoke \
  --function-name SlopsterVideoProcessor \
  --payload file://test-event.json \
  --region ${AWS_REGION} \
  response.json

cat response.json
```

Example `test-event.json`:
```json
{
  "Records": [
    {
      "body": "{\"jobId\":\"test-job-id\",\"inputKey\":\"uploads/test/input.mp4\",\"outputKey\":\"outputs/test/output.mp4\",\"operations\":{\"trim\":{\"start\":0,\"end\":30},\"captions\":true}}"
    }
  ]
}
```

## Monitoring

View Lambda logs:
```bash
aws logs tail /aws/lambda/SlopsterVideoProcessor --follow
```

Check SQS queue depth:
```bash
aws sqs get-queue-attributes \
  --queue-url ${QUEUE_URL} \
  --attribute-names ApproximateNumberOfMessages
```

## Cost Optimization

- Use S3 Lifecycle policies to delete old videos after 30 days
- Monitor Lambda execution time and optimize FFmpeg commands
- Consider Reserved Capacity for Lambda if processing volume is predictable
- Use CloudWatch Alarms to monitor costs

## Troubleshooting

### Lambda timeout
- Increase timeout to 900s (15 minutes max)
- Increase memory to 3GB for faster processing
- Optimize FFmpeg commands

### Out of memory
- Reduce video quality settings
- Process videos in chunks
- Increase Lambda memory

### Permission errors
- Check IAM roles and policies
- Verify S3 bucket permissions
- Check SQS queue permissions

