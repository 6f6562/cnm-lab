const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const productsController = require('../controllers/productsController');

router.get('/', productsController.list);

router.get('/new', productsController.showNewForm);
router.post('/', upload.single('image'), productsController.create);

router.get('/:id', productsController.detail);
router.get('/:id/edit', productsController.showEditForm);
router.post('/:id', upload.single('image'), productsController.update);

router.post('/:id/delete', productsController.remove);

module.exports = router;

