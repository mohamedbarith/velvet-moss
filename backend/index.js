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
  origin: [
    "http://localhost:5173",
    "https://velvetmoss.netlify.app"
  ],
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

app.use('/api/upload', require('./routes/upload'));

// ─── Connect to MySQL and Start Server ─────────────────────
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connected successfully');
    return sequelize.sync();
  })
  .then(async () => {
    console.log('✅ Database tables synced');

    try {
      const User = require('./models/User');
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@velvetmoss.com';
      const existingAdmin = await User.findOne({ where: { role: 'admin' } });

      if (!existingAdmin) {
        await User.create({
          name: process.env.ADMIN_NAME || 'Admin User',
          email: adminEmail,
          password: process.env.ADMIN_PASSWORD || 'admin123',
          role: 'admin',
          isActive: true
        });
        console.log(`🌱 Default admin created: ${adminEmail} / admin123`);
      } else {
        console.log(`✅ Admin user verified: ${existingAdmin.email}`);
      }
    } catch (err) {
      console.error('⚠️ Failed to seed admin user:', err.message);
    }

    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running`);
    });
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
