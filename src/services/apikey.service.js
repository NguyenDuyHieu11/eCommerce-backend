"use strict"

const crypto = require('crypto')
const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex')
const ApiKeyModel = require('../models/apikey.model')

class ApiKeyService {
  static generateTokenPair() {
    const keyId = crypto.randomBytes(6).toString('hex') // 12 hex chars
    const secret = crypto.randomBytes(32).toString('base64url')
    const token = `${keyId}.${secret}`
    return { keyId, secret, token }
  }

  static async createKey({ shopId, name = '', scopes = [], expiresIn = null }) {
    const { keyId, secret, token } = this.generateTokenPair()
    const hashedKey = sha256(secret)
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null

    const doc = await ApiKeyModel.create({
      keyId,
      name,
      shop: shopId,
      hashedKey,
      scopes,
      expiresAt
    })

    // return the token (plaintext) only once
    return { keyId: doc.keyId, token }
  }

  static async findByKeyId(keyId) {
    return ApiKeyModel.findOne({ keyId }).lean()
  }

  static async verifyToken(token) {
    if (!token || typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 2) return null
    const [keyId, secret] = parts
    const doc = await ApiKeyModel.findOne({ keyId })
    if (!doc) return null
    if (doc.revoked) return null
    if (doc.expiresAt && doc.expiresAt < new Date()) return null
    const hashed = sha256(secret)
    // constant-time compare
    const ok = crypto.timingSafeEqual(Buffer.from(hashed), Buffer.from(doc.hashedKey))
    if (!ok) return null
    return doc
  }

  static async revokeKey(keyId, shopId) {
    return ApiKeyModel.updateOne({ keyId, shop: shopId }, { $set: { revoked: true } })
  }

  static async rotateKey(keyId, shopId) {
    const secret = crypto.randomBytes(32).toString('base64url')
    const hashedKey = sha256(secret)
    const res = await ApiKeyModel.findOneAndUpdate({ keyId: keyId, shop: shopId }, { $set: { hashedKey } }, { new: true })
    if (!res) return null
    return `${keyId}.${secret}`
  }

  static async incrementUsage(keyId) {
    return ApiKeyModel.updateOne({ keyId }, { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } })
  }

  static async listKeys(shopId) {
    return ApiKeyModel.find({ shop: shopId }).select('-hashedKey').lean()
  }
}

module.exports = ApiKeyService
