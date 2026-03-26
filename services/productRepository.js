const {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const { dynamoClient } = require('../config/aws');
const { env } = require('../config/env');

const tableName = env.DYNAMODB_TABLE_PRODUCTS || 'Products';

const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function listProducts({ search, priceMin, priceMax } = {}) {
  const params = { TableName: tableName };

  const conditions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  if (search && String(search).trim().length > 0) {
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':q'] = String(search).trim();
    conditions.push('contains(#name, :q)');
  }

  const hasMin = priceMin !== undefined && priceMin !== null;
  const hasMax = priceMax !== undefined && priceMax !== null;

  if (hasMin && hasMax) {
    expressionAttributeNames['#price'] = 'price';
    expressionAttributeValues[':min'] = priceMin;
    expressionAttributeValues[':max'] = priceMax;
    conditions.push('#price BETWEEN :min AND :max');
  } else if (hasMin) {
    expressionAttributeNames['#price'] = 'price';
    expressionAttributeValues[':min'] = priceMin;
    conditions.push('#price >= :min');
  } else if (hasMax) {
    expressionAttributeNames['#price'] = 'price';
    expressionAttributeValues[':max'] = priceMax;
    conditions.push('#price <= :max');
  }

  if (conditions.length > 0) {
    params.FilterExpression = conditions.join(' AND ');
    params.ExpressionAttributeNames = expressionAttributeNames;
    params.ExpressionAttributeValues = expressionAttributeValues;
  }

  params.Limit = Number(env.MAX_PRODUCTS_LIST || 200);

  const result = await docClient.send(new ScanCommand(params));
  return result.Items || [];
}

async function getProductById(id) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );
  return result.Item || null;
}

async function createProduct(product) {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: product,
    })
  );
}

async function updateProduct(product) {
  await createProduct(product);
}

async function deleteProduct(id) {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    })
  );
}

module.exports = {
  tableName,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

