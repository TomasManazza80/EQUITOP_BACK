const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const user = Sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user', // Valor por defecto
      validate: { isIn: [['admin', 'user', 'guest', 'tecnico', 'vendedor']] } // Validación para asegurar que el rol sea uno de los valores permitidos
    }
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

module.exports = user;
