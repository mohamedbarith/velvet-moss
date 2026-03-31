const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @GET /api/payments/razorpay-key
router.get('/razorpay-key', (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

// @POST /api/payments/create-razorpay-order
router.post('/create-razorpay-order', protect, async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        const amountInPaise = Math.round(parseFloat(order.totalAmount) * 100);

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: orderId.toString() // Optional, useful for mapping
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({ 
            success: true, 
            orderId: orderId, 
            razorpayOrderId: razorpayOrder.id, 
            amount: razorpayOrder.amount 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @POST /api/payments/verify-payment
router.post('/verify-payment', protect, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            await Order.update(
                { paymentStatus: 'paid', orderStatus: 'confirmed', stripePaymentId: razorpay_payment_id },
                { where: { id: orderId } }
            );
            const order = await Order.findByPk(orderId);
            res.json({ success: true, message: 'Payment verified successfully!', order });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
