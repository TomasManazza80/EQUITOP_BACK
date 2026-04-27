const { Order, Dispatch } = require('./models/index');
const dispatchService = require('./services/ventasEcommerce/ventasEcommerceService');
const dotenv = require('dotenv');
dotenv.config();

async function testEnrichAndSend() {
    try {
        // Buscamos la última orden (aunque sea pendiente) para usar sus datos
        const order = await Order.findOne({ order: [['createdAt', 'DESC']] });
        if (!order) {
            console.log("No orders found to test.");
            return;
        }

        console.log(`Testing with Order ID: ${order.id}`);

        // Simulamos los items enriquecidos que devolvería realizarRegistrosContables
        const enrichedItems = (order.items || []).map(item => ({
            ...item,
            nombre: `${item.title} (ENRIQUECIDO)`,
            precioCompra: 100, // Simulado
            cliente: `Test: ${order.name}`
        }));

        const orderData = {
            ...order.toJSON(),
            items: enrichedItems,
            total: order.total,
            identifier: order.identifier
        };

        const result = await dispatchService.createSingleDispatch(orderData);
        console.log("Dispatch created successfully:");
        console.log(JSON.stringify(result, null, 2));

        // Verificamos que se guardó correctamente
        const saved = await Dispatch.findByPk(result.id);
        console.log("\nSaved in Database:");
        console.log(JSON.stringify(saved, null, 2));

    } catch (error) {
        console.error("Test failed:", error.message);
    } finally {
        process.exit();
    }
}

testEnrichAndSend();
