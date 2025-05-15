// Controller for handling product-related operations

const prisma = require('../utils/prisma');

exports.getProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.createProduct = async (req, res) => {
    const { name, price, description } = req.body;
    try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                price,
                description,
            },
        });

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, description } = req.body;

    try {
        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id, 10) },
            data: { name, price, description },
        });

        res.status(200).json(updatedProduct);
    } catch (error) {
        if (error.code === 'P2025') { // Prisma-specific error for record not found
            return res.status(404).json({ message: 'Product not found' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await prisma.product.delete({
            where: { id: parseInt(id, 10) },
        });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const newCategory = await prisma.category.create({
            data: {
                name,
                description,
            },
        });

        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id, 10) },
            data: { name, description },
        });

        res.status(200).json(updatedCategory);
    } catch (error) {
        if (error.code === 'P2025') { // Prisma-specific error for record not found
            return res.status(404).json({ message: 'Category not found' });
        }
        console.error('Error updating category:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id, 10) },
        });

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        await prisma.category.delete({
            where: { id: parseInt(id, 10) },
        });

        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
