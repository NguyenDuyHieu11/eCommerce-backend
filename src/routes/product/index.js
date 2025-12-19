'use strict'

const express = require('express');
const productController = require('../../controllers/product.controller');
const router = express.Router();

router.use(authenticationV2)

// Create a new product
router.post('/', productController.createProduct);

// TODO: Add more product routes as needed
// router.get('/', productController.getAllProducts);
// router.get('/:id', productController.getProductById);
// router.patch('/:id', productController.updateProduct);
// router.delete('/:id', productController.deleteProduct);





module.exports = router;



