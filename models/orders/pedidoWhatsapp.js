const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const PedidoWhatsapp = Sequelize.define("pedidoWhatsapp", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    identificador: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    clienteNombre: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    clienteWhatsapp: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    productos: {
        // Will store JSON array of { id, nombre, precio, cantidad, tipo (sistema o ad-hoc), ... }
        type: DataTypes.JSON,
        allowNull: false,
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Armado', 'Cobrado y Entregado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Pendiente',
    }
}, {
    timestamps: true,
    tableName: 'pedidos_whatsapp'
});

module.exports = PedidoWhatsapp;
