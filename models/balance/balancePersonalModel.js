const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const balancePersonal = Sequelize.define(
    "balancePersonal",
    {
        BalancePersonalId: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        tipo: {
            type: DataTypes.ENUM('income', 'expense'), // 'income' = INGRESO, 'expense' = GASTO
            allowNull: false,
        },
        categoria: {
            type: DataTypes.STRING, // Salary, Fixed, Variable, etc.
            allowNull: false,
        },
        cuenta: {
            type: DataTypes.STRING, // checking, savings, cash
            allowNull: false,
        },
        monto: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        fecha: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        responsable: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        paranoid: true, // Borrado lógico para seguridad financiera
    }
);

module.exports = balancePersonal;