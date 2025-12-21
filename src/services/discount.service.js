'use strict'

const BadRequestError = require("../error/BadRequestError")
const { discount } = require("../models/discount.model")
const { convertToObjectIdMongodb } = require('../utils')
const { findAllProduct } = require('') 
// 1. generator discount code [Shope | Admin]
// 2. get all discount codes [User | Shop]
// 3. get all product by discount code [User
// 4. get discount amount [User]
// 5. delete discount code [admin | shop]
// 6. cancel discount code [user]

class DiscountService {

    static async createDiscountCode(payload) {
        const {code, start_date, end_date, is_active, shopId,
               min_order_value, product_ids, apply_to,
               name, description, type, value, max_value, max_uses, uses_count, users_useds,
               max_uses_per_user
        } = payload
        // kiem tra
        if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
            throw new BadRequestError('Discount code expired or not yet usable')
        }

        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError('Invalid date for discount')
        }

        //craete index for discount code
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: convertToObjectIdMongodb(shopId),
        }).lean()

        if (foundDiscount && foundDiscount.discount_is_active) {
            throw new BadRequestError('Discount exists')
        }

        // these might missing or wrong 
        const newDiscount = await discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_value: value,
            discount_code: code,
            discount_start_date: start_date,
            discount_end_date: end_date,
            discount_maximum_uses: max_uses,
            discount_uses_count: uses_count,
            discount_user_used: users_useds,
            discount_max_uses_per_user: max_uses_per_user,
            discount_min_order_value: min_order_value,
            discount_shopId: convertToObjectIdMongodb(shopId),
            discount_is_active: is_active,
            discount_apply_to: apply_to,
            discount_product_ids: apply_to === 'all' ? [] : product_ids
        })

        return newDiscount
    }

    static async updateDiscount({ discountId, shopId, updatePayload }) {
        // Find existing discount
        const foundDiscount = await discount.findOne({
            _id: convertToObjectIdMongodb(discountId),
            discount_shopId: convertToObjectIdMongodb(shopId),
        })

        if (!foundDiscount) {
            throw new BadRequestError('Discount not found')
        }

        // Validate dates if provided
        const startDate = updatePayload.start_date || foundDiscount.discount_start_date
        const endDate = updatePayload.end_date || foundDiscount.discount_end_date

        if (new Date(startDate) >= new Date(endDate)) {
            throw new BadRequestError('Start date must be before end date')
        }

        // Build update object - only include provided fields
        const updateData = {}
        if (updatePayload.name !== undefined) updateData.discount_name = updatePayload.name
        if (updatePayload.description !== undefined) updateData.discount_description = updatePayload.description
        if (updatePayload.type !== undefined) updateData.discount_type = updatePayload.type
        if (updatePayload.value !== undefined) updateData.discount_value = updatePayload.value
        if (updatePayload.code !== undefined) updateData.discount_code = updatePayload.code
        if (updatePayload.start_date !== undefined) updateData.discount_start_date = updatePayload.start_date
        if (updatePayload.end_date !== undefined) updateData.discount_end_date = updatePayload.end_date
        if (updatePayload.max_uses !== undefined) updateData.discount_maximum_uses = updatePayload.max_uses
        if (updatePayload.max_uses_per_user !== undefined) updateData.discount_max_uses_per_user = updatePayload.max_uses_per_user
        if (updatePayload.min_order_value !== undefined) updateData.discount_min_order_value = updatePayload.min_order_value
        if (updatePayload.is_active !== undefined) updateData.discount_is_active = updatePayload.is_active
        if (updatePayload.apply_to !== undefined) {
            updateData.discount_apply_to = updatePayload.apply_to
            updateData.discount_product_ids = updatePayload.apply_to === 'all' ? [] : (updatePayload.product_ids || [])
        } else if (updatePayload.product_ids !== undefined) {
            updateData.discount_product_ids = updatePayload.product_ids
        }

        const updatedDiscount = await discount.findByIdAndUpdate(
            discountId,
            updateData,
            { new: true }
        )

        return updatedDiscount
    }

    static async getAllDiscountCodes({
        code, shopId, userId, limit, page
    }) {
        const foundDiscount = await discount.findOne({
            discount_code: code,
            discount_shopId: shopId,


        })
        if (!foundDiscount || !foundDiscount.discount_is_active) {
                throw new NotFoundError('not exist')
        }

        const { discount_apply_to, discount_product_ids } = foundDiscount
        let product
        if (discount_apply_to === 'all') {
            // get all products
            products = await findAllProduct
        }
    }

    static async getDiscountAmount({ codeId, userId, shopId, products }) {
        const foundDiscount = await discount.findOne({
            discount_code: codeId,
            discount_shopId: convertToObjectIdMongodb(shopId)
        })
    
        if (!foundDiscount) throw new BadRequestError('Discount not found')
        if (!foundDiscount.discount_is_active) throw new BadRequestError('Discount expired')
    
        // Calculate total order value
        const totalOrder = products.reduce((acc, p) => acc + (p.price * p.quantity), 0)
    
        // Check minimum order value
        if (totalOrder < foundDiscount.discount_min_order_value) {
            throw new BadRequestError(`Minimum order value is ${foundDiscount.discount_min_order_value}`)
        }
    
        // Calculate discount
        let discountAmount = 0
        if (foundDiscount.discount_type === 'fixed_amount') {
            discountAmount = foundDiscount.discount_value
        } else if (foundDiscount.discount_type === 'percentage') {
            discountAmount = (totalOrder * foundDiscount.discount_value) / 100
            // Cap at max_value if set
            if (foundDiscount.discount_max_value) {
                discountAmount = Math.min(discountAmount, foundDiscount.discount_max_value)
            }
        }
    
        return {
            totalOrder,
            discount: discountAmount,
            totalPrice: totalOrder - discountAmount
        }
    }
}