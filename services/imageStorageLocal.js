const fs = require('fs');
const path = require('path');

const { env } = require('../config/env');
const { InterfaceImageStorage } = require('./InterfaceImageStorage');

class ImageStorageLocal extends InterfaceImageStorage {
  constructor() {
    super();
    this.localUploadDirName = env.LOCAL_UPLOAD_DIR || 'uploads';
    this.localUploadDir = path.join(__dirname, '..', this.localUploadDirName);
    fs.mkdirSync(this.localUploadDir, { recursive: true });
  }

  urlForLocal(filename) {
    return `/${this.localUploadDirName}/${filename}`;
  }

  tryExtractLocalFilename(urlOrPath) {
    if (!urlOrPath) return null;

    const idx = String(urlOrPath).lastIndexOf(`/${this.localUploadDirName}/`);
    if (idx >= 0) return String(urlOrPath).slice(idx + (`/${this.localUploadDirName}/`).length);

    return null;
  }

  localDeletePath(filename) {
    return path.join(this.localUploadDir, filename);
  }

  async uploadImage(file) {
    if (!file) return null;

    const filename = file.filename || path.basename(file.path || '');
    if (!filename) throw new Error('Không thể xác định filename ảnh.');

    return {
      url_image: this.urlForLocal(filename),
      filename,
    };
  }

  async deleteImage(url_image) {
    if (!url_image) return;

    const filename = this.tryExtractLocalFilename(url_image);
    if (!filename) return;

    const filePath = this.localDeletePath(filename);
    try {
      await fs.promises.unlink(filePath);
    } catch {
    }
  }

  async cleanupUploadedLocalFile(multerFile) {
    if (!multerFile) return;
    const filename = multerFile.filename || path.basename(multerFile.path || '');
    if (!filename) return;

    const filePath = this.localDeletePath(filename);
    try {
      await fs.promises.unlink(filePath);
    } catch {
    }
  }
}

module.exports = new ImageStorageLocal();

