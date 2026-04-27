const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const egress = Sequelize.define(
    "egress",
    {
        EgressId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        monto: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        detalle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        responsable: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "ADMINISTRACION", // Valor por defecto para registros antiguos
        },
        medio: {
            type: DataTypes.STRING, // 'efectivo', 'banco_principal', etc.
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATE, // Usamos DATE para capturar hora exacta
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: true,
        paranoid: true, // Borrado lógico habilitado
    }
);

// Sincronización automática para crear la columna 'responsable' si no existe
egress.sync({ alter: true })
    .then(() => console.log("Tabla Egress actualizada (Columna responsable verificada)"))
    .catch((err) => console.error("Error actualizando tabla Egress:", err));

module.exports = egress;