const { Sequelize } = require("./models/index");

async function checkSchemaDetail() {
    try {
        const [results] = await Sequelize.query("PRAGMA table_info(balanceMensuals)");
        console.log("SCHEMA_BALANCE_MENSUAL:", results.map(r => r.name).join(', '));
        process.exit(0);
    } catch (e) {
        console.error("SCHEMA_ERROR:", e.message);
        process.exit(1);
    }
}

checkSchemaDetail();
