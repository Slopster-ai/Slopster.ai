# AWS Quick Setup Guide

This is a simplified guide to get your AWS credentials and set up the site for basic functionality (S3 storage).

## Prerequisites

- An AWS account (create one at [aws.amazon.com](https://aws.amazon.com) if you don't have one)
- Basic understanding that AWS charges for usage (S3 storage is very cheap for small projects)

## Method 1: Using AWS Console (Easiest - Recommended)

### Step 1: Create an S3 Bucket

1. Go to [AWS Console](https://console.aws.amazon.com) and sign in
2. Search for "S3" in the top search bar
3. Click "Create bucket"
4. **Bucket name**: Choose a unique name (e.g., `slopster-videos-yourname-2024`)
   - Must be globally unique across all AWS accounts
   - Use lowercase letters, numbers, and hyphens only
5. **Region**: Choose a region close to you (e.g., `us-east-1`, `us-west-2`, `eu-west-1`)
   - **Remember this region** - you'll need it for your `.env.local`
6. **Block Public Access**: Keep it enabled (default) - we'll use signed URLs
7. Click "Create bucket"

### Step 2: Create an IAM User for Your Application

1. In AWS Console, search for "IAM" (Identity and Access Management)
2. Click "Users" in the left sidebar
3. Click "Create user"
4. **User name**: Enter `slopster-app` (or any name you prefer)
5. Click "Next"

### Step 3: Attach Permissions

1. Select "Attach policies directly"
2. Search for and check these policies:
   - `AmazonS3FullAccess` (for uploading/downloading videos)
   - (Optional) `AmazonSQSFullAccess` (if you plan to use video processing queue)
3. Click "Next"
4. Review and click "Create user"

### Step 4: Get Your Access Keys

1. Click on the user you just created (`slopster-app`)
2. Click the "Security credentials" tab
3. Scroll down to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS" (or "Local code" if that option appears)
6. Click "Next" and then "Create access key"
7. **IMPORTANT**: Copy both values immediately:
   - **Access key ID**: Starts with `AKIA...`
   - **Secret access key**: Long string (you can only see this once!)
8. Click "Done"

⚠️ **Save these keys securely** - you won't be able to see the secret key again!

### Step 5: Configure CORS for Your Bucket

1. Go back to S3 in AWS Console
2. Click on your bucket name
3. Click the "Permissions" tab
4. Scroll down to "Cross-origin resource sharing (CORS)"
5. Click "Edit" and paste this configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

6. Click "Save changes"

### Step 6: Add Credentials to Your Project

1. Open your `.env.local` file in the project root (create it if it doesn't exist)
2. Add these lines (replace with your actual values):

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=slopster-videos-yourname-2024
```

**Replace:**
- `AWS_REGION` with the region you chose (e.g., `us-east-1`, `us-west-2`)
- `AWS_ACCESS_KEY_ID` with your access key ID
- `AWS_SECRET_ACCESS_KEY` with your secret access key
- `AWS_S3_BUCKET` with your bucket name

3. Save the file
4. Restart your development server (`npm run dev`)

## Method 2: Using AWS CLI (Advanced)

If you have AWS CLI installed and configured:

```bash
# Create IAM user
aws iam create-user --user-name slopster-app

# Attach S3 policy
aws iam attach-user-policy \
  --user-name slopster-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access key
aws iam create-access-key --user-name slopster-app
```

The output will contain your `AccessKeyId` and `SecretAccessKey`.

## Testing Your Setup

1. Start your development server: `npm run dev`
2. Navigate to a project page that uses S3 (e.g., the "Record Voice" page)
3. Try uploading a file - it should work without errors

## Troubleshooting

### Error: "AWS_REGION environment variable is not set"
- Make sure `AWS_REGION` is in your `.env.local` file
- Restart your dev server after adding it

### Error: "AWS_S3_BUCKET environment variable is not set"
- Make sure `AWS_S3_BUCKET` matches your exact bucket name
- Check for typos or extra spaces

### Error: "Access Denied" or "Invalid credentials"
- Verify your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
- Make sure there are no extra spaces or quotes around the values
- Check that the IAM user has `AmazonS3FullAccess` policy attached

### Error: "Bucket does not exist"
- Verify the bucket name in `AWS_S3_BUCKET` matches exactly
- Check that you're using the correct region

## Security Best Practices

1. **Never commit `.env.local`** - it's already in `.gitignore`
2. **Rotate keys regularly** - create new keys and delete old ones
3. **Use least privilege** - only grant the permissions you need
4. **For production** - use IAM roles instead of access keys when possible (e.g., on Vercel, use environment variables)

## Optional: Set Up SQS Queue (For Video Processing)

If you want to use the video processing queue feature:

1. In AWS Console, search for "SQS"
2. Click "Create queue"
3. **Name**: `video-processing-queue`
4. **Type**: Standard
5. Click "Create queue"
6. Copy the **Queue URL**
7. Add to `.env.local`:
   ```bash
   AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/video-processing-queue
   ```

## Cost Estimate

For a small project:
- **S3 Storage**: ~$0.023 per GB/month (first 50GB free for 12 months)
- **S3 Requests**: ~$0.005 per 1,000 requests
- **Data Transfer Out**: First 100GB/month free, then ~$0.09/GB

**Typical small project**: < $5/month

## Next Steps

Once AWS is configured:
1. ✅ Test file uploads work
2. ✅ Test file downloads work
3. ✅ Set up Vercel environment variables (same values as `.env.local`)
4. ✅ Deploy and test in production

## Need Help?

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- Check the main `AWS_SETUP.md` for advanced Lambda/SQS setup





