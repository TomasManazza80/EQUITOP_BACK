const { balanceMensual } = require("./models/index");

async function checkSchema() {
    try {
        const entry = await balanceMensual.findOne();
        if (entry) {
            console.log("LAST_ENTRY_DATA:", entry.toJSON());
        } else {
            console.log("NO_ENTRIES_FOUND");
        }
        process.exit(0);
    } catch (e) {
        console.error("SCHEMA_ERROR:", e.message);
        process.exit(1);
    }
}

checkSchema();
