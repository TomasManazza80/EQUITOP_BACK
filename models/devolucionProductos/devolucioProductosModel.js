const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

// --- CABECERA DE OPERACIÓN ---
const Devolucion = Sequelize.define("devolucion", {
    DevolucionId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    clientName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    returnDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    generalReason: {
        type: DataTypes.STRING, // danio, error_envio, desistimiento, otro
        allowNull: false,
    }
}, { timestamps: true, paranoid: true });

// --- LOTES / PAQUETES ---
const DevolucionLote = Sequelize.define("devolucionLote", {
    LoteId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    packageName: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, { timestamps: true });

// --- PRODUCTOS ---
const DevolucionProducto = Sequelize.define("devolucionProducto", {
    ProductoId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, { timestamps: true });

// --- ASOCIACIONES FEDECELL_CORE ---
Devolucion.hasMany(DevolucionLote, { as: 'returnPackages', foreignKey: 'devolucionId' });
DevolucionLote.belongsTo(Devolucion);

DevolucionLote.hasMany(DevolucionProducto, { as: 'products', foreignKey: 'loteId' });
DevolucionProducto.belongsTo(DevolucionLote);

module.exports = { Devolucion, DevolucionLote, DevolucionProducto };