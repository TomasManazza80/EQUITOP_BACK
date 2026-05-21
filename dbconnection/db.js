require('dotenv').config();
const { Sequelize } = require('sequelize');

const isLocal = process.env.DB_HOST === 'localhost' ||
  process.env.DB_HOST === '127.0.0.1';

const sequelizeConfig = {
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: msg => console.log(msg),
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  retry: {
    max: 5,
    match: [
      /Connection terminated unexpectedly/,
      /ETIMEDOUT/,
      /ECONNRESET/,
      /SequelizeConnectionError/
    ]
  }
};

if (!isLocal) {
  sequelizeConfig.dialectOptions = {
    ssl: { require: true, rejectUnauthorized: false },
    keepAlive: true,
    statement_timeout: 10000,
    connectionTimeoutMillis: 10000
  };
}

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: msg => console.log(msg),
    dialectOptions: !isLocal ? {
      ssl: { require: true, rejectUnauthorized: false },
      keepAlive: true,
      statement_timeout: 10000,
      connectionTimeoutMillis: 10000
    } : {},
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  sequelize = new Sequelize(sequelizeConfig);
}

// --- PROTOCOLO DE SINCRONIZACIÓN EQUITOP_CORE ---
(async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Conexión exitosa a PostgreSQL (${isLocal ? 'Local' : 'Remoto'})`);

    // 🔥 ESTA LÍNEA REPARA EL ERROR DE LAS COLUMNAS FALTANTES
    // Detecta que falta 'proveedorOrigen', 'fechaActualizacion', etc., y las crea.
    await sequelize.sync({ alter: true });
    console.log('✨ Base de datos sincronizada: Columnas actualizadas correctamente.');

    const [result] = await sequelize.query('SELECT version() as postgres_version');
    console.log(`🔍 Versión de PostgreSQL: ${result[0].postgres_version}`);
  } catch (error) {
    console.error('❌ Error de conexión o sincronización:');
    console.error(error.original?.message || error.message);
  }
})();

module.exports = sequelize;