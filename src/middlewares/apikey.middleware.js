"use strict"

const ApiKeyService = require('../services/apikey.service')

// header: X-API-KEY: <keyId>.<secret>
module.exports = async function apiKeyMiddleware(req, res, next) {
  try {
    const header = req.get('X-API-KEY') || req.get('x-api-key')
    if (!header) return res.status(401).json({ message: 'API key required' })
    const doc = await ApiKeyService.verifyToken(header)
    if (!doc) return res.status(401).json({ message: 'Invalid API key' })

    // attach minimal info
    req.apiKey = { keyId: doc.keyId, scopes: doc.scopes }
    req.shop = { _id: doc.shop }

    // async increment usage without blocking response
    ApiKeyService.incrementUsage(doc.keyId).catch((e) => console.error('inc usage error', e))

    next()
  } catch (error) {
    console.error('apiKey middleware error', error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}
