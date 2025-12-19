'use strict'

const { Schema } = require("mongoose")
const { model, Schema, Types  } = require('mongoose')

const COLLECTION_NAME = Inventories
const DOCUMENT_NAME = Inventory


const inventorySchema = new Schema({
    inven_productId: {type: Schema.Types.ObjectId, ref: 'Product'},
    inven_location: {type: String, default: 'unknown'},
    inven_stock: {type: Number, required: true},
    inven_shopId: {ref: 'Shop', type: Schema.Types.ObjectId},
    inven_preservation: {type: Array, defaul: []}
},
{
    timestamps: true,
    collection: COLLECTION_NAME
})


module.exports = {
    inventory: model(DOCUMENT_NAME, inventorySchema)
}