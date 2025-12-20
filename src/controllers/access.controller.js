'use strict'
const AccessService = require('../services/access.service');

class AccessController {

    signUp = async (req, res, next) => {
        try {
            console.log(`[P]::signUp::`, req.body);
            return res.status(201).json(await AccessService.signUp(req.body.name, req.body.email, req.body.password));
        } catch (error) {
            next(error);
        }
    }

    // Login
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body
            const result = await AccessService.login(email, password)
            return res.status(result.code).json(result)
        } catch (error) {
            next(error)
        }
    }

    // Logout (requires authentication middleware)
    logout = async (req, res, next) => {
        try {
            const result = await AccessService.logout(req.keyStore)
            return res.status(200).json(result)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new AccessController()