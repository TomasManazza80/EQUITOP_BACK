const Product = require('./models/products/product');
const sequelize = require('./dbconnection/db');

const seedProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        // Clear existing products
        await Product.destroy({ where: {}, force: true });
        console.log("All existing products deleted.");

        const realProducts = require('./real_products.json');
        const categories = ["EQUIPAMIENTO", "INSUMOS", "HERRAMIENTAS", "PAPELERÍA"];
        const subs = ["Sub A", "Sub B", "Sub C"];

        // Insert real products from JSON file
        await Product.bulkCreate(realProducts);

        await Product.bulkCreate(dummyProducts);
        console.log("10 new products inserted successfully.");

    } catch (err) {
        console.error("Error seeding products:", err);
    } finally {
        process.exit(0);
    }
};

seedProducts();
