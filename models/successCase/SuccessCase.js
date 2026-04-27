const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const SuccessCase = Sequelize.define("successCase", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    equipo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    falla: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    resultado: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    imagen: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true,
    paranoid: true, // Soft delete habilitado
});

module.exports = SuccessCase;