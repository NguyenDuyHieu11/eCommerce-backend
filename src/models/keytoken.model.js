"use strict"

const mongoose = require('mongoose')
const { Schema } = mongoose

const keyTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  publicKey: { type: String, required: true },
}, {
  timestamps: true
})

module.exports = mongoose.model('KeyToken', keyTokenSchema)
