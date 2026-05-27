const { DataTypes } = require("sequelize");
const Sequelize = require("../../dbconnection/db");

const Product = Sequelize.define("product", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  marca: {
    type: DataTypes.STRING,
  },
  categoria: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  origenDeVenta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  proveedor: {
    type: DataTypes.STRING,
  },
  alerta: {
    type: DataTypes.INTEGER,
  },
  codigoBarras: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  aplicarMayoristaPorCantidad: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si es true, este producto aplicara precio mayorista al superar la cantidad minima configurada globalmente"
  },
  destacado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Si es true, el producto aparecerá primero en el catálogo web y vistas principales"
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Contador de favoritos/likes para el producto"
  },
  // Fechas Técnicas
  fechaActualizacionPrecio: {
    type: DataTypes.DATEONLY,
  },
  ultimaFechaCargoStock: {
    type: DataTypes.DATEONLY,
  },
  tasaEcommerce: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
  },
  // Información Adicional
  descripcion: {
    type: DataTypes.TEXT,
  },
  imagenes: {
    type: DataTypes.JSON, // Almacena array de URLs
    defaultValue: [],
  },
  variantes: {
    type: DataTypes.JSON, // [{ color, almacenamiento, stock, precioAlPublico, precioRevendedor, precioMayorista, costoDeCompra }]
    defaultValue: [],
    validate: {
      validarEstructura(value) {
        if (!Array.isArray(value)) {
          throw new Error("El campo 'variantes' debe ser un arreglo.");
        }
        value.forEach(v => {
          if (!v.color || !v.almacenamiento || v.stock === undefined || v.precioAlPublico === undefined || v.precioRevendedor === undefined || v.precioMayorista === undefined || v.costoDeCompra === undefined) {
            throw new Error("Cada variante debe contener: color, almacenamiento, stock, precioAlPublico, precioRevendedor, precioMayorista y costoDeCompra.");
          }
        });
      }
    },
    get() {
      const rawValue = this.getDataValue('variantes');
      // Protección contra DBs que devuelven JSON como string (ej: SQLite antiguo)
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue || [];
    }
  },
  creadoPor: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'productos'
});

module.exports = Product;