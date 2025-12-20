'use strict';

const { createTokenPair } = require('../auth/authUtils');
const shopModel = require('../models/shop.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KeyTokenService = require('./keyToken.service');

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
};

class AccessService {

    static signUp = async (name, email, password) => {
        console.log('[AccessService] signUp called with:', { name, email, password });

        try {
            const holderShop = await shopModel.findOne({ email }).lean();

            if (holderShop) {
                console.log('Email already in use.');
                return {
                    code: 400,
                    message: 'Email already in use'
                };
            }

            const passwordHash = await bcrypt.hash(password, 10);

            console.log('Creating new shop...');
            const newShop = await shopModel.create({
                name,
                email,
                passwordHash,
                roles: RoleShop.SHOP,
            });

            console.log('New shop created:', newShop);

            // Generate RSA key pair
            console.log('Generating RSA key pair...');
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                }
            });

            console.log('Keys generated successfully.');

            // Save public key to KeyTokenService
            console.log('Saving public key...');
            const publicKeyString = await KeyTokenService.createKeyToken({
                userId: newShop._id,
                publicKey,
            });


            if (!publicKeyString) {
                console.error('Failed to save publicKeyString');
                return {
                    code: 500,
                    message: 'Failed to save public key'
                };
            }

            // STEP 6: Create token pair
            console.log('Creating token pair...');
            const tokens = await createTokenPair(
                { userId: newShop._id, email },
                publicKeyString,
                privateKey
            );

            console.log('Tokens created successfully.');

            return {
                code: 201,
                metadata: {
                    shop: newShop,
                    tokens: tokens
                }
            };

        } catch (error) {
            console.error('[AccessService][Error]', error);
            return { code: 'error', message: error.message };
        }

    }
    static login = async (email, password) => {
        try {
            // 1. Check if shop exists
            const shop = await shopModel.findOne({ email }).lean()
            if (!shop) {
                return { code: 401, message: 'Shop not registered' }
            }

            // 2. Verify password
            const match = await bcrypt.compare(password, shop.passwordHash)
            if (!match) {
                return { code: 401, message: 'Invalid password' }
            }

            // 3. Generate new key pair
            const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
            })

            // 4. Save/update public key
            const publicKeyString = await KeyTokenService.createKeyToken({
                userId: shop._id,
                publicKey
            })

            // 5. Create token pair
            const tokens = await createTokenPair(
                { userId: shop._id.toString(), email },
                publicKeyString,
                privateKey
            )

            return {
                code: 200,
                metadata: {
                    shop: {
                        _id: shop._id,
                        name: shop.name,
                        email: shop.email
                    },
                    tokens
                }
            }
        } catch (error) {
            console.error('[AccessService] login error', error)
            return { code: 500, message: error.message }
        }
    }

    // NEW: Logout
    static logout = async (keyStore) => {
        const deleted = await KeyTokenService.removeKeyById(keyStore._id)
        return { code: 200, message: 'Logout successful' }
    }
}

module.exports = AccessService;
