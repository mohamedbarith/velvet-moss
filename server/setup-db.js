const mysql = require('mysql2/promise');

async function setup() {
    console.log('🔧 Setting up Velvet Moss database...\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
    });

    await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'velvet_moss'}\` 
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${process.env.DB_NAME || 'velvet_moss'}' created/confirmed`);
    await connection.end();
    console.log('✅ Database setup complete! Now run: npm start\n');
}

require('dotenv').config();
setup().catch(err => {
    console.error('❌ Setup failed:', err.message);
    console.error('\n👉 Please check your DB_USER and DB_PASS in server/.env');
    process.exit(1);
});
