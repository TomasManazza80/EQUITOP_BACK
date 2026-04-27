const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const WholesaleConfig = Sequelize.define("wholesale_config", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    cartTotalMin: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        comment: "Monto minimo en el carrito para acceder a precio mayorista global"
    },
    productQtyMin: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Cantidad minima de un producto especifico para acceder a su precio mayorista"
    }
}, {
    timestamps: true,
    tableName: 'wholesale_configs'
});

module.exports = WholesaleConfig;
