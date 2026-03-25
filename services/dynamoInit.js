const {
  DescribeTableCommand,
  CreateTableCommand,
} = require('@aws-sdk/client-dynamodb');
const { dynamoClient, isLocal } = require('../config/aws');
const { env } = require('../config/env');

const tableName = env.DYNAMODB_TABLE_PRODUCTS || 'Products';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureProductsTable() {
  try {
    await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    return;
  } catch (err) {
    if (!String(err?.name || '').includes('ResourceNotFound')) {
      throw err;
    }
  }

  const maxAttempts = isLocal ? 10 : 3;
  const baseDelayMs = isLocal ? 1000 : 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await dynamoClient.send(
        new CreateTableCommand({
          TableName: tableName,
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        })
      );

      for (let i = 0; i < 20; i++) {
        const desc = await dynamoClient.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        if (desc?.Table?.TableStatus === 'ACTIVE') return;
        await sleep(500);
      }

      return;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await sleep(baseDelayMs * attempt);
    }
  }
}

module.exports = { ensureProductsTable, tableName };

