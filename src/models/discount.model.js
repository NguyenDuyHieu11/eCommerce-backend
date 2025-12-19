'use strict'

const { Schema } = require("mongoose")
const { model, Schema, Types  } = require('mongoose')

const COLLECTION_NAME = 'discounts'
const DOCUMENT_NAME = 'discount'


const discountSchema = new Schema({
    discount_name: {type: String, requried: true},
    discount_description: {type: String, required: true},
    discount_type: {type: String, default: 'fixed amount'}, // percentage
    discount_value: { type: Number, requried: true} ,// 10.000 , 10
    discount_code: { type: String, required: true},
    discount_start_date: {type: Date, required: true},
    discount_end_date: {type: Date, required: true},
    discount_maximum_uses: {type: Number, required: true},// so luong discount duoc ap dung toi da
    discount_uses_count: {type: Number, required: true}, // so discount da su dung
    discount_user_used: {type: Array, default: []} ,// ai da su dung
    discount_max_uses_per_user: {type: Number, required: true},
    discount_min_order_value: {type: Number, required: true},
    discount_shopId: {type: Schema.Types.ObjectId, ref: 'Shop'},
    discount_is_active: {type: Boolean, default: true},
    discount_apply_to: {type: String, requried: true, enum: ['all', 'specific']},
    discount_product_ids: {type: Array, default: []} // so san pham duoc ap dung
},
{
    timestamps: true,
    collection: COLLECTION_NAME
})


module.exports = {
    discount: model(DOCUMENT_NAME, discountSchema)
}