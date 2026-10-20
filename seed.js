const Product = require('./models/products/product');
const sequelize = require('./dbconnection/db');

const seedProducts = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        // Clear existing products
        await Product.destroy({ where: {}, force: true });
        console.log("All existing products deleted.");

        const dummyProducts = [];
        const categories = ["EQUIPAMIENTO", "INSUMOS", "HERRAMIENTAS", "PAPELERÍA"];
        const subs = ["Sub A", "Sub B", "Sub C"];

        for (let i = 1; i <= 10; i++) {
            dummyProducts.push({
                nombre: `Producto de Prueba ${i}`,
                marca: `Marca ${i}`,
                categoria: categories[i % categories.length],
                subcategoria: subs[i % subs.length],
                origenDeVenta: "Web",
                proveedor: "Proveedor X",
                alerta: 5,
                codigoBarras: `1234567890${i}`,
                cantidad: 100,
                precioCompra: 100.0,
                precioVenta: 150.0 + i * 10,
                precioMayorista: 130.0 + i * 10,
                precioRevendedor: 140.0 + i * 10,
                destacado: i <= 3,
                descripcion: `Esta es la descripción del producto de prueba ${i}.`,
                imagenes: [
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=500&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=500&auto=format&fit=crop"
                ],
                variantes: [
                    {
                        color: "Negro",
                        almacenamiento: "N/A",
                        stock: 50,
                        precioAlPublico: 150.0 + i * 10,
                        precioRevendedor: 140.0 + i * 10,
                        precioMayorista: 130.0 + i * 10,
                        costoDeCompra: 100.0
                    },
                    {
                        color: "Blanco",
                        almacenamiento: "N/A",
                        stock: 50,
                        precioAlPublico: 150.0 + i * 10,
                        precioRevendedor: 140.0 + i * 10,
                        precioMayorista: 130.0 + i * 10,
                        costoDeCompra: 100.0
                    }
                ]
            });
        }

        await Product.bulkCreate(dummyProducts);
        console.log("10 new products inserted successfully.");

    } catch (err) {
        console.error("Error seeding products:", err);
    } finally {
        process.exit(0);
    }
};

seedProducts();
