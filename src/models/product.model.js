'use strict'

const { model, Schema, Types } = require('mongoose');
const DOCUMENT_NAME = 'Product';
const COLLECTION_NAME = 'Products';
const slugify = require('slugify');

const productSchema = new Schema({
    product_name: { type: String, require: true },
    product_thumbnail: { type: String, require: true },
    product_description: { type: String },
    product_price: { type: Number, require: true },
    product_quantity: { type: Number, require: true },
    product_type: { type: String, require: true, enum: [ 'Electronics', 'Clothing', 'Furniture' ] },
    product_shop: { type: Schema.Types.ObjectId, ref : 'Shop', require: true },
    product_attributes: { type: Schema.Types.Mixed, required: true},
    product_slug: String,
    product_ratingAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be at most 5'],
        set: (val) => Math.round(val * 10) / 10, //transform the value before storing
    },
    product_variations: {type: Array, default: []},
    is_draft: { type: Boolean, default: true, index: true, select: false},
    is_publish: { type: Boolean, default: false, index: true, select: false},
}, {
    collection: COLLECTION_NAME,
    timestamps: true
})

// document middleware: run before .save() and .create()...
productSchema.pre('save', function(next) {
    this.product_slug = slugify(this.product_name, { lower: true })
    next();
})

//clothing schema
const clothingSchema = new Schema({
    brand: { type: String, require: true },
    size: String,
    material: String,
}, {
    collection: 'clothing',
    timestamps: true
})

const electronicSchema = new Schema({
    manufacturer: { type: String, require: true },
    model: String,
    
}, {
    collection: 'electronics',
    timestamps: true
})

const furnitureSchema = new Schema({
    manufacturer: { type: String, require: true},
    model: String,color: String,
    product_shop: { type: Schema.Types.ObjectId, ref: 'Shop', require: true},
}, {
    collection: 'furniture',
    timestamps: true
})
module.exports = {
    product: model( DOCUMENT_NAME, productSchema),
    clothing: model( 'Clothing', clothingSchema),
    electronic: model( 'Electronic', electronicSchema),
    furniture: model( 'Furniture', furnitureSchema)
}