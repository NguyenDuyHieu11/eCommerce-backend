'use strict'

const JWT = require('jsonwebtoken')
const KeyTokenService = require('../services/keyToken.service')
const AppError = require('../error/AppError')

const HEADER = {
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization'
}

const authentication = async (req, res, next) => {
    try {
        // 1. Check x-client-id header (userId)
        const userId = req.headers[HEADER.CLIENT_ID]
        if (!userId) {
            return res.status(401).json({ message: 'Missing x-client-id header' })
        }

        // 2. Get keyStore (contains publicKey) for this user
        const keyStore = await KeyTokenService.findByUserId(userId)
        if (!keyStore) {
            return res.status(401).json({ message: 'Invalid client' })
        }

        // 3. Get access token from Authorization header
        const authHeader = req.headers[HEADER.AUTHORIZATION]
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Missing or invalid Authorization header' })
        }
        const accessToken = authHeader.split(' ')[1]

        // 4. Verify token with public key
        const decoded = JWT.verify(accessToken, keyStore.publicKey, {
            algorithms: ['RS256']
        })

        // 5. Check if userId in token matches header
        if (decoded.userId !== userId) {
            return res.status(401).json({ message: 'Invalid user' })
        }

        // 6. Attach user info and keyStore to request
        req.user = decoded          // { userId, email, iat, exp }
        req.keyStore = keyStore     // for logout (to delete key)

        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' })
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' })
        }
        next(error)
    }
}

module.exports = authentication