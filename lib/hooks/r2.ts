import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize R2 client
console.log('🔧 Initializing R2 client with config:', {
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
});

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Add this to ensure proper authentication
  forcePathStyle: true
});

export const uploadToR2 = async (file: Buffer, fileName: string, contentType: string) => {
  console.log('📤 Starting file upload to R2...', {
    fileName,
    contentType,
    fileSizeKB: Math.round(file.length / 1024),
    bucket: process.env.R2_BUCKET_NAME
  });

  try {
    // Validate environment variables
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME is not defined');
    }
    if (!process.env.R2_PUBLIC_URL) {
      throw new Error('R2_PUBLIC_URL is not defined');
    }

    // Upload file
    console.log('🔧 Creating upload command...');
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: contentType,
      // Add ACL for public read access
      ACL: 'public-read'
    });

    console.log('📡 Sending upload command to R2...', {
      bucket: process.env.R2_BUCKET_NAME,
      key: fileName,
      contentType
    });

    const uploadResult = await R2.send(uploadCommand);
    console.log('✅ Upload successful!', {
      eTag: uploadResult.ETag,
      versionId: uploadResult.VersionId
    });

    // Return permanent public URL using the custom domain
    // If you have a custom domain: const publicUrl = `https://${process.env.R2_CUSTOM_DOMAIN}/${fileName}`;
    // If using default R2 URL:
    const publicUrl = `https://${process.env.R2_PUBLIC_URL}/${fileName}`;
    console.log('🔗 Generated public URL:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ R2 upload error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName,
      contentType,
      bucket: process.env.R2_BUCKET_NAME
    });
    
    throw error;
  }
}; 