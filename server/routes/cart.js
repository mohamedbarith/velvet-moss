const express = require('express');
const router = express.Router();
// Cart is managed client-side (localStorage/Zustand)
// This placeholder route exists for future server-side cart persistence
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Cart is managed client-side' });
});

module.exports = router;
