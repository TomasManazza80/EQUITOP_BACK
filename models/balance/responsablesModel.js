const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Responsable = Sequelize.define(
    "responsable",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        nombre: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Evitamos duplicados
        }
    },
    {
        timestamps: false,
        tableName: 'responsables_catalog' // Nombre explícito para evitar conflictos
    }
);

// Sincronización automática
Responsable.sync({ alter: true })
    .then(() => console.log("Tabla Responsables (Catálogo) actualizada"))
    .catch((err) => console.error("Error actualizando tabla Responsables:", err));

module.exports = Responsable;