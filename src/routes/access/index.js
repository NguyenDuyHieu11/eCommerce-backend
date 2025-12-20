'use strict'

const express = require('express');
const accessController = require('../../controllers/access.controller');
const authentication = require('../../middlewares/authentication');
const router = express.Router();

// Public routes
router.post('/shop/signup', accessController.signUp);
router.post('/shop/login', accessController.login);

// Protected routes (require auth)
router.post('/shop/logout', authentication, accessController.logout);

module.exports = router;