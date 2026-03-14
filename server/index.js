require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');

// Import models to trigger table creation
require('./models/User');
require('./models/Product');
require('./models/Review');
require('./models/Order');
require('./models/Contact');
require('./models/Setting');

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', db: 'MySQL', time: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Connect to MySQL and Start Server ─────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module || process.env.NODE_ENV !== 'production') {
    // Only run this when executed directly or in dev (not inside serverless import)
    // Actually, to make it work locally inside dev, we check require.main
    // But Netlify might require it. Better just check an env var:
    if (!process.env.NETLIFY) {
        sequelize.authenticate()
            .then(() => {
                console.log('✅ MySQL connected successfully');
                return sequelize.sync({ alter: true });
            })
            .then(() => {
                console.log('✅ Database tables synced');
                app.listen(PORT, () => {
                    console.log(`🚀 Server running on http://localhost:${PORT}`);
                });
            })
            .catch((err) => {
                console.error('❌ MySQL connection error:', err.message);
                process.exit(1);
            });
    }
}

module.exports = app;
