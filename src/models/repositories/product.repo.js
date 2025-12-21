'use strict'

const { product, electronic, clothing, furniture } = require('../product.model');

const findAllDraftForShop = async ( {query, limit, skip} ) => {
    return await product.find(query).
        populate('product_shop', 'name email -_id').
        sort({updatedAt: -1}).
        skip(skip).
        limit(limit).
        lean().
        exec();
}

const getProductById = async (productId) => {
    return await product.findOne({_id: convertToObjecIdMongodb(productId)}).lean()
}

const checkProductByServer = async(products) => {
    return await Promise.all(products.map(async product => {
        const foundProduct = await getProductById(product.productId)
        if(foundProduct) {
            return { 
                price: foundProduct.price,
                quantity: product.quantity,
                productId: product.productId
            }
        }
    }))
}

module.exports = {
    findAllDraftForShop,
    checkProductByServer,
    getProductById
}