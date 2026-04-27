const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const ShippingRate = Sequelize.define("shipping_rate", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    zona: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Unique to prevent duplicates (e.g., 'local', 'provincial')
    },
    costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'tarifas_envio'
});

module.exports = ShippingRate;
