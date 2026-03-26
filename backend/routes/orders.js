const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Setting = require('../models/Setting');
const { protect } = require('../middleware/auth');

// @POST /api/orders — Create order
router.post('/', protect, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod = 'stripe' } = req.body;
        if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

        let subtotal = 0;
        const enrichedItems = [];

        for (const item of items) {
            const product = await Product.findByPk(item.product);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
            }

            // Reduce stock
            await product.update({ stock: product.stock - item.quantity });

            const lineTotal = parseFloat(product.price) * item.quantity;
            subtotal += lineTotal;

            enrichedItems.push({
                productId: product.id,
                name: product.name,
                quantity: item.quantity,
                price: parseFloat(product.price),
                image: product.images?.[0] || null,
                subtotal: lineTotal,
            });
        }

        let shippingCost = 99; // Default
        const shippingSetting = await Setting.findOne({ where: { setting_key: 'shipping' } });
        if (shippingSetting) {
            const parsedShipping = parseFloat(shippingSetting.value);
            if (!isNaN(parsedShipping)) shippingCost = parsedShipping;
        }

        let gstPercentage = 18;
        const gstSetting = await Setting.findOne({ where: { setting_key: 'gst' } });
        if (gstSetting) {
            const parsedGst = parseFloat(gstSetting.value);
            if (!isNaN(parsedGst)) gstPercentage = parsedGst;
        }

        const tax = parseFloat((subtotal * (gstPercentage / 100)).toFixed(2));
        const totalAmount = parseFloat((subtotal + shippingCost + tax).toFixed(2));

        const order = await Order.create({
            userId: req.user.id,
            items: enrichedItems,
            shippingAddress,
            paymentMethod,
            subtotal: parseFloat(subtotal.toFixed(2)),
            shippingCost,
            tax,
            totalAmount,
        });

        res.status(201).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/orders/my — Get user's orders
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
        });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/orders/:id — Get single order
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const user = await User.findByPk(order.userId, { attributes: ['id', 'name', 'email'] });
        const result = order.toJSON();
        result.user = user;
        res.json({ success: true, order: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/orders/:id/cancel — Cancel an order
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Ensure user owns the order
        if (order.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled' });
        }

        if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
            return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already been shipped or delivered' });
        }

        // Restore stock
        for (const item of order.items) {
            const product = await Product.findByPk(item.productId);
            if (product) {
                await product.update({ stock: product.stock + item.quantity });
            }
        }

        await order.update({ orderStatus: 'cancelled' });

        const user = await User.findByPk(order.userId, { attributes: ['id', 'name', 'email'] });
        const result = order.toJSON();
        result.user = user;

        res.json({ success: true, message: 'Order cancelled successfully', order: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
