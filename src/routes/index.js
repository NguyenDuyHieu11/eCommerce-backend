'use strict'

const express = require('express');
const router = express.Router();

// Authentication & Access routes
router.use('/v1/api', require('./access'));

// API Key Management routes
router.use('/v1/api/keys', require('./keys'));

// Product routes
router.use('/v1/api/products', require('./product'));

// Shop Management routes
router.use('/v1/api/shops', require('./shop'));

// Cart routes (NEW)
router.use('/v1/api/cart', require('./cart'));

// Notification routes
router.use('/v1/api/notifications', require('./notification'));
module.exports = router;