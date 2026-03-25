const crypto = require('crypto');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client } = require('../config/aws');
const { env } = require('../config/env');

const { InterfaceImageStorage } = require('./InterfaceImageStorage');

function getExt(file) {
  const path = require('path');
  const ext = path.extname(file?.originalname || '').toLowerCase();
  if (ext) return ext;
  if (file?.mimetype === 'image/jpeg') return '.jpg';
  if (file?.mimetype === 'image/png') return '.png';
  if (file?.mimetype === 'image/gif') return '.gif';
  if (file?.mimetype === 'image/webp') return '.webp';
  return '';
}

function urlToS3Key(url_image) {
  if (!url_image) return null;
  try {
    const u = new URL(url_image);
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

class ImageStorageS3 extends InterfaceImageStorage {
  async uploadImage(file) {
    if (!file) return null;

    if (!env.AWS_S3_BUCKET) {
      throw new Error('Thiếu AWS_S3_BUCKET trong .env.');
    }
    if (!file.buffer) {
      throw new Error('S3 upload cần file.buffer (multer memoryStorage).');
    }

    const ext = getExt(file);
    const key = `products/${crypto.randomBytes(16).toString('hex')}${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: env.S3_OBJECT_ACL || undefined,
      })
    );

    const region = env.AWS_REGION || 'us-east-1';
    const url_image = env.S3_PUBLIC_URL_BASE
      ? `${env.S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`
      : `https://${env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    return { url_image, storageProvider: 's3', key };
  }

  async deleteImage(url_image) {
    if (!url_image) return;
    const key = urlToS3Key(url_image);
    if (!key) return;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
      })
    );
  }
}

module.exports = new ImageStorageS3();

