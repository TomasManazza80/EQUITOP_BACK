const { DataTypes } = require("sequelize");
// Asegúrate de que esta ruta sea correcta para tu conexión a la DB
const Sequelize = require("../../dbconnection/db");

const PagoProducto = Sequelize.define(
    "PagoProducto",
    {
        pagoId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        // productos[] (arreglo de objetos: nombre, marca, cantidad, monto)
        // Se utiliza JSON para almacenar la estructura de arreglo de forma nativa en PostgreSQL (JSONB).
        productos: {
            type: DataTypes.JSON,
            allowNull: false,
            // Ejemplo de valor que espera: 
            // [{ nombre: "P1", marca: "M1", cantidad: 1, monto: 10.50, precioCompra: 5.00, cliente: "Juan", metodo_pago: "efectivo", fecha: "2023-10-27" }]
        },
        // monto (es la sumatoria final del pago)
        montoTotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        // medio de pago
        medioPago: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        origenDeVenta: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // decuentos
        descuentos: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0.00,
            allowNull: false,
        },
        // fecha (fecha en que se realiza el pago)
        fecha: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        // opcion 1 (futuro atributo)
        opcion1: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // opcion 2 (futuro atributo)
        opcion2: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // opcion 3 (futuro atributo)
        opcion3: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        detalles_pago: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        tarjeta_digitos: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        id_transaccion: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        paranoid: true, // Habilita soft-deletes
    }
);

module.exports = PagoProducto;