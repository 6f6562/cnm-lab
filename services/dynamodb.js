const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamoConfig = {
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    }
};

// Nếu có endpoint (cho DynamoDB Local), thêm vào config
if (process.env.DYNAMODB_ENDPOINT) {
    dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
}

const client = new DynamoDBClient(dynamoConfig);

const ddbDocClient = DynamoDBDocumentClient.from(client);

module.exports = {
    client,
    ddbDocClient
}

