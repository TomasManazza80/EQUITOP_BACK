const { balanceMensual } = require("./models/index");

async function checkLastEntry() {
    try {
        const entry = await balanceMensual.findOne({ 
            order: [['createdAt', 'DESC']]
        });
        if (entry) {
            console.log("LAST_ENTRY_METADATA:", {
                id: entry.BalanceMensualId,
                producto: entry.producto,
                id_producto: entry.id_producto,
                color: entry.color,
                almacenamiento: entry.almacenamiento,
                cantidad: entry.cantidad
            });
        } else {
            console.log("NO_ENTRIES");
        }
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}

checkLastEntry();
