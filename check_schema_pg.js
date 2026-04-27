const sequelize = require("./dbconnection/db");

async function checkSchemaPostgres() {
    try {
        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'balanceMensuals'
        `);
        console.log("COLUMNS:", results.map(r => r.column_name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error("SCHEMA_ERROR:", e.message);
        process.exit(1);
    }
}

checkSchemaPostgres();
