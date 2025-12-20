'use strict'

const express = require('express')
const cartController = require('../../controllers/cart.controller')
const authentication = require('../../middlewares/authentication')
const router = express.Router()

// All cart routes require authentication
router.use(authentication)

// Get user's cart
router.get('/', cartController.getCart)

// Add product to cart
router.post('/', cartController.addToCart)

// Update product quantity
router.patch('/quantity', cartController.updateQuantity)

// Delete entire cart
router.delete('/', cartController.deleteCart)

// Delete specific item from cart
router.delete('/item', cartController.deleteItem)

module.exports = router