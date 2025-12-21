'use strict'

const { product, clothing, electronic, furniture } = require('../models/product.model');
const AppError = require('../error/AppError');
const BadRequestError = require('../error/BadRequestError');
const { insertInventory } = require('../models/repositories/inventory.repo');
const { pushNotificationSystem } = require('./notification.service');

// define Factory class to create product
class ProductFactory {

    static productRegistry = {}

    static registerProductType( type, classRef) {
        ProductFactory.productRegistry[type] = classRef
    }

    static async createProduct(type, payload) {
        const productClass = ProductFactory.productRegistry[type]
        if (!productClass) throw new BadRequestError(`Invalid product type ${type}`);
        return new productClass(payload).createProduct();
    }
    
    // querry
    static async findAllDraftForShop({product_shop, limit = 50, skip = 0}) {
        const query = { product_shop, is_draft: true }
        return await findAllDraftForShop({query, limit, skip});
    }
}



// define base product class
class Product {
    constructor({
        product_name,
        product_thumbnail,
        product_description,
        product_price,
        product_quantity,
        product_type,
        product_shop,
        product_attributes,
    } = {}) {
        this.product_name = product_name;
        this.product_thumbnail = product_thumbnail;
        this.product_description = product_description;
        this.product_price = product_price;
        this.product_quantity = product_quantity;
        this.product_type = product_type;
        this.product_shop = product_shop;
        this.product_attributes = product_attributes;
    }

    async createProduct(product_id) {
        const newProduct = { ...this, _id: product_id}
        if (newProduct) {
            // add product_stock in inventory collection
            const invenData = await insertInventory({
                productId: newProduct._id,
                shopId: this.product_shop,
                stock: this.product_quantity
            })

            // push noti to system collection
            await pushNotificationSystem({
                type: 'SHOP-001',
                senderId: this.product_shop,
                receiverId: 1,
                options: {
                    product_name: this.product_name,
                    shop_name: this.product_shop
                }

            }).then(rs => console.log(rs))
            .catch(console.error)
            console.log(`InvenData::`, invenData)
        }

        return newProduct
    }
}

class Electronics extends Product {

    async createProduct() {
        const newElectronic = await electronic.create({
            ...this.product_attributes,
        })
        if (!newElectronic) throw new BadRequestError('error creating electronic product');
        const newProduct = await super.createProduct(newElectronic._id);
        if (!newProduct) throw new BadRequestError('error creating product');
        // Option B response: return the full attributes object, while DB stores the _id
        return {
            ...newProduct.toObject(),
            product_attributes: newElectronic,
        };
    }
}

class Clothing extends Product {
    async createProduct() {
        const newClothing = await clothing.create({
            ...this.product_attributes,
        })
        if (!newClothing) throw new BadRequestError('error creating clothing product');
        const newProduct = await super.createProduct(newClothing._id);
        if (!newProduct) throw new BadRequestError('error creating product');
        // Option B response: return the full attributes object, while DB stores the _id
        return {
            ...newProduct.toObject(),
            product_attributes: newClothing,
        };
    }
}

class Furniture extends Product {
    async createProduct() {
        const newFurniture = await furniture.create({
            ...this.product_attributes,
            product_shop: this.product_shop,
        })
        if (!newFurniture) throw new BadRequestError('error creating furniture product');
        const newProduct = await super.createProduct(newFurniture._id);
        if (!newProduct) throw new BadRequestError('error creating product');
        // Option B response: return the full attributes object, while DB stores the _id
        return {
            ...newProduct.toObject(),
            product_attributes: newFurniture,
        };
    }
}

ProductFactory.registerProductType('Electronics', Electronics);
ProductFactory.registerProductType('Clothing', Clothing);
ProductFactory.registerProductType('Furniture', Furniture);

module.exports = {
    ProductFactory,
}