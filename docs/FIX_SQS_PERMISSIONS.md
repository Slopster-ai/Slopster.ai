# Fix SQS Permissions Error

If you're getting this error:
```
is not authorized to perform: sqs:SendMessage on resource: arn:aws:sqs:...
```

Your IAM user needs SQS permissions. Here's how to fix it:

## Method 1: AWS Console (Easiest)

1. Go to [AWS Console](https://console.aws.amazon.com) → Search "IAM"
2. Click "Users" in the left sidebar
3. Click on your user: `slopster-app`
4. Click the "Permissions" tab
5. Click "Add permissions" → "Attach policies directly"
6. In the search box, type: `AmazonSQSFullAccess`
7. Check the box next to `AmazonSQSFullAccess`
8. Click "Add permissions" at the bottom

That's it! The permissions take effect immediately.

## Method 2: AWS CLI

If you have AWS CLI installed and configured:

```bash
aws iam attach-user-policy \
  --user-name slopster-app \
  --policy-arn arn:aws:iam::aws:policy/AmazonSQSFullAccess
```

## Method 3: PowerShell (Windows)

```powershell
aws iam attach-user-policy `
  --user-name slopster-app `
  --policy-arn arn:aws:iam::aws:policy/AmazonSQSFullAccess
```

## Verify Permissions

After adding the policy, you can verify it worked:

1. Go back to IAM → Users → `slopster-app` → Permissions tab
2. You should see `AmazonSQSFullAccess` listed under "Permissions policies"

## Test It

1. Restart your development server (if it's running)
2. Try the operation that was failing
3. It should work now!

## Alternative: More Restrictive Policy (Advanced)

If you want to be more security-conscious, you can create a custom policy that only allows SQS operations on your specific queue:

1. Go to IAM → Policies → Create policy
2. Click "JSON" tab
3. Paste this (replace with your account ID and queue name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:eu-north-1:289064655918:video-processing-queue"
    }
  ]
}
```

4. Name it `SlopsterSQSPolicy`
5. Attach it to your user instead of `AmazonSQSFullAccess`

But for simplicity, `AmazonSQSFullAccess` is fine for development.




