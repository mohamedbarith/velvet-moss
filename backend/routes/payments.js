const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @POST /api/payments/create-payment-intent
router.post('/create-payment-intent', protect, async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

        const amountInPaise = Math.round(parseFloat(order.totalAmount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPaise,
            currency: 'inr',
            metadata: { orderId: orderId.toString(), userId: req.user.id.toString() },
        });

        res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @POST /api/payments/confirm
router.post('/confirm', protect, async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            await Order.update(
                { paymentStatus: 'paid', orderStatus: 'confirmed', stripePaymentId: paymentIntentId },
                { where: { id: orderId } }
            );
            const order = await Order.findByPk(orderId);
            res.json({ success: true, message: 'Payment confirmed!', order });
        } else {
            res.status(400).json({ success: false, message: 'Payment not completed' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
