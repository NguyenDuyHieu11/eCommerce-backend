'use strict'

const { Schema } = require("mongoose")
const { model, Schema, Types  } = require('mongoose')

const COLLECTION_NAME = 'NOTIFICATIONS'
const DOCUMENT_NAME = 'NOTIFICATION'


// ORDER-001: success order 
// ORDER-002: failed order
// PROMOTION-001: new promotion
// SHOP-001: new product
// => day la tuy y theo business logic

const notificationSchema = new Schema({
    noti_type: { type: String, enum: ['ORDER-001', 'ORDER-002', 'PROMOTION-001', 'SHOP-001'], required: true},
    noti_senderId: { type: Schema.Types.ObjectId, required: true, ref: 'Shop'},
    noti_receiverId: { type: Number, required: true},
    noti_content: { type: String, required: true}, 
    noti_options: { type: Object, default:{}} // this helps user to decide to receive noti from a specific shop or not
},
{
    timestamps: true,
    collection: COLLECTION_NAME
})


module.exports = {
    notification: model(DOCUMENT_NAME, notificationSchema)
}