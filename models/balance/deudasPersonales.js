const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const DebtControl = Sequelize.define('debtControl', {
    DebtId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    acreedor: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    montoTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    montoPagado: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    fechaLimite: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'pagado'),
        defaultValue: 'pendiente',
    },
    cuotasTotales: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    detalleCuotas: {
        type: DataTypes.JSON, // Almacena array: [{nro:1, monto:X, pagado:bool}, ...]
        allowNull: true
    }
}, {
    tableName: 'debtControls', // Asegura que use este nombre exacto
    timestamps: true,
    paranoid: true,
});

module.exports = DebtControl;