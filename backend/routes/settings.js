const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// ==========================
// GET ALL SETTINGS
// ==========================
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.findAll();

        let settingsMap = {};

        if (settings && settings.length > 0) {
            settings.forEach(s => {
                settingsMap[s.setting_key] = s.value; // ✅ FIXED
            });
        }

        res.json({
            success: true,
            settings: settingsMap
        });

    } catch (err) {
        console.error("GET SETTINGS ERROR:", err);
        res.status(500).json({
            success: false,
            message: err.message // show real error
        });
    }
});

// ==========================
// UPDATE SETTINGS
// ==========================
router.put('/', async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: "Invalid settings format"
            });
        }

        for (const [key, value] of Object.entries(settings)) {

            // ✅ FIXED HERE
            const existing = await Setting.findOne({ 
                where: { setting_key: key } 
            });

            if (existing) {
                await existing.update({ value: String(value) });
            } else {
                // ✅ FIXED HERE
                await Setting.create({
                    setting_key: key,
                    value: String(value)
                });
            }
        }

        const newSettings = await Setting.findAll();

        let settingsMap = {};
        newSettings.forEach(s => {
            settingsMap[s.setting_key] = s.value; // ✅ FIXED
        });

        res.json({
            success: true,
            settings: settingsMap
        });

    } catch (err) {
        console.error("UPDATE SETTINGS ERROR:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ==========================
// GET PUBLIC STATS
// ==========================
router.get('/stats', async (req, res) => {
    try {
        const totalProducts = await Product.count();
        const totalOrders = await Order.count();
        const totalUsers = await User.count({ where: { role: 'user' } });

        res.json({
            success: true,
            stats: {
                products: totalProducts,
                orders: totalOrders,
                users: totalUsers
            }
        });
    } catch (err) {
        console.error("GET STATS ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;