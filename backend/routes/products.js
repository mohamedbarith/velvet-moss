const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/auth');

// ==========================
// GET ALL PRODUCTS
// ==========================
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, search, sort = 'newest', featured, minPrice, maxPrice } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, parseInt(limit));
        const offset = (pageNum - 1) * limitNum;

        const where = {};
        if (category) where.category = category;
        if (featured) where.isFeatured = true;
        if (search) where.name = { [Op.like]: `%${search}%` };
        if (minPrice) where.price = { ...(where.price || {}), [Op.gte]: parseFloat(minPrice) };
        if (maxPrice) where.price = { ...(where.price || {}), [Op.lte]: parseFloat(maxPrice) };

        const orderMap = {
            newest: [['createdAt', 'DESC']],
            price_asc: [['price', 'ASC']],
            price_desc: [['price', 'DESC']],
            rating: [['avgRating', 'DESC']],
        };

        const { count, rows } = await Product.findAndCountAll({
            where,
            order: orderMap[sort] || [['createdAt', 'DESC']],
            limit: limitNum,
            offset,
        });

        res.json({
            success: true,
            products: rows,
            pagination: {
                total: count,
                page: pageNum,
                totalPages: Math.ceil(count / limitNum),
                limit: limitNum,
            },
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// GET CATEGORIES
// ==========================
router.get('/categories', async (req, res) => {
    const categories = ['Art', 'Crafts', 'Jewelry', 'Gifts', 'Home Decor', 'Clothing'];
    res.json({ success: true, categories });
});

// ==========================
// GET RECENT REVIEWS
// ==========================
router.get('/reviews/recent', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { showOnHomepage: true },
            order: [['createdAt', 'DESC']],
            limit: 6
        });

        res.json({ success: true, reviews });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// GET SINGLE PRODUCT
// ==========================
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const reviews = await Review.findAll({
            where: { productId: product.id },
            order: [['createdAt', 'DESC']]
        });

        const productData = product.toJSON();
        productData.reviews = reviews;

        res.json({ success: true, product: productData });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// CREATE PRODUCT (ADMIN)
// ==========================
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            stock,
            isFeatured,
            tags,
            imagePosition,
            images // ✅ Cloudinary URLs
        } = req.body;

        const tagsArr = typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        const product = await Product.create({
            name,
            description,
            price,
            originalPrice: originalPrice || null,
            category,
            stock: parseInt(stock) || 0,
            isFeatured: isFeatured === 'true' || isFeatured === true,
            tags: tagsArr,
            images: images || [], // ✅ Save cloud URLs
            imagePosition: imagePosition || 'center'
        });

        res.status(201).json({
            success: true,
            message: 'Product created!',
            product
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// UPDATE PRODUCT (ADMIN)
// ==========================
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const {
            name,
            description,
            price,
            originalPrice,
            category,
            stock,
            isFeatured,
            tags,
            imagePosition,
            images // ✅ Cloudinary URLs
        } = req.body;

        const tagsArr = typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : (product.tags || []);

        await product.update({
            name: name || product.name,
            description: description || product.description,
            price: price || product.price,
            originalPrice: originalPrice || product.originalPrice,
            category: category || product.category,
            stock: stock !== undefined ? parseInt(stock) : product.stock,
            isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured,
            tags: tagsArr,
            images: images || product.images, // ✅ Use cloud images
            imagePosition: imagePosition || product.imagePosition
        });

        res.json({
            success: true,
            message: 'Product updated!',
            product
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// DELETE PRODUCT
// ==========================
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await product.destroy();

        res.json({
            success: true,
            message: 'Product deleted'
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================
// ADD REVIEW
// ==========================
router.post('/:id/reviews', protect, async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const existing = await Review.findOne({
            where: { productId: product.id, userId: req.user.id }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Already reviewed' });
        }

        const { rating, comment } = req.body;

        await Review.create({
            rating: parseInt(rating),
            comment,
            userId: req.user.id,
            productId: product.id,
            name: req.user.name
        });

        const allReviews = await Review.findAll({ where: { productId: product.id } });

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        await product.update({
            avgRating: parseFloat(avgRating.toFixed(2)),
            numReviews: allReviews.length
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;