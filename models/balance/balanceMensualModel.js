const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const balanceMensual = Sequelize.define(
    "balanceMensual",
    {
        BalanceMensualId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        producto: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        marca: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        categoria: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        codigoBarras: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        proveedor: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        monto: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        precioCompra: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        origenDeVenta: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        metodo_pago: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        cliente: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        id_transaccion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        detalles_pago: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        tarjeta_digitos: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        almacenamiento: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        numeroOrden: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dni: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        paranoid: true, // Borrado lógico para auditoría de balances
    }
);

module.exports = balanceMensual;