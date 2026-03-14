const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, adminOnly } = require('../middleware/auth');

// @GET /api/settings
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.findAll();
        const settingsMap = {};
        settings.forEach(s => { settingsMap[s.key] = s.value; });
        res.json({ success: true, settings: settingsMap });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @PUT /api/settings
router.put('/', protect, adminOnly, async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid settings format' });
        }

        for (const [key, value] of Object.entries(settings)) {
            const setting = await Setting.findOne({ where: { key } });
            if (setting) {
                await setting.update({ value: String(value) });
            } else {
                await Setting.create({ key, value: String(value) });
            }
        }

        const newSettings = await Setting.findAll();
        const settingsMap = {};
        newSettings.forEach(s => { settingsMap[s.key] = s.value; });
        res.json({ success: true, settings: settingsMap });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
