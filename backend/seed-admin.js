require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    try {
        console.log('🔄 Connecting to the database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Check if an admin already exists
        const existingAdmin = await User.findOne({ where: { role: 'admin' } });
        if (existingAdmin) {
            console.log(`⚠️ An admin user already exists: ${existingAdmin.email}`);
            console.log('You can log in with this email and your password.');
            process.exit(0);
        }

        console.log('🌱 Creating a default admin user...');
        
        // Define default admin credentials
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@velvetmoss.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.ADMIN_NAME || 'Admin User';

        // We do not need to hash the password here because the User model hook `beforeCreate` 
        // will automatically hash it (see models/User.js).
        await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isActive: true
        });

        console.log('✅ Default admin user created successfully!');
        console.log('----------------------------------------');
        console.log(`📝 Email:    ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log('----------------------------------------');
        console.log('⚠️ IMPORTANT: Please log in and change this password immediately!');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating admin user:', err.message);
        process.exit(1);
    }
}

seedAdmin();
