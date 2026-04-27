const { Order } = require('./models/index');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    try {
        const results = await Order.findAll({ where: { status: 'paid' }, order: [['updatedAt', 'DESC']], limit: 5 });
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Error querying Order:", error.message);
    } finally {
        process.exit();
    }
}

run();
