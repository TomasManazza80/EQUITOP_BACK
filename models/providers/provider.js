const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const provider = Sequelize.define(
    "provider",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        telefono: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        dni: { // Using DNI as a general ID/Tax ID field as requested, though CUIT/RUT is common for providers, sticking to requested fields
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        direccion: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        timestamps: true,
        paranoid: true,
    }
);

module.exports = provider;
