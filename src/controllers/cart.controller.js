'use strict'

const CartService = require('../services/cart.service')

class CartController {

    // Add product to cart
    addToCart = async (req, res, next) => {
        try {
            const userId = req.user.userId
            const { product } = req.body

            const result = await CartService.addToCart({ userId, product })
            return res.status(200).json({
                message: 'Product added to cart successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    // Update product quantity
    updateQuantity = async (req, res, next) => {
        try {
            const userId = req.user.userId
            const { product } = req.body

            const result = await CartService.updateQuantity({ userId, product })
            return res.status(200).json({
                message: 'Cart updated successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    // Get user's cart
    getCart = async (req, res, next) => {
        try {
            const userId = req.user.userId

            const result = await CartService.getListCart({ userId })
            return res.status(200).json({
                message: 'Cart fetched successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    // Delete entire cart
    deleteCart = async (req, res, next) => {
        try {
            const userId = req.user.userId

            const result = await CartService.deleteCart({ userId })
            return res.status(200).json({
                message: 'Cart deleted successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    // Delete specific item from cart
    deleteItem = async (req, res, next) => {
        try {
            const userId = req.user.userId
            const { productId } = req.body

            const result = await CartService.deleteItemFromCart({ userId, productId })
            return res.status(200).json({
                message: 'Item removed from cart successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new CartController()