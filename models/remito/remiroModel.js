const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Remito = Sequelize.define("remito", {
    RemitoId: { type: DataTypes.STRING, primaryKey: true },
    proveedor: { type: DataTypes.STRING, allowNull: false },
    total: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    fechaRecepcion: { type: DataTypes.DATEONLY, allowNull: false },
    estado: { type: DataTypes.ENUM('pagado', 'no pagado'), defaultValue: 'no pagado' },
    metodoPago: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true, paranoid: true });

const RemitoItem = Sequelize.define("remitoItem", {
    ItemId: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    marca: { type: DataTypes.STRING },
    categoria: { type: DataTypes.STRING },
    costoCompra: { type: DataTypes.DECIMAL(15, 2) },
    precioVenta: { type: DataTypes.DECIMAL(15, 2) },
    precioMayorista: { type: DataTypes.DECIMAL(15, 2) },
    precioRevendedor: { type: DataTypes.DECIMAL(15, 2) },
    cantidad: { type: DataTypes.INTEGER, defaultValue: 1 }, // Representa el stock cargado
    alertaStock: { type: DataTypes.INTEGER, defaultValue: 5 },
    proveedorOrigen: { type: DataTypes.STRING },
    fechaActualizacion: { type: DataTypes.DATEONLY },
    fechaUltimoCargo: { type: DataTypes.DATEONLY },
    descripcion: { type: DataTypes.TEXT },
    imagenes: { type: DataTypes.JSON },
    variantes: { type: DataTypes.JSON }
}, { timestamps: false });

// RELACIÓN MAESTRO-DETALLE
Remito.hasMany(RemitoItem, { as: 'productos', foreignKey: 'remitoId' });
RemitoItem.belongsTo(Remito, { foreignKey: 'remitoId' });

module.exports = { Remito, RemitoItem };