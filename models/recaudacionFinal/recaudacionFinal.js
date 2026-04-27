const { DataTypes } = require("sequelize");
// Se ajusta el require para que coincida con la sintaxis de tu index.js
const SequelizeInstance = require("../../dbconnection/db");

// Asegúrate de que tu instancia de Sequelize se pasa correctamente a través del require
// Si el archivo db.js exporta solo la instancia:
// const SequelizeInstance = require("../../dbconnection/db"); 
// Si exporta un objeto con la instancia, ajusta según sea necesario.

const RecaudacionFinal = SequelizeInstance.define(
  "RecaudacionFinal",
  {
    // Unique identifier
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // List of all products sold
    productosVendidos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Month/Year string
    mes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Final total amount (DECIMAL for precision)
    totalFinal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    // Final e-commerce amount
    montoFinalEcommerce: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    // Final local amount
    montoFinalLocal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    detalles_billetes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // New field to store cash closure summary (metrics and payment method totals)
    resumen_cierre: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    detalles_vuelto: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Optional string fields
    op1: { type: DataTypes.STRING, allowNull: true },
    op2: { type: DataTypes.STRING, allowNull: true },
    op3: { type: DataTypes.STRING, allowNull: true },
    op4: { type: DataTypes.STRING, allowNull: true },
  },
  {
    timestamps: true,
    paranoid: true,
    tableName: 'recaudacion_final',
  }
);

module.exports = RecaudacionFinal;