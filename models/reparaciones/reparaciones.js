const { DataTypes } = require("sequelize");

const reparacion = (db) => db.define(
    "reparacion",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        numeroOrden: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        fechaIngreso: {
            type: DataTypes.DATEONLY,
            defaultValue: DataTypes.NOW,
        },
        tecnicoResponsable: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        nombreDueno: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        dni: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        celular: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        direccion: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        modeloEquipo: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        numeroSerie: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        codigoBloqueo: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        estadoPantalla: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        caracteristicasEquipo: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        defectosFallas: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        detallesPresupuesto: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        montoAPagar: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        notaTecnica: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        estado: {
            // Actualizado a 4 estados para que coincida con tu flujo solicitado
            type: DataTypes.ENUM('Pendiente', 'En Reparación', 'Finalizado', 'Entregado'),
            allowNull: false,
            defaultValue: 'Pendiente',
        },
        fechaEntrega: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        }
    },
    {
        tableName: 'reparaciones',
        timestamps: true,
    }
);

module.exports = reparacion;