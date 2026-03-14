const express = require('express');
const router = express.Router();

// Reviews are handled within /api/products/:id/reviews
// This route exists for future standalone review management
router.get('/', (req, res) => {
    res.json({ success: true, message: 'Reviews endpoint active. Use /api/products/:id/reviews' });
});

module.exports = router;
