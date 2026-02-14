import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_DOMAIN!;

/** Key prefixes for logical "sub-buckets" inside the single R2 bucket */
export const R2_PREFIX = {
  GENERATIONS: 'generations',
  REFERENCE_IMAGES: 'reference-images',
  AVATARS: 'avatars',
} as const;

/** Singleton S3 client configured for Cloudflare R2 */
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Upload a file to R2.
 * @returns The public URL and storage key.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ url: string; key: string }> {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { url: getR2PublicUrl(key), key };
}

/**
 * Download a file from R2 as a Buffer.
 * Returns null if the file doesn't exist or on error.
 */
export async function downloadFromR2(key: string): Promise<Buffer | null> {
  try {
    const client = getS3Client();

    const response = await client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) return null;

    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('R2 download error:', error);
    return null;
  }
}

/**
 * Delete one or more files from R2.
 * Silently handles errors to match existing Supabase behavior.
 */
export async function deleteFromR2(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  try {
    const client = getS3Client();

    await client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET_NAME,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    );
  } catch (error) {
    console.error('R2 delete error:', error);
  }
}

/**
 * Generate a presigned PUT URL for direct client-side uploads.
 * @param expiresIn - URL expiry in seconds (default: 600 = 10 minutes)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 600
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/** Build the public URL for an R2 object key */
export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
