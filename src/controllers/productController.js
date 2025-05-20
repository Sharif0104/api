// Controller for handling product-related operations

const prisma = require('../utils/prisma');

// Helper: select only needed fields for product
const productSelect = {
    id: true,
    name: true,
    price: true,
    description: true,
    createdAt: true
};

exports.getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const skip = (page - 1) * pageSize;
        const filter = {};
        if (req.query.name) filter.name = { contains: req.query.name, mode: 'insensitive' };
        // Add more filters as needed
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: filter,
                skip,
                take: pageSize,
                select: productSelect
            }),
            prisma.product.count({ where: filter })
        ]);
        res.status(200).json({ products, total, page, pageSize });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getProductById = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: productSelect
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
            data: { name, price, description },
            select: productSelect
        });
        res.status(201).json(newProduct);
    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint failed
            return res.status(409).json({ message: 'Product with this name already exists' });
        }
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateProduct = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });
    const { name, price, description } = req.body;
    try {
        const updatedProduct = await prisma.product.update({
            where: { id },
            data: { name, price, description },
            select: productSelect
        });
        res.status(200).json(updatedProduct);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found' });
        }
        if (error.code === 'P2002') {
            return res.status(409).json({ message: 'Product with this name already exists' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: productSelect
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await prisma.product.delete({ where: { id } });
        res.status(204).send();
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
