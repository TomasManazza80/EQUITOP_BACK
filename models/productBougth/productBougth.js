const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const ProductBought = Sequelize.define(
  "ProductBought",
  {
    ProductId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true, // Restaurado para evitar el error
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true, // Cambiado a true para permitir valores nulos
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    precioCompra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    talle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imagenes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    fechaCompra: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

ProductBought.findById = function (id) {
  return ProductBought.findByPk(id);
};

module.exports = ProductBought;