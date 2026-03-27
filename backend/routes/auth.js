const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// @POST /api/auth/register
router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, addresses: user.addresses },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account has been deactivated' });
        }

        const match = await user.comparePassword(password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, addresses: user.addresses },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @GET /api/auth/me — Get logged-in user profile
router.get('/me', protect, async (req, res) => {
    res.json({ success: true, user: req.user });
});

// @PUT /api/auth/profile — Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, addresses } = req.body;
        await User.update({ name, phone, addresses }, { where: { id: req.user.id } });
        const updated = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.json({ success: true, user: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @POST /api/auth/addresses — Add a new address
router.post('/addresses', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const newAddress = { id: Date.now().toString(), ...req.body };
        const currentAddresses = user.addresses || [];
        
        await user.update({ addresses: [...currentAddresses, newAddress] });
        
        res.json({ success: true, user: { ...user.toJSON(), password: undefined } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @DELETE /api/auth/addresses/:id — Remove a saved address
router.delete('/addresses/:id', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        const addressId = req.params.id;
        const currentAddresses = user.addresses || [];
        
        const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressId);
        await user.update({ addresses: updatedAddresses });
        
        res.json({ success: true, user: { ...user.toJSON(), password: undefined } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        const match = await user.comparePassword(currentPassword);
        if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
