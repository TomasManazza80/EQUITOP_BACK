const { balanceMensual } = require("./models/index");

async function findStandardSale() {
    try {
        const entries = await balanceMensual.findAll({ 
            where: { id_producto: { [require("sequelize").Op.ne]: null } },
            limit: 5
        });
        console.log("ENTRIES_WITH_ID:", entries.map(e => ({ id: e.BalanceMensualId, prod: e.producto, id_p: e.id_producto })));
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}

findStandardSale();
