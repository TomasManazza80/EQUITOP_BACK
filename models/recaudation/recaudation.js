const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Recaudation = Sequelize.define(
  "Recaudation",
  {
    mes: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productosVendidos: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      allowNull: false,
    },
    montoRecaudado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

module.exports = Recaudation;