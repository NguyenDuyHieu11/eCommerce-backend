'use strict'

const BadRequestError = require("../error/BadRequestError")
const { findCartById } = require('../models/repositories/cart.repo')
const { checkProductByServer } = require('../models/repositories/product.repo')
const { getDiscountAmount } = require('./discount.service')

class CheckoutService {
    
    /*
        Input:
        {
            cartId,
            userId,
            shop_order_ids: [
                {
                    shopId,
                    shop_discounts: [{ shopId, discountId, codeId }],
                    item_products: [{ productId, quantity, price }]
                }
            ]
        }
        
        Output:
        {
            shop_order_ids,           // original input
            shop_order_ids_new,       // with verified prices
            checkout_order: {
                totalPrice,           // sum before discounts
                totalDiscount,        // total discount amount
                feeShip,              // shipping fee
                totalCheckout         // final amount to pay
            }
        }
    */
    static async checkoutReview({ cartId, userId, shop_order_ids }) {
        // 1. Check if cart exists
        const foundCart = await findCartById(cartId)
        if (!foundCart) throw new BadRequestError('Cart does not exist')

        const checkout_order = {
            totalPrice: 0,      // original price
            feeShip: 0,         // shipping (can add logic later)
            totalDiscount: 0,   // total discounts
            totalCheckout: 0    // final price
        }
        const shop_order_ids_new = []

        // 2. Loop through each shop's order
        for (let i = 0; i < shop_order_ids.length; i++) {
            const { shopId, shop_discounts = [], item_products = [] } = shop_order_ids[i]

            // 3. Verify products exist & get real prices from server
            const checkedProducts = await checkProductByServer(item_products)
            
            // If any product not found, checkedProducts will have undefined
            if (!checkedProducts.every(p => p)) {
                throw new BadRequestError('Some products do not exist')
            }

            // 4. Calculate raw total for this shop (before discount)
            const checkoutPrice = checkedProducts.reduce((acc, product) => {
                return acc + (product.price * product.quantity)
            }, 0)

            // Add to overall total
            checkout_order.totalPrice += checkoutPrice

            // Build item checkout data for this shop
            const itemCheckout = {
                shopId,
                shop_discounts,
                priceRaw: checkoutPrice,        // before discount
                priceApplyDiscount: checkoutPrice,  // after discount
                item_products: checkedProducts
            }

            // 5. Apply discounts (if any)
            if (shop_discounts.length > 0) {
                // Assume getDiscountAmount returns { totalPrice, discount, totalOrder }
                const discountResult = await getDiscountAmount({
                    codeId: shop_discounts[0].codeId,
                    userId,
                    shopId,
                    products: checkedProducts
                })

                // Accumulate discount
                checkout_order.totalDiscount += discountResult.discount

                // Update price after discount
                if (discountResult.discount > 0) {
                    itemCheckout.priceApplyDiscount = checkoutPrice - discountResult.discount
                }
            }

            shop_order_ids_new.push(itemCheckout)
        }

        // 6. Calculate final checkout total
        checkout_order.totalCheckout = checkout_order.totalPrice 
            - checkout_order.totalDiscount 
            + checkout_order.feeShip

        return {
            shop_order_ids,
            shop_order_ids_new,
            checkout_order
        }
    }

    static async orderByUser() {
        shop_order_ids_new
    }
}

module.exports = CheckoutService