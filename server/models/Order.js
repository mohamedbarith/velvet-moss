const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    items: { type: DataTypes.JSON, allowNull: false },
    shippingAddress: { type: DataTypes.JSON, allowNull: false },
    paymentMethod: { type: DataTypes.STRING(50), defaultValue: 'stripe' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
    orderStatus: { type: DataTypes.ENUM('processing', 'confirmed', 'shipped', 'delivered', 'cancelled'), defaultValue: 'processing' },
    subtotal: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    shippingCost: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    tax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    stripePaymentId: { type: DataTypes.STRING(255), defaultValue: null },
    deliveredAt: { type: DataTypes.DATE, defaultValue: null },
}, {
    tableName: 'orders',
    indexes: [{ fields: ['userId'] }],
});

module.exports = Order;
