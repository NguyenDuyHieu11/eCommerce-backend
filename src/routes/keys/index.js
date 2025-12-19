"use strict"



const express = require('express')
const router = express.Router()
const ApiKeyService = require('../../services/apikey.service')
const apiKeyMiddleware = require('../../middlewares/apikey.middleware')

// // NOTE: these endpoints assume the shop is authenticated (for now we expect req.shop set by your auth middleware)
// // For convenience here, we'll require a `shopId` in body when creating keys if no auth middleware is present.

// // Create API key (authenticated shop should call this)
// (must recheck for the field _id in req.shop, likely defined in the middleware)
router.post('/', async (req, res) => {
    try {
        const shopId = req.shop && req.shop._id ? req.shop._id : req.body.shopId;
        if (!shopId) {
            const { name, scopes, expiresIn } = req.body;
            // expiresIn expected in ms (optional)
            const result = await ApiKeyService.createKey({ shopId, name, scopes: scopes || {}, expiresIn: expiresIn || null})
            return res.status(201).json({ keyId: result.keyId, token: result.token });
        }
    } catch (error) {
        console.error('create key error', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

// list keys for shop
router.get('/', async (req, res) => {
    try {
        const shopId = req.shop && req.shop._id ? req.shop._id : req.body.shopId;
        if (!shopId) return res.status(400).json({ message: 'shopId required' });
        const list = await ApiKeyService.listKeys(shopId);
        return res.json(list);
    } catch (error) {
        console.error('list keys error', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

// revoke key (shop must own)
router.post('/:keyId/revoke', async (req, res) => {
    try {
        const shopId = req.shop && req.shop._id ? req.shop._id : req.body.shopId;
        const { keyId } = req.params;
        if (!shopId) return res.status(404).json({ message: 'shopId required' });
        await ApiKeyService.revokeKey(keyId, shopId);
        return res.json({ ok: 1 });
    } catch (error) {
        console.error('revoke key error', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// rotate (generate new secret for keyId)
router.post('/:keyId/rotate', async (req, res) => {
    try {
        const shopId = req.shop && req.shop._id ? req.shop._id : req.body.shopId;
        const { keyId } = req.params;
        if (!shopId) return res.status(400).json({ message: 'shopId required' });
        const token = await ApiKeyService.rotateKey(keyId, shopId);
        if (!token) return res.status(404).json({ message: 'Key not found' });
        return res.json({ token });   
    } catch (error) {
        console.log('rotate key error', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// example protected route using API key middleware
// router.get('/protected-example', apiKeyMiddleware, (req, res) => {
//     return res.json({ message: 'ok', shop: req.shop, apiKey: req.apiKey });
// });

module.exports = router;