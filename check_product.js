const { product } = require("./models/index");

async function checkProduct() {
    try {
        const p = await product.findByPk(2); // ID from the log
        if (p) {
            console.log("PRODUCT_VARIANTS:", JSON.stringify(p.variantes));
        } else {
            console.log("PRODUCT_NOT_FOUND");
        }
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}

checkProduct();
