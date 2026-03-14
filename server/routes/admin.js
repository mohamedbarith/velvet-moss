const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/admin/dashboard
router.get('/dashboard', protect, adminOnly, async (req, res) => {
    try {
        const totalUsers = await User.count({ where: { role: 'user' } });
        const totalProducts = await Product.count();
        const totalOrders = await Order.count();

        const revenueResult = await Order.findOne({
            attributes: [[sequelize.fn('SUM', sequelize.col('totalAmount')), 'total']],
            where: { paymentStatus: 'paid' },
        });
        const totalRevenue = parseFloat(revenueResult?.dataValues?.total || 0);

        const recentOrders = await Order.findAll({
            order: [['createdAt', 'DESC']],
            limit: 10,
        });
        // Attach user info
        const ordersWithUser = await Promise.all(recentOrders.map(async (o) => {
            const user = await User.findByPk(o.userId, { attributes: ['id', 'name', 'email'] });
            return { ...o.toJSON(), user };
        }));

        const lowStockProducts = await Product.findAll({
            where: { stock: { [Op.lt]: 10 } },
            order: [['stock', 'ASC']],
            limit: 10,
        });

        res.json({ success: true, stats: { totalUsers, totalProducts, totalOrders, totalRevenue }, recentOrders: ordersWithUser, lowStockProducts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/admin/orders
router.get('/orders', protect, adminOnly, async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const orders = await Order.findAll({ order: [['createdAt', 'DESC']], limit: parseInt(limit), offset });
        const withUser = await Promise.all(orders.map(async (o) => {
            const user = await User.findByPk(o.userId, { attributes: ['id', 'name', 'email'] });
            return { ...o.toJSON(), user };
        }));
        res.json({ success: true, orders: withUser });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/admin/orders/:id
router.put('/orders/:id', protect, adminOnly, async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const updates = {};
        if (orderStatus) updates.orderStatus = orderStatus;
        if (paymentStatus) updates.paymentStatus = paymentStatus;
        if (orderStatus === 'delivered') updates.deliveredAt = new Date();

        await order.update(updates);
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @DELETE /api/admin/orders/:id
router.delete('/orders/:id', protect, adminOnly, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        await order.destroy();
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/admin/users/:id/toggle
router.put('/users/:id/toggle', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        await user.update({ isActive: !user.isActive });
        res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @POST /api/admin/users/admin
router.post('/users/admin', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        const newAdmin = await User.create({
            name,
            email,
            password,
            role: 'admin',
            isActive: true
        });
        const userObj = newAdmin.toJSON();
        delete userObj.password;
        res.status(201).json({ success: true, message: 'Admin created successfully', user: userObj });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/admin/contacts
router.get('/contacts', protect, adminOnly, async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, contacts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/admin/contacts/:id/read
router.put('/contacts/:id/read', protect, adminOnly, async (req, res) => {
    try {
        await Contact.update({ isRead: true }, { where: { id: req.params.id } });
        res.json({ success: true, message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/admin/reviews
router.get('/reviews', protect, adminOnly, async (req, res) => {
    try {
        const reviews = await Review.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/admin/reviews/:id/homepage
router.put('/reviews/:id/homepage', protect, adminOnly, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        
        await review.update({ showOnHomepage: !review.showOnHomepage });
        res.json({ success: true, message: `Review ${review.showOnHomepage ? 'added to' : 'removed from'} homepage`, review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', protect, adminOnly, async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
        
        await review.destroy();
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
