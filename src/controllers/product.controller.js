'use strict'
const AppError = require('../error/AppError');
const ProductService = require('../services/product.service');

class ProductController {

    createProduct = async (req, res, next) => {
        try {
            const type = req.body.product_type || req.body.type;
            if (!type) throw new AppError('Missing product_type (or type)', 400);

            // Ensure payload contains product_type consistently for the factory classes
            const payload = { ...req.body, product_type: type };

            // Without auth wiring yet, require product_shop to be passed explicitly
            if (!payload.product_shop) throw new AppError('Missing product_shop', 400);

            const newProduct = await ProductService.createProduct(type, payload);
            return res.status(201).json({
                message: "Product created successfully",
                status: "success",
                data: newProduct
            })
        } catch (error) {
            next(error);
        }

        // query //
        getAllDraftForShop = async (req, res, next) => {
            try {
                const allDrafts = await ProductService.findAllDraftForShop({product_shop: req.shop._id});
                return res.status(200).json({
                    message: "All drafts fetched successfully",
                    status: "success",
                    data: allDrafts
                })

            } catch (error) {
                next(error);
            }
        }
    }
}

module.exports = new ProductController();