const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Category = sequelize.define('Category', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = Category;
