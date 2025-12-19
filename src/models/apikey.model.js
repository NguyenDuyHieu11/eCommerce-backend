"use strict"

const mongoose = require('mongoose')
const { Schema } = mongoose

const apiKeySchema = new Schema({
  keyId: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
  hashedKey: { type: String, required: true },
  scopes: { type: [String], default: [] },
  revoked: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null },
  usageCount: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: null }
}, {
  timestamps: true
})

module.exports = mongoose.model('ApiKey', apiKeySchema)
