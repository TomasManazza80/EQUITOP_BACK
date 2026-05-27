// 1. Importamos la conexión a la base de datos
const Sequelize = require("../dbconnection/db");

// 2. Importación de Modelos que se auto-definen (importan Sequelize internamente)
const user = require("./users/user");
const cart = require("./carts/cart");
const category = require("./categories/categ");
const product = require("./products/product");
const ProductBought = require("./productBougth/productBougth");
const Recaudation = require("./recaudation/recaudation");
const PagoProducto = require("../models/pagosDeProductos/pagosDeProductos");
const balanceMensual = require("../models/balance/balanceMensualModel");
const egresos = require("../models/balance/egresosModel");
const balancePersonal = require("../models/balance/balancePersonalModel");
const monthlyExpense = require("../models/balance/gastosMensuales");
const debtControl = require("../models/balance/deudasPersonales");
const GlobalConfig = require("./gastos/GlobalConfig");
const RecaudacionFinal = require("./recaudacionFinal/recaudacionFinal.js");
const cmsVisual = require("../models/cargaDeContenido/contenidoModel");
const devolucion = require("../models/devolucionProductos/devolucioProductosModel.js");
const Remito = require("../models/remito/remiroModel.js");
const RemitoItem = require("../models/remito/remiroModel.js");
const Order = require("./orders/order");
const Category = require("./categories/categ");
const Responsable = require("../models/balance/responsablesModel");
const SuccessCase = require("../models/successCase/SuccessCase.js");


const Dispatch = require("../models/ventasEcommerce/ventasEcommerce");

// 3. Importación e Inicialización de Modelos tipo "Factory" (como tu reparacion)
// Al ser una función (db) => db.define(...), debemos ejecutarla pasándole 'Sequelize'
const reparacionFactory = require("../models/reparaciones/reparaciones");
const reparacion = reparacionFactory(Sequelize);
const Client = require("../models/clients/client");
// ---------------------------------------------------------------------
// Definición de Relaciones (Estructura EQUITOP)
// ---------------------------------------------------------------------

// Relación Usuario - Carrito
user.hasMany(cart, { onDelete: "CASCADE" });
cart.belongsTo(user, { onDelete: "CASCADE" });

// Relación Categoría - Producto
category.hasMany(product, { onDelete: "CASCADE" });
product.belongsTo(category, { onDelete: "CASCADE" });

// Relación Muchos a Muchos: Productos - Carritos (Product_cart)
product.belongsToMany(cart, {
  onDelete: "CASCADE",
  through: "Product_cart",
  foreignKey: "ProductID"
});
cart.belongsToMany(product, {
  onDelete: "CASCADE",
  through: "Product_cart",
  foreignKey: "CartID"
});


// Relación Producto - Compras Realizadas
product.hasMany(ProductBought, { onDelete: "CASCADE" });
ProductBought.belongsTo(product, { onDelete: "CASCADE" });

// Relación Favoritos/Likes (Usuarios - Productos)
user.belongsToMany(product, {
  onDelete: "CASCADE",
  through: "User_Favorites",
  as: "Favorites",
  foreignKey: "UserId"
});
product.belongsToMany(user, {
  onDelete: "CASCADE",
  through: "User_Favorites",
  as: "FavoritedBy",
  foreignKey: "ProductId"
});

// ---------------------------------------------------------------------
// Exportación Unificada del Sistema
// ---------------------------------------------------------------------

const model = Sequelize.models;

module.exports = {
  model,
  Sequelize,
  cmsVisual,
  user,
  cart,
  category,
  devolucion,
  product,
  Remito,
  RemitoItem,
  ProductBought,
  Recaudation,
  reparacion,      // <--- Ahora es la instancia del modelo, no la función
  PagoProducto,
  balanceMensual,
  egresos,
  balancePersonal,
  monthlyExpense,
  debtControl,
  Category,
  Dispatch,
  RecaudacionFinal,
  Order,
  GlobalConfig,
  Responsable,
  Client,
  SuccessCase
};