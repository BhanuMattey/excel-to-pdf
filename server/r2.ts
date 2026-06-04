import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = process.env.R2_BUCKET_NAME!
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!

// Log credential presence at module load so we can diagnose missing env vars
console.log('[r2] init — account:', ACCOUNT_ID, '| bucket:', BUCKET,
  '| key id:', process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.slice(0, 8) + '…' : 'MISSING',
  '| secret:', process.env.R2_SECRET_ACCESS_KEY ? '(set)' : 'MISSING')

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// Upload a buffer to R2. Returns the object key.
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    // Object-level expiry metadata (informational — actual deletion done by cleanup worker)
    Metadata: { 'expires-in': '86400' },
  }))
  return key
}

// Generate a presigned download URL valid for 24 hours.
export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 86400 } // 24h in seconds
  )
}

// Delete an object from R2. Safe to call even if the key is already gone.
export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch {
    // Already deleted or never existed — not an error
  }
}
