const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelizeConfig = {
    database: process.env.DB_NAME || process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
};

let sequelize;
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    });
} else {
    sequelize = new Sequelize(sequelizeConfig);
}

async function run() {
    try {
        const [results] = await sequelize.query("SELECT * FROM ordenes WHERE status = 'paid' ORDER BY id DESC LIMIT 5;");
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

run();
