const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const client = Sequelize.define(
    "client",
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
        dni: {
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

module.exports = client;
