'use strict'

const { cart } = require('../models/cart.model')
const { NotFoundError } = require('../error/AppError')

/*
1. Add product to cart: User
2. +/- quantity: User
3. Get list cart: User
4. Delete cart: User
5. Delete item from cart: User
*/

class CartService {

    // 1. Create cart or add product to existing cart
    static async createUserCart({ userId, product }) {
        const query = { cart_userId: userId, cart_state: 'active' }
        const updateOrInsert = {
            $addToSet: {
                cart_products: product
            }
        }
        const options = { upsert: true, new: true }

        return await cart.findOneAndUpdate(query, updateOrInsert, options)
    }

    // 2. Update product quantity in cart
    static async updateQuantity({ userId, product }) {
        const { productId, quantity } = product
        const query = {
            cart_userId: userId,
            'cart_products.productId': productId,
            cart_state: 'active'
        }
        const update = {
            $inc: {
                'cart_products.$.quantity': quantity
            }
        }
        const options = {
            new: true
        }

        return await cart.findOneAndUpdate(query, update, options)
    }

    // Main method: Add to cart (handles both new and existing carts)
    static async addToCart({ userId, product = {} }) {
        // Find user's active cart
        const userCart = await cart.findOne({ cart_userId: userId, cart_state: 'active' })

        // If no cart exists, create new cart with the product
        if (!userCart) {
            return await CartService.createUserCart({ userId, product })
        }

        // If cart exists but is empty, add the product
        if (!userCart.cart_products.length) {
            userCart.cart_products = [product]
            return await userCart.save()
        }

        // Check if product already exists in cart
        const existingProduct = userCart.cart_products.find(
            (p) => p.productId === product.productId
        )

        if (existingProduct) {
            // Product exists, update quantity
            return await CartService.updateQuantity({ userId, product })
        }

        // Product doesn't exist, add new product to cart
        return await CartService.createUserCart({ userId, product })
    }

    // 3. Get list cart items
    static async getListCart({ userId }) {
        return await cart.findOne({ cart_userId: userId, cart_state: 'active' })
            .lean()
    }

    // 4. Delete entire cart (set state to 'completed' or remove)
    static async deleteCart({ userId }) {
        return await cart.findOneAndDelete({ cart_userId: userId, cart_state: 'active' })
    }

    // 5. Delete a specific item from cart
    static async deleteItemFromCart({ userId, productId }) {
        const query = { cart_userId: userId, cart_state: 'active' }
        const update = {
            $pull: {
                cart_products: { productId }
            }
        }
        const options = { new: true }

        return await cart.findOneAndUpdate(query, update, options)
    }

    // Bonus: Update cart item (replace entire product info)
    static async updateCartItem({ userId, product }) {
        const { productId } = product
        const query = {
            cart_userId: userId,
            'cart_products.productId': productId,
            cart_state: 'active'
        }
        const update = {
            $set: {
                'cart_products.$': product
            }
        }
        const options = { new: true }

        return await cart.findOneAndUpdate(query, update, options)
    }
}

module.exports = CartService
