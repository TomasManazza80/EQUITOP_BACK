const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Dispatch = Sequelize.define("Dispatch", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Información del Cliente
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cellphone: {
        type: DataTypes.STRING,
    },
    // Dirección Desglosada
    address: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
    },
    province: {
        type: DataTypes.STRING,
    },
    postalCode: {
        type: DataTypes.STRING,
    },
    // Detalles del Envío y Pago
    shippingOption: {
        type: DataTypes.STRING,
        defaultValue: "STANDARD",
    },
    shippingCost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    dispatchStatus: {
        type: DataTypes.ENUM("PENDIENTE", "EN_CAMINO", "RECIBIDO"),
        defaultValue: "PENDIENTE",
    },
    // Contenido del Carrito
    items: {
        type: DataTypes.JSON, // Almacena el array de productos del carrito
        defaultValue: [],
    },
    // Metadatos adicionales
    tracking: {
        type: DataTypes.STRING,
    },
    metadata_ecommerce: {
        type: DataTypes.JSON, // Almacena ID de orden original e info de sync
        defaultValue: {},
    }
}, {
    paranoid: true,
    timestamps: true,
});

module.exports = Dispatch;