const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const cmsVisual = Sequelize.define(
    "cmsVisual",
    {
        CmsVisualId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        seccion: {
            type: DataTypes.ENUM('HERO', 'REPARACIONES', 'PROMOS'),
            allowNull: false,
        },
        label: {
            type: DataTypes.STRING, // Ejemplo: 'HERO_INICIO', 'MOD_REPARACIONES'
            allowNull: false,
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        aspectRatio: {
            type: DataTypes.STRING, // '21:9', '4:3', etc.
            allowNull: true,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        activo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        position: {
            type: DataTypes.STRING,
            defaultValue: '50% 50%',
            allowNull: false
        }
    },
    {
        timestamps: true,
        paranoid: true, // Seguridad para recuperación de assets eliminados
    }
);

module.exports = cmsVisual;