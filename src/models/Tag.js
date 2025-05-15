const sequelize = require('../config/db');
const { DataTypes } = require('sequelize');

const Tag = sequelize.define('Tag', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

module.exports = Tag;
