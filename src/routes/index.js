'use strict'

const express = require('express');
const router = express.Router();

// Authentication & Access routes
router.use('/v1/api', require('./access'));

// API Key Management routes
router.use('/v1/api/keys', require('./keys'));

// Product routes
router.use('/v1/api/products', require('./product'));

// Shop Management routes (authenticated shop operations)
router.use('/v1/api/shops', require('./shop'));

// Welcome route (optional)
// router.get('/', (req, res) => {
//     return res.status(200).json({
//         message: 'Welcome to WSV eCommerce API',
//     })
// })

module.exports = router;