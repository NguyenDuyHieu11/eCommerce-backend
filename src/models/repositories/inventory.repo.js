'use strict'
const { model } = require('mongoose')
const { inventory } = require('../inventory.model')


const insertInventory = async({
        productId, shopId, stock, location = 'unknown'
}) => {
    return await inventory.create({
        inven_productId: productId,
        inven_location: location,
        inven_stock:tock,
        inven_shopId: shopId
    })
}


module.exports = {
    insertInventory: model('insertInventory', insertInventory)
}