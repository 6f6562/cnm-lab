const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { env, toBool } = require('./env');

const provider = env.IMAGE_STORAGE_PROVIDER || 'local';
const localUploadDirName = env.LOCAL_UPLOAD_DIR || 'uploads';
const localUploadDir = path.join(__dirname, '..', localUploadDirName);

if (provider === 'local') {
  fs.mkdirSync(localUploadDir, { recursive: true });
}

function getExtFromName(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  return ext ? ext : '';
}

function isImageFile(file) {
  if (!file) return false;
  return (
    (file.mimetype && file.mimetype.startsWith('image/')) ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file.originalname || '')
  );
}

const storage =
  provider === 's3'
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, localUploadDir);
        },
        filename: function (req, file, cb) {
          const ext = getExtFromName(file.originalname);
          const name = crypto.randomBytes(12).toString('hex');
          cb(null, `${name}${ext}`);
        },
      });

const maxFileSizeMb = Number(env.MAX_IMAGE_SIZE_MB || 5);

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!isImageFile(file)) return cb(new Error('Chỉ hỗ trợ upload ảnh.'));
    cb(null, true);
  },
});

module.exports = upload;

