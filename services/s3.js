const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

// Cấu hình S3 với credentials riêng nếu có, nếu không thì dùng default
const s3Config = {
    region: process.env.AWS_REGION || "us-east-1"
};

// Nếu có credentials riêng cho S3, sử dụng chúng
// Nếu không, AWS SDK sẽ tự động lấy từ default credentials chain
if (process.env.AWS_ACCESS_KEY_ID_S3 && process.env.AWS_SECRET_ACCESS_KEY_S3) {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_S3,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_S3
    };
}

const s3 = new S3Client(s3Config);

async function uploadImage(file) {
    const key = `products/${uuidv4()}-${file.originalname}`;

    await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    }));

    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

async function deleteImageByUrl(url) {
    const key = url.split(".com/")[1];
    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
    }));
}

module.exports = { uploadImage, deleteImageByUrl };
