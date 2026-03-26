class InterfaceImageStorage {
  async uploadImage() {
    throw new Error('uploadImage() not implemented');
  }

  async deleteImage() {
    throw new Error('deleteImage() not implemented');
  }

  async cleanupUploadedLocalFile() {
  }
}

module.exports = { InterfaceImageStorage };

