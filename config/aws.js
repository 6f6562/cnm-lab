const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { env, toBool } = require('./env');

const isLocal = toBool(env.DYNAMODB_LOCAL, true);

const dynamoClient = new DynamoDBClient({
  region: env.AWS_REGION || 'us-east-1',
  endpoint: isLocal ? env.DYNAMODB_ENDPOINT || 'http://localhost:8000' : undefined,
  credentials: isLocal
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'test',
      }
    : undefined,
});

const s3Client = new S3Client({
  region: env.AWS_REGION || 'us-east-1',
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

module.exports = {
  dynamoClient,
  s3Client,
  isLocal,
};

