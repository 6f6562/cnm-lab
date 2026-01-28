const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer();

const controller = require("../controllers/product.controller");


router.get("/", (req, res) => {
    res.redirect("/products");
});

router.get("/products", controller.getAllProducts);
router.get("/products/create", controller.renderCreatePage);
router.get("/products/:id/edit", controller.renderEditPage);

router.post("/products", upload.single("image"), controller.createProduct);
router.post("/products/:id/update", upload.single("image"), controller.updateProduct);
router.post("/products/:id/delete", controller.deleteProduct);

module.exports = router;
