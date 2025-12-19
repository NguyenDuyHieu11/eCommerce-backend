'use strict'
const { mongo } = require('mongoose')
const checkConnect = require('../helpers/check.connect')
const mongoose = require('mongoose')
const connectString = `mongodb://localhost:27017/wsv-ecommerce`


class Database {

    constructor() {
        this.connect()
    }

    connect(type = 'mongodb') {
        if (type === 'mongodb') {
            mongoose.set('debug', true)
            mongoose.set('debug', { color: true })
        }        
        mongoose.connect(connectString, {
            maxPoolSize: 50
        }).then( () => {
            console.log('Connected to MongoDB')
            checkConnect.checkOverload()
        }).catch( (err) => {
            console.error('Error connecting to MongoDB:', err)
        })
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }

        return Database.instance
    }

}

const instance = Database.getInstance()
module.exports = instance