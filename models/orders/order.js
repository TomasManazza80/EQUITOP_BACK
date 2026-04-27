const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Order = Sequelize.define("order", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    identifier: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    cellphone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    province: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    postalCode: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shippingOption: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    shippingCost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
    },
    dispatchStatus: {
        type: DataTypes.STRING,
        defaultValue: 'PENDIENTE',
        // Valores posibles: 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'
    }
}, {
    timestamps: true,
    tableName: 'ordenes'
});

module.exports = Order;
