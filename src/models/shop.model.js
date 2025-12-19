'use strict'

//!dmbg
const mongoose = require('mongoose'); // Erase if already required
const DOCUMENT_NAME = 'Shop';
const COLLECTION_NAME = 'Shops';

const shopSchema = new mongoose.Schema({
    name:{
        type:String,
        trim: true,
        maxLength:150,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim: true,
    },
    passwordHash:{
        type:String,
        required:true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },
    verify: {
        type: Boolean,
        default: false
    },
    roles: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

//Export the model
module.exports = mongoose.model('Shop', shopSchema);