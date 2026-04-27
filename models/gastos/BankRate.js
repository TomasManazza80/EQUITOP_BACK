const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const BankRate = Sequelize.define("bank_rate", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    banco: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cuotas: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    porcentajeInteres: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00,
    }
}, {
    timestamps: true,
    paranoid: true,
    tableName: 'costos_bancarios'
});

module.exports = BankRate;
