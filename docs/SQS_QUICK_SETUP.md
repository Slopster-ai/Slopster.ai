# SQS Queue Quick Setup

The SQS (Simple Queue Service) queue is used for asynchronous video processing. If you're not using video processing yet, you can skip this step.

## Create SQS Queue via AWS Console (Easiest)

### Step 1: Create the Queue

1. Go to [AWS Console](https://console.aws.amazon.com) and sign in
2. Search for "SQS" in the top search bar
3. Click "Create queue"

### Step 2: Configure the Queue

1. **Queue type**: Select "Standard" (default)
2. **Name**: Enter `video-processing-queue` (or any name you prefer)
3. **Configuration**:
   - **Visibility timeout**: `900` seconds (15 minutes) - this is how long a message is hidden after being received
   - **Message retention period**: `345600` seconds (4 days) - how long messages are kept if not processed
   - **Delivery delay**: `0` seconds
   - **Receive message wait time**: `20` seconds (long polling)
4. Click "Create queue"

### Step 3: Get the Queue URL

1. After the queue is created, click on it to open the details
2. Copy the **Queue URL** - it will look like:
   ```
   https://sqs.us-east-1.amazonaws.com/123456789012/video-processing-queue
   ```
3. **Important**: Copy the entire URL, including the `https://` part

### Step 4: Add to Environment Variables

1. Open your `.env.local` file
2. Add this line (replace with your actual queue URL):
   ```bash
   AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/video-processing-queue
   ```
3. Make sure the region in the URL matches your `AWS_REGION` environment variable
4. Save the file
5. Restart your development server

## Create SQS Queue via AWS CLI

If you have AWS CLI installed and configured:

```bash
# Create the queue
aws sqs create-queue \
  --queue-name video-processing-queue \
  --region us-east-1 \
  --attributes VisibilityTimeout=900,ReceiveMessageWaitTimeSeconds=20

# Get the queue URL
aws sqs get-queue-url \
  --queue-name video-processing-queue \
  --region us-east-1 \
  --query 'QueueUrl' \
  --output text
```

Copy the output URL and add it to your `.env.local` file.

## PowerShell (Windows)

```powershell
$region = "us-east-1"
$queueName = "video-processing-queue"

# Create the queue
aws sqs create-queue `
  --queue-name $queueName `
  --region $region `
  --attributes VisibilityTimeout=900,ReceiveMessageWaitTimeSeconds=20

# Get the queue URL
$queueUrl = aws sqs get-queue-url `
  --queue-name $queueName `
  --region $region `
  --query 'QueueUrl' `
  --output text

Write-Host "Queue URL: $queueUrl"
```

## Verify IAM Permissions

Make sure your IAM user has SQS permissions:

1. Go to IAM → Users → Your user (`slopster-app`)
2. Check attached policies
3. If `AmazonSQSFullAccess` is not attached:
   - Click "Add permissions" → "Attach policies directly"
   - Search for and select `AmazonSQSFullAccess`
   - Click "Add permissions"

## Testing

After setting up the queue:

1. Restart your development server
2. Try processing a video
3. Check the SQS queue in AWS Console - you should see messages appearing

## Troubleshooting

### Error: "The specified queue does not exist"
- Verify the queue name in `AWS_SQS_QUEUE_URL` matches exactly
- Check that you're using the correct region
- Make sure the queue URL is complete (includes `https://`)

### Error: "Access Denied"
- Verify your IAM user has `AmazonSQSFullAccess` policy
- Check that your AWS credentials are correct in `.env.local`

### Error: "Invalid queue URL format"
- Make sure the URL starts with `https://sqs.`
- Verify the region in the URL matches your `AWS_REGION`

## Cost

SQS is very cheap:
- **First 1 million requests/month**: FREE
- **After that**: $0.40 per million requests
- **Message storage**: First 1GB/month FREE, then $0.05 per GB/month

For a small project, SQS will likely be **completely free**.

## Optional: Skip SQS for Now

If you're not using video processing yet, you can:
1. Leave `AWS_SQS_QUEUE_URL` unset in `.env.local`
2. The application will show a helpful error message if you try to process videos
3. Set it up later when you need video processing


