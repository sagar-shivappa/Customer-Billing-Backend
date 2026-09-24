const productService = require("./product.service");

/**
 * Create Product
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get All Products
 * GET /api/products
 */
const getProducts = async (req, res, next) => {
    try {
        const products = await productService.getProducts();

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Product By Id
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await productService.getProductById(id);

        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update Product
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        const updatedProduct = await productService.updateProduct(id, req.body);

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete Product
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        await productService.deleteProduct(id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};