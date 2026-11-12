const vexor = require('vexor');
const dotenv = require('dotenv');
const { Order, PagoProducto, GlobalConfig, Client } = require('../models/index');
const WholesaleConfig = require('../models/config/wholesaleConfig');
const productService = require('../services/productService');
const balanceMensualService = require('../services/balance/balanceMensualService');
const paymentService = require('../payment/paymentService');
const dispatchService = require('../services/ventasEcommerce/ventasEcommerceService');

dotenv.config();

const { Vexor } = vexor;
const vexorInstance = new Vexor({
  publishableKey: process.env.VEXOR_PUBLISHABLE_KEY,
  projectId: process.env.VEXOR_PROJECT_ID,
  apiKey: process.env.VEXOR_API_KEY,
});

const PREDEFINED_COLORS = [
  { name: 'Negro', code: '#1C1C1E' },
  { name: 'Blanco', code: '#F5F5F7' },
  { name: 'Rojo', code: '#E11C2A' },
  { name: 'Azul', code: '#0071E3' },
  { name: 'Verde', code: '#505652' },
  { name: 'Gris', code: '#8E8E93' },
  { name: 'Dorado', code: '#F9E5C9' },
  { name: 'Plateado', code: '#E3E4E5' },
  { name: 'Violeta', code: '#E5DDEA' },
  { name: 'Grafito', code: '#424245' },
  { name: 'Sierra Azul', code: '#9BB5CE' },
  { name: 'Medianoche', code: '#192028' },
  { name: 'Estelar', code: '#FAF7F4' },
  { name: 'Titanio', code: '#BEBDB8' },
  { name: 'Deep Purple', code: '#594F63' }
];

const translateColor = (color) => {
  if (!color) return null;
  const found = PREDEFINED_COLORS.find(c => c.code.toLowerCase() === color.toLowerCase());
  return found ? found.name : color;
};

// CARGA DINÁMICA DE WHATSAPP SERVICE
let whatsappService;
import('../services/QrService/QrService.js').then(module => {
  whatsappService = module;
}).catch(err => console.error("FALLO_CARGA_WHATSAPP:", err));

/**
 * 1. CREATE PAYMENT: GENERA EL LINK DE MERCADO PAGO Y GUARDA LA ORDEN
 */
const createPayment = async (req, res) => {
  const { items, shippingCost, cellphone, name, address, city, province, postalCode, shippingOption } = req.body;

  if (!items || items.length === 0 || !cellphone) {
    return res.status(400).json({ error: 'DATOS_REQUERIDOS_FALTANTES' });
  }
  

  try {
    const [mpFeeConfig, minTotalConf, minQtyConf, wsConfig] = await Promise.all([
      GlobalConfig.findOne({ where: { key: 'mp_fee' } }),
      GlobalConfig.findOne({ where: { key: 'wholesale_cart_total_min' } }),
      GlobalConfig.findOne({ where: { key: 'wholesale_product_qty_min' } }),
      WholesaleConfig.findOne().catch(() => null)
    ]);

    const feePercentage = mpFeeConfig ? parseFloat(mpFeeConfig.value) : 0;
    const minCartTotal = minTotalConf
      ? parseFloat(minTotalConf.value) || 0
      : parseFloat(wsConfig?.cartTotalMin) || 0;
    const minProductQty = minQtyConf
      ? parseInt(minQtyConf.value, 10) || 0
      : parseInt(wsConfig?.productQtyMin, 10) || 0;

    // Cargar productos de la base de datos para validar precios y condiciones mayoristas
    const resolvedItems = [];
    let wholesaleSubtotal = 0;
    let totalUnits = 0;

    for (const item of items) {
      const rawId = (item.productId || item.ProductId || item.id || '').toString().split('-')[0];
      const product = rawId ? await productService.getProductById(rawId).catch(() => null) : null;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      let selectedVariant = null;
      if (product && Array.isArray(product.variantes) && product.variantes.length > 0) {
        const vIdx = productService.findVariantIndex(product.variantes, item.color, item.almacenamiento || item.storage);
        selectedVariant = vIdx !== -1 ? product.variantes[vIdx] : product.variantes[0];
      }

      const retailPrice = Number(selectedVariant?.precioAlPublico || product?.precioVenta || item.unit_price || 0);
      const wholesalePrice = Number(selectedVariant?.precioMayorista || product?.precioMayorista || retailPrice || 0);

      wholesaleSubtotal += wholesalePrice * quantity;
      totalUnits += quantity;

      resolvedItems.push({
        item,
        product,
        quantity,
        retailPrice,
        wholesalePrice
      });
    }

    const meetsCartTotalCondition = minCartTotal > 0 && wholesaleSubtotal >= minCartTotal;
    const meetsGlobalUnitsCondition = minCartTotal === 0 && minProductQty > 0 && totalUnits >= minProductQty;
    const noAdminRestrictions = minCartTotal === 0 && minProductQty === 0;

    const vexorItems = [];
    let totalFeeAmount = 0;

    for (const entry of resolvedItems) {
      const { item, product, quantity, retailPrice, wholesalePrice } = entry;
      const isQtyWholesale = Boolean(product?.aplicarMayoristaPorCantidad && minProductQty > 0 && quantity >= minProductQty);
      const itemQualifiesForWholesale = meetsCartTotalCondition || meetsGlobalUnitsCondition || isQtyWholesale || noAdminRestrictions;

      const isWholesaleOrigin = String(item.origenDeVenta || '').toLowerCase().includes('revendedor');
      const sentWholesalePrice =
        wholesalePrice > 0 &&
        wholesalePrice < retailPrice &&
        Math.abs(Number(item.unit_price) - wholesalePrice) < Math.abs(Number(item.unit_price) - retailPrice);

      const isRequestedAsWholesale = isWholesaleOrigin || sentWholesalePrice;

      if (isRequestedAsWholesale && !itemQualifiesForWholesale) {
        return res.status(400).json({
          error: 'No se cumplen los requisitos mínimos configurados por el administrador para comprar a precio mayorista.'
        });
      }

      const authoritativePrice = (isRequestedAsWholesale && itemQualifiesForWholesale)
        ? wholesalePrice
        : (itemQualifiesForWholesale && sentWholesalePrice ? wholesalePrice : retailPrice);

      item.unit_price = authoritativePrice;

      vexorItems.push({
        title: item.title,
        unit_price: Number(authoritativePrice),
        quantity: Number(quantity),
        description: item.title
      });

      let itemRate = feePercentage;
      if (product && product.tasaEcommerce !== null && product.tasaEcommerce !== undefined) {
        itemRate = parseFloat(product.tasaEcommerce);
      }
      totalFeeAmount += (Number(authoritativePrice) * Number(quantity)) * (itemRate / 100);
    }

    if (shippingCost > 0) {
      vexorItems.push({
        title: "Costo de Envío",
        unit_price: Number(shippingCost),
        quantity: 1,
        description: "Logística EQUITOP"
      });
      totalFeeAmount += Number(shippingCost) * (feePercentage / 100);
    }

    if (totalFeeAmount > 0) {
      vexorItems.push({
        title: `Cargos del Servicio`,
        unit_price: Number(totalFeeAmount.toFixed(2)),
        quantity: 1,
        description: "Costos operativos y de plataforma"
      });
    }

    const totalAmount = vexorItems.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const paymentResponse = await vexorInstance.pay.mercadopago({ items: vexorItems });

    if (paymentResponse?.payment_url) {
      const newOrder = await Order.create({
        identifier: paymentResponse.identifier,
        items: items,
        cellphone: cellphone,
        name: name,
        address: address,
        city: city,
        province: province,
        postalCode: postalCode,
        shippingOption: shippingOption,
        shippingCost: shippingCost,
        total: totalAmount,
        status: 'pending'
      });

      console.log(`[ORDER_CREATED] Orden #${newOrder.id} creada.`);
      return res.status(200).json({ payment_url: paymentResponse.payment_url });
    }

    throw new Error('VEXOR_NO_RESPONSE');
  } catch (error) {
    console.error('ERROR_EN_CREATE_PAYMENT:', error);
    res.status(500).json({ error: 'No se pudo generar el pago' });
  }
};

/**
 * 2. HANDLE WEBHOOK: PROCESA LA NOTIFICACIÓN DE PAGO EXITOSO
 */
const handleWebhook = async (req, res) => {
  try {
    let webhookData = null;
    const paymentId = req.query['data.id'] || req.query.id;

    try {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.get('host');
      req.url = `${protocol}://${host}${req.originalUrl}`;
      webhookData = await vexorInstance.webhook.mercadopago(req);
    } catch (vexorError) {
      console.warn('VEXOR_WARNING: Falló el procesamiento automático, intentando manual...');
    }

    if (!webhookData && paymentId) {
      const payment = await paymentService.getPaymentById(paymentId);
      if (payment && (payment.status === 'approved' || payment.status === 'paid')) {
        webhookData = { status: 'paid', identifier: null, _manual_payment: payment };
      }
    }

    if (webhookData && (webhookData.status === 'paid' || webhookData.status === 'approved')) {
      let order;

      if (webhookData.identifier) {
        order = await Order.findOne({ where: { identifier: webhookData.identifier, status: 'pending' } });
      } else if (webhookData._manual_payment) {
        order = await Order.findOne({
          where: { total: webhookData._manual_payment.transaction_amount, status: 'pending' },
          order: [['createdAt', 'DESC']]
        });
      }

      if (order) {
        console.log(`[EQUITOP] PROCESANDO ORDEN: ${order.identifier}`);

        // 1. DESCUENTO DE STOCK
        const itemsToProcess = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
        for (const item of itemsToProcess) {
          if (item.id) {
            try {
              const productId = item.id.toString().split('-')[0];
              await productService.updateQuantityProduct(productId, {
                quantityToDiscount: Number(item.quantity),
                color: item.color,
                almacenamiento: item.almacenamiento || item.storage
              });
            } catch (err) { console.error(`[STOCK_ERROR] ID:${item.id}:`, err.message); }
          }
        }

        // 2. REGISTROS CONTABLES (BALANCE Y CAJA) Y OBTENCIÓN DE ITEMS ENRIQUECIDOS
        const enrichedItems = await realizarRegistrosContables(order);

        // 3. INTEGRACIÓN LOGÍSTICA AUTOMÁTICA (BACKEND MAESTRO)
        let trackingCode = `EQT-${Math.floor(100000 + Math.random() * 900000)}`;
        try {
          // Convertimos la orden a JSON y la enviamos al servicio de logística
          // FIX: Usamos los items enriquecidos (con variantes traducidas, precios de compra, etc.)
          const orderData = {
            ...order.toJSON(),
            items: enrichedItems,
            total: order.total,
            identifier: order.identifier,
            tracking: trackingCode
          };

          const dispatchCreated = await dispatchService.createSingleDispatch(orderData);
          if (dispatchCreated && dispatchCreated.tracking) {
            trackingCode = dispatchCreated.tracking;
          }
          console.log(`[LOGISTICA_SYNC] Despacho generado automáticamente para orden: ${order.identifier} (Tracking: ${trackingCode})`);

          // REGISTRO DE CLIENTE (SI NO EXISTE)
          try {
            if (order.cellphone) {
              const existingClient = await Client.findOne({ where: { telefono: order.cellphone } });
              if (!existingClient) {
                const fullAddress = [order.address, order.city, order.province, order.postalCode].filter(Boolean).join(', ');
                await Client.create({
                  nombre: order.name || 'CLIENTE_ECOMMERCE',
                  telefono: order.cellphone,
                  direccion: fullAddress || null
                });
                console.log(`[WEBHOOK] Nuevo cliente registrado desde pago confirmado: ${order.cellphone}`);
              }
            }
          } catch (clientError) {
            console.error('[WEBHOOK_CLIENT_ERROR] Fallo al registrar cliente:', clientError.message);
          }
        } catch (logisticsError) {
          console.error('[LOGISTICA_ERROR] Fallo al crear despacho:', logisticsError.message);
        }

        // 4. NOTIFICACIÓN WHATSAPP CON CÓDIGO DE SEGUIMIENTO
        try {
          if (whatsappService?.sendMessage) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const trackingUrl = `${frontendUrl}/seguimiento?codigo=${trackingCode}`;
            const itemsString = itemsToProcess.map(item => `- ${item.title} (${item.quantity} uds.)`).join('\n');
            const mensaje = `*¡PAGO CONFIRMADO EN EQUITOP!* 📱✨\n\n` +
              `¡Hola ${order.name || 'Cliente'}!\n\n` +
              `Recibimos tu pago de *$${parseFloat(order.total).toLocaleString()}* con éxito.\n\n` +
              `📦 *CÓDIGO DE SEGUIMIENTO:* \`${trackingCode}\`\n\n` +
              `Podés consultar el estado de tu envío en cualquier momento desde nuestra web:\n` +
              `👉 ${trackingUrl}\n\n` +
              `*Detalles del pedido:*\n${itemsString}\n\n` +
              `Estamos preparando tus productos en taller. ¡Muchas gracias por tu compra!`;

            await whatsappService.sendMessage(order.cellphone, mensaje);
          }
        } catch (wsError) {
          console.error('[WHATSAPP_ERROR] Fallo al enviar mensaje:', wsError.message);
        }

        order.status = 'paid';
        order.dispatchStatus = 'PENDIENTE';
        await order.save();
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('WEBHOOK_ERROR:', error);
    res.status(200).send('ERROR_PROCESSED');
  }
};

/**
 * LÓGICA INTERNA DE BALANCE Y REGISTRO DE VENTAS
 */
async function realizarRegistrosContables(order) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const historialVenta = [];
  const itemsToProcess = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");

  for (const item of itemsToProcess) {
    const productId = item.id ? item.id.toString().split('-')[0] : null;
    const detail = productId ? await productService.getProductById(productId).catch(() => null) : null;

    let precioCompra = 0;
    if (detail && detail.variantes) {
      let variantes = detail.variantes;
      if (typeof variantes === 'string') try { variantes = JSON.parse(variantes); } catch (e) { }
      const variantIndex = productService.findVariantIndex(Array.isArray(variantes) ? variantes : [], item.color, item.almacenamiento || item.storage);
      if (variantIndex !== -1) {
        precioCompra = Number(variantes[variantIndex].costoDeCompra) || 0;
      }
    }

    let nombreFinal = item.title;
    if (item.color || item.storage || item.almacenamiento) {
      const colorName = translateColor(item.color);
      const variantInfo = [colorName, item.almacenamiento || item.storage].filter(Boolean).join(' ');
      nombreFinal += ` (${variantInfo})`;
    }

    await balanceMensualService.createSingleEntry({
      producto: nombreFinal,
      monto: item.unit_price * item.quantity,
      cantidad: item.quantity,
      metodo_pago: 'mercadopago',
      cliente: `Ecommerce: ${order.name || order.cellphone}`,
      id_transaccion: order.identifier,
      fecha: fechaHoy,
      precioCompra: precioCompra,
      origenDeVenta: item.origenDeVenta || 'ecommerce',
      marca: detail?.marca || 'N/A',
      categoria: detail?.categoria || 'N/A',
      proveedor: detail?.proveedor || 'N/A'
    });

    historialVenta.push({
      ...item, // Preservamos todos los campos originales (title, color, storage, id, quantity, etc.)
      title: nombreFinal, // Sobrescribimos o añadimos title con el nombre enriquecido para el frontend
      nombre: nombreFinal, // Mantenemos nombre para balanceMensual y PagoProducto
      cantidad: item.quantity,
      monto: item.unit_price,
      marca: detail?.marca || 'N/A',
      categoria: detail?.categoria || 'N/A',
      proveedor: detail?.proveedor || 'N/A',
      precioCompra: precioCompra,
      cliente: `Ecommerce: ${order.name || order.cellphone}`,
      metodo_pago: 'mercadopago',
      origenDeVenta: item.origenDeVenta || 'ecommerce',
      fecha: fechaHoy
    });
  }

  if (order.shippingCost > 0) {
    await balanceMensualService.createSingleEntry({
      producto: `Envío Ecommerce: ${order.shippingOption}`,
      monto: Number(order.shippingCost),
      cantidad: 1,
      metodo_pago: 'mercadopago',
      cliente: `Ecommerce: ${order.name || order.cellphone}`,
      id_transaccion: order.identifier,
      fecha: fechaHoy,
      precioCompra: 0,
      origenDeVenta: 'ecommerce',
      marca: 'N/A',
      categoria: 'ENVIO',
      proveedor: 'LOGISTICA'
    });
  }

  await PagoProducto.create({
    productos: historialVenta,
    montoTotal: order.total,
    medioPago: 'mercadopago',
    origenDeVenta: 'ecommerce',
    opcion1: `Cliente: ${order.name || 'N/A'} - Cel: ${order.cellphone}`,
    opcion2: `ID: ${order.identifier}`
  });

  return historialVenta;
}

module.exports = {
  createPayment,
  handleWebhook
};