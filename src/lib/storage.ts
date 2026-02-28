import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * S3-compatible image storage abstraction.
 * Stores images and returns URLs; DB only holds the URL.
 */

interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlBase: string;
}

function getConfig(): StorageConfig {
  return {
    bucket: process.env.S3_BUCKET ?? "wizzardobe-images",
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    publicUrlBase:
      process.env.S3_PUBLIC_URL_BASE ?? "https://images.wizzardobe.com",
  };
}

function getS3Client(): S3Client {
  const config = getConfig();
  return new S3Client({
    region: config.region,
    ...(config.endpoint && { endpoint: config.endpoint }),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function uploadImage(
  userId: string,
  fileName: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();
  const key = `wardrobe/${userId}/${Date.now()}-${fileName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  return `${config.publicUrlBase}/${key}`;
}

export async function deleteImage(imageUrl: string): Promise<void> {
  const config = getConfig();
  const client = getS3Client();
  const key = imageUrl.replace(`${config.publicUrlBase}/`, "");

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
}
