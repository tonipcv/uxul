import * as Minio from 'minio';

const minioClient = new Minio.Client({
  endPoint: 'boop-minioboop.dpbdp1.easypanel.host',
  port: 443,
  useSSL: true,
  accessKey: process.env.MINIO_ROOT_USER || 'admin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'password',
  region: 'us-east-1'
});

const BUCKET_NAME = 'futurostech';

// Ensure bucket exists and set public policy
async function initializeBucket() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    }
    
    // Set bucket policy to public read
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
        }
      ]
    };
    
    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
  } catch (error) {
    console.error('Error initializing bucket:', error);
  }
}

initializeBucket();

export { minioClient, BUCKET_NAME }; 