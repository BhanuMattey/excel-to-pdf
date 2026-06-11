import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = process.env.R2_BUCKET_NAME!
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

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
    Metadata: { 'expires-in': '86400' },
  }))
  return key
}

export async function getPresignedUrl(key: string): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 86400 }
  )
}

// Presigned PUT so the browser can upload large files straight to R2,
// bypassing Vercel's ~4.5 MB request body limit. The signature pins the
// content type, so the client must send the same Content-Type header.
export async function getPresignedPutUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      Metadata: { 'expires-in': '86400' },
    }),
    { expiresIn: 600 }
  )
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch {
    // Missing objects should not break cleanup.
  }
}
