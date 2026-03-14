const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    originalPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: null },
    category: { type: DataTypes.STRING(100), allowNull: false },
    stock: { type: DataTypes.INTEGER, defaultValue: 0 },
    isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
    tags: { type: DataTypes.JSON, defaultValue: [] },
    images: { type: DataTypes.JSON, defaultValue: [] },
    imagePosition: { type: DataTypes.STRING(50), defaultValue: 'center' },
    avgRating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    numReviews: { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
    tableName: 'products',
    indexes: [{ fields: ['category'] }, { fields: ['isFeatured'] }],
});

module.exports = Product;
