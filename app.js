// BACK/app.js (versión ES Modules - Exporta 'app')

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import cron from 'node-cron';

// Rutas
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import productRouter from './routes/product.js';
import reparacionesRouter from './routes/reparacionesRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import productBought from './routes/productBoughtRoute.js';
import recaudationRouter from './routes/recaudationRoutes.js';
import pagoCaja from './routes/pagoCajaRoutes.js';
import recaudacionFinalRouter from './routes/recaudacionFinalRoutes.js';
import balanceMensualRouter from './routes/balance/balanceMensualRoutes.js';
import egresosRouter from './routes/balance/egresosRoutes.js';
import balancePersonalRouter from './routes/balance/balancePersonalRoutes.js';
import gastosMensualesRouter from './routes/balance/gastosMensualesRoutes.js';
import deudaPersonalRouter from './routes/balance/deudaPersonalRoutes.js';
import contenidoRouter from './routes/cargaDeContenidoRoutes/contenidoRoutes.js';
import devolucionProductosRouter from './routes/devolucionProductos/devolucionProductosRoutes.js';
import remitoRouter from './routes/remito/remitoRoutes.js';
import gastosRouter from './routes/gastosRoutes.js';
import qrRouter from './routes/QRroutes/qrRoutes.js';
import ventasEcommerceRouter from './routes/ventasEcommerce/ventasEcommerceRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import clientRouter from './routes/clientRoutes.js';
import imagekitRouter from './routes/imagekitRoutes.js';
import categoryRouter from './routes/categoryRoutes.js';
import providerRouter from './routes/providerRoutes.js';
import successCasesRouter from './routes/successCase/successCaseRoutes.js';

// Servicios
import cierreCajaService from './services/cierreCajaService.js';

// Vexor: CORRECCIÓN FINAL DE IMPORTACIÓN
// Esto resuelve: TypeError: Vexor is not a constructor
import vexorModule from 'vexor';

// La clase Vexor se extrae con una lógica de respaldo: 
// 1. Intentamos acceder a .Vexor (como en el ejemplo CommonJS) 
// 2. Si no es .Vexor, asumimos que la clase es la exportación por defecto (vexorModule).
const Vexor = vexorModule.Vexor || vexorModule.default || vexorModule;

dotenv.config();

// Para ES Modules, esta es la forma correcta de obtener __dirname
const __filename = fileURLToPath(import.meta.url);
// Para ES Modules (equivalente a __dirname)
// Nota: path.dirname(new URL(import.meta.url).pathname) requiere el protocolo 'file://'
const __dirname = path.dirname(__filename);

const app = express();

// Instancia Vexor
const vexorInstance = new Vexor({
    publishableKey: process.env.VEXOR_PUBLISHABLE_KEY,
    projectId: process.env.VEXOR_PROJECT_ID,
    apiKey: process.env.VEXOR_API_KEY,
});

// Settings
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(logger('dev'));
// Se reduce el límite global a un valor más seguro.
// Rutas específicas que necesiten más (ej. carga de archivos) deben manejarlo individualmente.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/egresos', egresosRouter);
// Rutas
console.log("SERVER_INIT: Registering middleares and routes...");
app.use('/', indexRouter);
app.use('/', usersRouter);
app.use('/', productRouter);
app.use('/ecommerce', ventasEcommerceRouter);
app.use('/payment', paymentRouter);
app.use('/boughtProduct', productBought);
app.use('/recaudation', recaudationRouter);
app.use('/reparaciones', reparacionesRouter);
app.use('/pagoCaja', pagoCaja);
app.use('/recaudacionFinal', recaudacionFinalRouter);
app.use('/balanceMensual', balanceMensualRouter);
app.use('/balancePersonal', balancePersonalRouter);
app.use('/gastosMensuales', gastosMensualesRouter);
app.use('/deudaPersonal', deudaPersonalRouter);
app.use('/contenido', contenidoRouter);
app.use('/devolucionProductos', devolucionProductosRouter);
app.use('/remito', remitoRouter);
app.use('/gastos', gastosRouter);
app.use('/qr', qrRouter);
app.use('/reports', reportRouter);
app.use('/api/auth/imagekit', imagekitRouter);
app.use('/', clientRouter);
app.use('/api/categories', categoryRouter);
app.use('/', providerRouter);

app.use('/success-cases', successCasesRouter);

// --- PROGRAMACIÓN DE TAREAS (CRON JOBS) ---
// Cierre automático de caja a las 23:00 hrs (solo si AUTO_ACTIV está activado)
cron.schedule('00 23 * * *', async () => {
    try {
        const { GlobalConfig } = await import('./models/index.js');
        const autoActivo = await GlobalConfig.findOne({ where: { key: 'equitop_auto_cierre_activado' } });
        if (autoActivo?.value === 'true') {
            console.log('[CRON] AUTO_ACTIV detectado, ejecutando cierre de caja...');
            await cierreCajaService.ejecutarCierreAutomatico({ forceToday: true });
        } else {
            console.log('[CRON] AUTO_ACTIV no está activado, se omite el cierre automático.');
        }
    } catch (err) {
        console.error('[CRON_ERROR] Error al verificar AUTO_ACTIV:', err);
    }
}, { timezone: "America/Argentina/Buenos_Aires" });

// Catch 404
app.use((req, res, next) => {
    next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

// Exporta la aplicación para que el script 'www.js' pueda importarla y arrancar el servidor.
export default app;