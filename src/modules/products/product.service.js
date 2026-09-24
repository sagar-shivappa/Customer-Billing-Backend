const Product = require("./product.model");

/**
 * Create Product
 */
const createProduct = async (productData) => {
    // Check if product code already exists
    const existingProduct = await Product.findOne({
        productCode: productData.productCode
    });

    if (existingProduct) {
        throw new Error("Product code already exists.");
    }

    // Create product
    const product = await Product.create(productData);

    return product;
};

/**
 * Get All Products
 */
const getProducts = async () => {
    const products = await Product.find().sort({
        createdAt: -1
    });

    return products;
};

/**
 * Get Product By Id
 */
const getProductById = async (id) => {
    const product = await Product.findById(id);

    if (!product) {
        throw new Error("Product not found.");
    }

    return product;
};

/**
 * Update Product
 */
const updateProduct = async (id, productData) => {

    const product = await Product.findById(id);

    if (!product) {
        throw new Error("Product not found.");
    }

    // Check duplicate product code
    if (productData.productCode) {

        const duplicate = await Product.findOne({
            productCode: productData.productCode,
            _id: { $ne: id }
        });

        if (duplicate) {
            throw new Error("Product code already exists.");
        }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        productData,
        {
            new: true,
            runValidators: true
        }
    );

    return updatedProduct;
};

/**
 * Delete Product
 */
const deleteProduct = async (id) => {

    const product = await Product.findById(id);

    if (!product) {
        throw new Error("Product not found.");
    }

    await Product.findByIdAndDelete(id);

    return;
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};