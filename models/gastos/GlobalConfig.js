const { DataTypes } = require("sequelize");
const sequelize = require("../../dbconnection/db");

const GlobalConfig = sequelize.define("global_config", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
    }
}, {
    timestamps: true,
    tableName: 'configuracion_global'
});

module.exports = GlobalConfig;
