import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getBucket() {
  const bucket = process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set. Please configure it in your environment variables.')
  }
  return bucket
}

function getRegion() {
  const region = process.env.AWS_REGION
  if (!region) {
    throw new Error('AWS_REGION environment variable is not set. Please configure it in your environment variables.')
  }
  return region
}

function getCredentials() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are not set. Please configure them in your environment variables.')
  }
  return {
    accessKeyId,
    secretAccessKey,
  }
}

let s3Client: S3Client | null = null

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getRegion(),
      credentials: getCredentials(),
    })
  }
  return s3Client
}

export async function generateUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 })
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  })

  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 })
}

export { getS3Client as s3Client }

