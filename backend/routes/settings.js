const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// ==========================
// GET ALL SETTINGS
// ==========================
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.findAll();

        let settingsMap = {};

        // If data exists
        if (settings && settings.length > 0) {
            settings.forEach(s => {
                settingsMap[s.setting_key] = s.value;
            });
        }

        // Always return success
        res.json({
            success: true,
            settings: settingsMap
        });

    } catch (err) {
        console.error("GET SETTINGS ERROR:", err); // 🔥 debug
        res.status(500).json({
            success: false,
            message: "Server Error"
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

        // Loop each key-value
        for (const [key, value] of Object.entries(settings)) {

            const existing = await Setting.findOne({ where: { key } });

            if (existing) {
                await existing.update({ value: String(value) });
            } else {
                await Setting.create({
                    key,
                    value: String(value)
                });
            }
        }

        // Get updated data
        const newSettings = await Setting.findAll();

        let settingsMap = {};
        newSettings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        res.json({
            success: true,
            settings: settingsMap
        });

    } catch (err) {
        console.error("UPDATE SETTINGS ERROR:", err); // 🔥 debug
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

module.exports = router;