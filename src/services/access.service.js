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
}

module.exports = AccessService;
