const crypto = require('crypto');
const productsRepo = require('../services/productRepository');

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function getImageStorage(req) {
  const storage = req?.app?.locals?.imageStorage;
  if (!storage) throw new Error('Image storage service is not configured.');
  if (typeof storage.uploadImage !== 'function' || typeof storage.deleteImage !== 'function') {
    throw new Error('Image storage service does not implement required methods.');
  }
  return storage;
}

function toTrimmedString(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  return n;
}

function validateProductInput({ name, price, unit_in_stock }) {
  const errors = [];

  const nameT = toTrimmedString(name);
  if (!nameT) errors.push('Vui lòng nhập tên sản phẩm.');
  if (nameT.length > 200) errors.push('Tên sản phẩm không được dài hơn 200 ký tự.');

  const priceN = toNumber(price);
  if (priceN === null) errors.push('Giá không hợp lệ.');
  if (priceN !== null && priceN < 0) errors.push('Giá phải >= 0.');

  const stockN = toInt(unit_in_stock);
  if (stockN === null) errors.push('Số lượng tồn kho phải là số nguyên >= 0.');
  if (stockN !== null && stockN < 0) errors.push('Số lượng tồn kho phải >= 0.');

  return {
    errors,
    normalized: {
      name: nameT,
      price: priceN,
      unit_in_stock: stockN,
    },
  };
}

function getMessagesFromQuery(req) {
  return {
    success: req.query.success ? String(req.query.success) : null,
    error: req.query.error ? String(req.query.error) : null,
  };
}

function parseNullableNumber(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

async function list(req, res, next) {
  try {
    const q = req.query.q ? String(req.query.q) : '';
    const minPrice = parseNullableNumber(req.query.min_price);
    const maxPrice = parseNullableNumber(req.query.max_price);

    const products = await productsRepo.listProducts({ search: q, priceMin: minPrice, priceMax: maxPrice });
    return res.render('products/index', {
      title: 'Products',
      products,
      q,
      minPrice,
      maxPrice,
      ...getMessagesFromQuery(req),
    });
  } catch (err) {
    return next(err);
  }
}

async function showNewForm(req, res) {
  const { success, error } = getMessagesFromQuery(req);
  return res.render('products/new', {
    title: 'Add Product',
    errors: [],
    product: { name: '', price: '', unit_in_stock: '' },
    ...{ success, error },
  });
}

async function create(req, res, next) {
  try {
    const imageStorage = getImageStorage(req);
    const { name, price, unit_in_stock } = req.body;
    const { errors, normalized } = validateProductInput({ name, price, unit_in_stock });

    if (!req.file) {
      errors.push('Vui lòng chọn hình ảnh sản phẩm.');
    }

    if (errors.length > 0) {
      // Nếu local, multer đã lưu file => dọn rác.
      await imageStorage.cleanupUploadedLocalFile(req.file);

      return res.status(400).render('products/new', {
        title: 'Add Product',
        errors,
        product: { name: normalized.name ?? name, price: normalized.price ?? price, unit_in_stock: unit_in_stock },
        success: null,
        error: null,
      });
    }

    let url_image = '';
    if (req.file) {
      const uploaded = await imageStorage.uploadImage(req.file);
      url_image = uploaded.url_image;
    }

    const product = {
      id: randomId(),
      name: normalized.name,
      price: normalized.price,
      unit_in_stock: normalized.unit_in_stock,
      url_image,
    };

    await productsRepo.createProduct(product);
    return res.redirect(`/?success=${encodeURIComponent('Thêm sản phẩm thành công!')}`);
  } catch (err) {
    return next(err);
  }
}

async function detail(req, res, next) {
  try {
    const id = req.params.id;
    const product = await productsRepo.getProductById(id);
    if (!product) return res.status(404).render('error', { message: 'Sản phẩm không tồn tại.' });

    return res.render('products/detail', {
      title: `Product: ${product.name}`,
      product,
      ...getMessagesFromQuery(req),
    });
  } catch (err) {
    return next(err);
  }
}

async function showEditForm(req, res, next) {
  try {
    const id = req.params.id;
    const product = await productsRepo.getProductById(id);
    if (!product) return res.status(404).render('error', { message: 'Sản phẩm không tồn tại.' });

    const { success, error } = getMessagesFromQuery(req);

    return res.render('products/edit', {
      title: 'Edit Product',
      errors: [],
      product,
      success,
      error,
    });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const imageStorage = getImageStorage(req);
    const id = req.params.id;
    const oldProduct = await productsRepo.getProductById(id);
    if (!oldProduct) return res.status(404).render('error', { message: 'Sản phẩm không tồn tại.' });

    const { name, price, unit_in_stock } = req.body;
    const { errors, normalized } = validateProductInput({ name, price, unit_in_stock });

    if (!req.file) {
      errors.push('Vui lòng chọn hình ảnh mới để cập nhật.');
    }

    if (errors.length > 0) {
      await imageStorage.cleanupUploadedLocalFile(req.file);
      return res.status(400).render('products/edit', {
        title: 'Edit Product',
        errors,
        product: {
          ...oldProduct,
          name: normalized.name ?? name,
          price: normalized.price ?? price,
          unit_in_stock: normalized.unit_in_stock ?? unit_in_stock,
        },
        success: null,
        error: null,
      });
    }

    let newUrlImage = oldProduct.url_image || '';
    let uploaded = null;

    if (req.file) {
      uploaded = await imageStorage.uploadImage(req.file);
      newUrlImage = uploaded.url_image;
    }

    const updatedProduct = {
      ...oldProduct,
      name: normalized.name,
      price: normalized.price,
      unit_in_stock: normalized.unit_in_stock,
      url_image: newUrlImage,
    };

    try {
      await productsRepo.updateProduct(updatedProduct);
      // Xóa ảnh cũ nếu user đã upload ảnh mới
      if (uploaded && oldProduct.url_image && oldProduct.url_image !== newUrlImage) {
        await imageStorage.deleteImage(oldProduct.url_image);
      }
    } catch (err) {
      // Nếu update DynamoDB thất bại: dọn ảnh mới vừa upload (tránh rác)
      if (uploaded) {
        await imageStorage.deleteImage(uploaded.url_image);
      }
      throw err;
    }

    return res.redirect(`/?success=${encodeURIComponent('Cập nhật sản phẩm thành công!')}`);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const imageStorage = getImageStorage(req);
    const id = req.params.id;
    const oldProduct = await productsRepo.getProductById(id);
    if (!oldProduct) return res.redirect(`/?error=${encodeURIComponent('Sản phẩm không tồn tại.')}`);

    await productsRepo.deleteProduct(id);

    if (oldProduct.url_image) {
      try {
        await imageStorage.deleteImage(oldProduct.url_image);
      } catch {
      }
    }

    return res.redirect(`/?success=${encodeURIComponent('Xóa sản phẩm thành công!')}`);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  list,
  showNewForm,
  create,
  detail,
  showEditForm,
  update,
  remove,
};

