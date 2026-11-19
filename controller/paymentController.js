import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  Order,
  PagoProducto,
  GlobalConfig,
  Client,
  Dispatch,
  Sequelize
} from '../models/index.js';
import WholesaleConfig from '../models/config/wholesaleConfig.js';
import ShippingRate from '../models/gastos/ShippingRate.js';
import productService from '../services/productService.js';
import balanceMensualService from '../services/balance/balanceMensualService.js';
import dispatchService from '../services/ventasEcommerce/ventasEcommerceService.js';
import {
  createCheckoutPreference,
  getPaymentById,
  verifyWebhookSignature
} from '../payment/paymentService.js';

dotenv.config();

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

const SHIPPING_ZONE_MAP = {
  pickup: 'local',
  capital: 'provincia',
  surroundings: 'alrededores',
  other: 'nacional'
};

const translateColor = (color) => {
  if (!color) return null;
  const found = PREDEFINED_COLORS.find(
    (c) => c.code.toLowerCase() === String(color).toLowerCase()
  );
  return found ? found.name : color;
};

let whatsappService = null;
import('../services/QrService/QrService.js')
  .then((module) => {
    whatsappService = module;
  })
  .catch((err) => console.error('FALLO_CARGA_WHATSAPP:', err));

const isPublicHttpsOrNonLocal = (url) => {
  if (!url) return false;
  return !url.includes('localhost') && !url.includes('127.0.0.1');
};

const resolveShippingCost = async (shippingOption) => {
  const zona = SHIPPING_ZONE_MAP[shippingOption];
  if (!zona) return 0;
  const rate = await ShippingRate.findOne({ where: { zona } }).catch(() => null);
  return rate ? Math.max(0, Number(rate.costo) || 0) : 0;
};

const buildAuthoritativeCheckout = async (items, shippingOption) => {
  const [mpFeeConfig, minTotalConf, minQtyConf, wsConfig, authoritativeShippingCost] =
    await Promise.all([
      GlobalConfig.findOne({ where: { key: 'mp_fee' } }),
      GlobalConfig.findOne({ where: { key: 'wholesale_cart_total_min' } }),
      GlobalConfig.findOne({ where: { key: 'wholesale_product_qty_min' } }),
      WholesaleConfig.findOne().catch(() => null),
      resolveShippingCost(shippingOption)
    ]);

  const feePercentage = mpFeeConfig ? parseFloat(mpFeeConfig.value) || 0 : 0;
  const minCartTotal = minTotalConf
    ? parseFloat(minTotalConf.value) || 0
    : parseFloat(wsConfig?.cartTotalMin) || 0;
  const minProductQty = minQtyConf
    ? parseInt(minQtyConf.value, 10) || 0
    : parseInt(wsConfig?.productQtyMin, 10) || 0;

  const resolvedItems = [];
  let wholesaleSubtotal = 0;
  let totalUnits = 0;

  for (const item of items) {
    const rawId = String(item.productId || item.ProductId || item.id || '')
      .replace(/^wholesale-/, '')
      .split('-')[0];

    if (!rawId) {
      const err = new Error('ITEM_SIN_ID_VALIDO');
      err.statusCode = 400;
      throw err;
    }

    const product = await productService.getProductById(rawId).catch(() => null);
    if (!product) {
      const err = new Error(`Producto no encontrado (ID: ${rawId}).`);
      err.statusCode = 404;
      throw err;
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const variantes = Array.isArray(product.variantes) ? product.variantes : [];
    let selectedVariant = null;

    if (variantes.length > 0) {
      const vIdx = productService.findVariantIndex(
        variantes,
        item.color,
        item.almacenamiento || item.storage
      );
      selectedVariant = vIdx !== -1 ? variantes[vIdx] : variantes[0];
    }

    const availableStock = Number(selectedVariant?.stock ?? product.cantidad ?? 0);
    if (availableStock < quantity) {
      const err = new Error(
        `Stock insuficiente para "${product.nombre}". Disponible: ${availableStock}, solicitado: ${quantity}.`
      );
      err.statusCode = 400;
      throw err;
    }

    const retailPrice = Number(selectedVariant?.precioAlPublico || product.precioVenta || 0);
    const wholesalePrice = Number(
      selectedVariant?.precioMayorista ||
        selectedVariant?.precioRevendedor ||
        product.precioMayorista ||
        product.precioRevendedor ||
        retailPrice
    );

    if (retailPrice <= 0) {
      const err = new Error(`El producto "${product.nombre}" no tiene un precio válido.`);
      err.statusCode = 400;
      throw err;
    }

    wholesaleSubtotal += wholesalePrice * quantity;
    totalUnits += quantity;

    resolvedItems.push({
      item,
      product,
      selectedVariant,
      quantity,
      retailPrice,
      wholesalePrice
    });
  }

  const meetsCartTotalCondition = minCartTotal > 0 && wholesaleSubtotal >= minCartTotal;
  const meetsGlobalUnitsCondition =
    minCartTotal === 0 && minProductQty > 0 && totalUnits >= minProductQty;
  const noAdminRestrictions = minCartTotal === 0 && minProductQty === 0;

  const mpItems = [];
  const orderItems = [];
  let totalFeeAmount = 0;

  for (const entry of resolvedItems) {
    const { item, product, selectedVariant, quantity, retailPrice, wholesalePrice } = entry;
    const isQtyWholesale = Boolean(
      product.aplicarMayoristaPorCantidad && minProductQty > 0 && quantity >= minProductQty
    );
    const itemQualifiesForWholesale =
      meetsCartTotalCondition ||
      meetsGlobalUnitsCondition ||
      isQtyWholesale ||
      noAdminRestrictions;

    const isWholesaleOrigin = String(item.origenDeVenta || '')
      .toLowerCase()
      .includes('revendedor');
    const sentWholesalePrice =
      wholesalePrice > 0 &&
      wholesalePrice < retailPrice &&
      Math.abs(Number(item.unit_price) - wholesalePrice) <
        Math.abs(Number(item.unit_price) - retailPrice);

    const isRequestedAsWholesale = isWholesaleOrigin || sentWholesalePrice;

    if (isRequestedAsWholesale && !itemQualifiesForWholesale) {
      const err = new Error(
        'No se cumplen los requisitos mínimos configurados por el administrador para comprar a precio mayorista.'
      );
      err.statusCode = 400;
      throw err;
    }

    const authoritativePrice =
      isRequestedAsWholesale && itemQualifiesForWholesale
        ? wholesalePrice
        : itemQualifiesForWholesale && sentWholesalePrice
          ? wholesalePrice
          : retailPrice;

    const variantColor = selectedVariant?.color ?? item.color ?? null;
    const variantStorage =
      selectedVariant?.almacenamiento ?? item.almacenamiento ?? item.storage ?? null;

    mpItems.push({
      id: String(product.id),
      title: product.nombre || item.title || `Producto #${product.id}`,
      unit_price: Number(authoritativePrice),
      quantity: Number(quantity),
      description: product.nombre || item.title
    });

    orderItems.push({
      id: item.id || String(product.id),
      productId: product.id,
      title: product.nombre || item.title,
      unit_price: Number(authoritativePrice),
      quantity: Number(quantity),
      color: variantColor,
      storage: variantStorage,
      almacenamiento: variantStorage,
      origenDeVenta: item.origenDeVenta || 'ecommerce'
    });

    const itemRate =
      product.tasaEcommerce !== null && product.tasaEcommerce !== undefined
        ? parseFloat(product.tasaEcommerce)
        : feePercentage;

    totalFeeAmount += Number(authoritativePrice) * Number(quantity) * (itemRate / 100);
  }

  if (authoritativeShippingCost > 0) {
    mpItems.push({
      id: 'shipping',
      title: 'Costo de Envío',
      unit_price: Number(authoritativeShippingCost),
      quantity: 1,
      description: 'Logística EQUITOP'
    });
    totalFeeAmount += Number(authoritativeShippingCost) * (feePercentage / 100);
  }

  if (totalFeeAmount > 0) {
    mpItems.push({
      id: 'service-fee',
      title: 'Cargos del Servicio',
      unit_price: Number(totalFeeAmount.toFixed(2)),
      quantity: 1,
      description: 'Costos operativos y de plataforma'
    });
  }

  const totalAmount = Number(
    mpItems.reduce((acc, i) => acc + Number(i.unit_price) * Number(i.quantity), 0).toFixed(2)
  );

  return {
    mpItems,
    orderItems,
    authoritativeShippingCost,
    totalAmount
  };
};

/**
 * 1. CREATE PAYMENT / PREFERENCE: VALIDA DB, CREA ORDEN PENDING Y GENERA PREFERENCIA MP SDK v2
 */
export const createPayment = async (req, res) => {
  const {
    items,
    cellphone,
    name,
    address,
    city,
    province,
    postalCode,
    shippingOption
  } = req.body;

  if (!Array.isArray(items) || items.length === 0 || !cellphone) {
    return res.status(400).json({ error: 'DATOS_REQUERIDOS_FALTANTES' });
  }

  let newOrder = null;
  try {
    const { mpItems, orderItems, authoritativeShippingCost, totalAmount } =
      await buildAuthoritativeCheckout(items, shippingOption);

    const orderIdentifier = crypto.randomUUID();

    newOrder = await Order.create({
      identifier: orderIdentifier,
      items: orderItems,
      cellphone: String(cellphone).trim(),
      name: name ? String(name).trim() : null,
      address: address ? String(address).trim() : null,
      city: city ? String(city).trim() : null,
      province: province ? String(province).trim() : null,
      postalCode: postalCode ? String(postalCode).trim() : null,
      shippingOption: shippingOption || 'pickup',
      shippingCost: authoritativeShippingCost,
      total: totalAmount,
      status: 'PENDING',
      dispatchStatus: 'PENDIENTE'
    });

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      process.env.FONT_URL ||
      'http://localhost:5173'
    ).replace(/\/+$/, '');

    const backendUrl = (
      process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`
    ).replace(/\/+$/, '');

    const backUrls = {
      success: `${frontendUrl}/success`,
      failure: `${frontendUrl}/failure`,
      pending: `${frontendUrl}/pending`
    };

    const preference = await createCheckoutPreference({
      items: mpItems,
      externalReference: String(newOrder.id),
      backUrls,
      autoReturn: isPublicHttpsOrNonLocal(frontendUrl) ? 'approved' : undefined,
      notificationUrl: isPublicHttpsOrNonLocal(backendUrl)
        ? `${backendUrl}/api/webhooks/mercadopago`
        : undefined
    });

    newOrder.mpPreferenceId = preference.id;
    await newOrder.save();

    console.log(`[ORDER_CREATED] Orden #${newOrder.id} (PENDING) | Pref: ${preference.id}`);

    return res.status(200).json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      payment_url: preference.init_point,
      orderId: newOrder.id,
      external_reference: String(newOrder.id)
    });
  } catch (error) {
    if (newOrder && !newOrder.mpPreferenceId) {
      await newOrder.destroy().catch(() => {});
    }

    const mpStatus = error?.status || error?.statusCode;
    const mpCode = error?.code || error?.error;
    const isAuthError =
      mpStatus === 401 ||
      mpStatus === 403 ||
      mpCode === 'PA_UNAUTHORIZED_RESULT_FROM_POLICIES' ||
      String(error?.message || '').includes('UNAUTHORIZED');

    console.error('ERROR_EN_CREATE_PAYMENT:', {
      message: error?.message,
      status: mpStatus,
      code: mpCode,
      cause: error?.cause
    });

    if (isAuthError) {
      return res.status(502).json({
        error:
          'Credencial MP_ACCESS_TOKEN inválida, vencida o sin permisos en Mercado Pago. Renovala en Tus Integraciones y actualiza BACK/.env.'
      });
    }

    const statusCode = error?.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return res.status(statusCode).json({
      error: statusCode < 500 ? error.message : 'No se pudo generar la preferencia de pago'
    });
  }
};

/**
 * 2. HANDLE WEBHOOK: RECIBE NOTIFICACIONES DE MERCADO PAGO SDK v2 CON IDEMPOTENCIA
 */
export const handleWebhook = async (req, res) => {
  try {
    const eventType =
      req.body?.type || req.body?.topic || req.query?.type || req.query?.topic || null;
    const paymentId =
      req.body?.data?.id || req.query?.['data.id'] || req.query?.id || null;

    if (eventType !== 'payment' || !paymentId) {
      return res.status(200).send('OK');
    }

    if (!verifyWebhookSignature(req, paymentId)) {
      console.warn(`[WEBHOOK_SIGNATURE_INVALID] Payment ID: ${paymentId}`);
      return res.status(401).send('INVALID_SIGNATURE');
    }

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return res.status(200).send('OK');
    }

    const mpStatus = String(payment.status || '').toLowerCase();
    const externalReference = payment.external_reference
      ? String(payment.external_reference)
      : null;

    if (!externalReference) {
      console.warn(`[WEBHOOK_SIN_EXTERNAL_REF] Payment ID: ${payment.id}`);
      return res.status(200).send('OK');
    }

    const lockResult = await Sequelize.transaction(async (transaction) => {
      const findOptions = {
        transaction,
        ...(Sequelize.getDialect() === 'postgres' ? { lock: transaction.LOCK.UPDATE } : {})
      };

      let order = null;
      if (/^\d+$/.test(externalReference)) {
        order = await Order.findByPk(Number(externalReference), findOptions);
      }
      if (!order) {
        order = await Order.findOne({
          where: { identifier: externalReference },
          ...findOptions
        });
      }

      if (!order) {
        return { action: 'not_found' };
      }

      const currentStatus = String(order.status || '').toLowerCase();
      if (currentStatus === 'paid' || currentStatus === 'approved') {
        return { action: 'already_paid', order };
      }

      if (mpStatus === 'approved') {
        order.status = 'paid';
        order.mpPaymentId = String(payment.id);
        order.mpStatusDetail = payment.status_detail || null;
        order.dispatchStatus = 'PENDIENTE';
        await order.save({ transaction });
        return { action: 'approved_now', order };
      }

      if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(mpStatus)) {
        order.status = 'cancelled';
        order.mpPaymentId = String(payment.id);
        order.mpStatusDetail = payment.status_detail || null;
        await order.save({ transaction });
        return { action: 'cancelled', order };
      }

      order.status = 'PENDING';
      order.mpPaymentId = String(payment.id);
      order.mpStatusDetail = payment.status_detail || null;
      await order.save({ transaction });
      return { action: 'pending', order };
    });

    if (lockResult.action === 'already_paid') {
      console.log(`[WEBHOOK_IDEMPOTENT] Orden #${lockResult.order.id} ya estaba pagada.`);
      return res.status(200).send('OK');
    }

    if (lockResult.action !== 'approved_now') {
      return res.status(200).send('OK');
    }

    const order = lockResult.order;
    console.log(`[EQUITOP] PROCESANDO ORDEN APROBADA #${order.id} (${order.identifier})`);

    const itemsToProcess = Array.isArray(order.items)
      ? order.items
      : JSON.parse(order.items || '[]');

    for (const item of itemsToProcess) {
      const productId = item.productId || (item.id ? item.id.toString().split('-')[0] : null);
      if (productId) {
        try {
          await productService.updateQuantityProduct(productId, {
            quantityToDiscount: Number(item.quantity),
            color: item.color,
            almacenamiento: item.almacenamiento || item.storage
          });
        } catch (err) {
          console.error(`[STOCK_ERROR] ID:${productId}:`, err.message);
        }
      }
    }

    const enrichedItems = await realizarRegistrosContables(order);

    let trackingCode = `EQT-${Math.floor(100000 + Math.random() * 900000)}`;
    try {
      const existingDispatches = await Dispatch.findAll({
        order: [['createdAt', 'DESC']],
        limit: 50
      });
      const alreadyDispatched = existingDispatches.find(
        (d) => d.metadata_ecommerce?.order_identifier === order.identifier
      );

      if (!alreadyDispatched) {
        const orderData = {
          ...order.toJSON(),
          items: enrichedItems,
          total: order.total,
          identifier: order.identifier,
          tracking: trackingCode
        };

        const dispatchCreated = await dispatchService.createSingleDispatch(orderData);
        if (dispatchCreated?.tracking) {
          trackingCode = dispatchCreated.tracking;
        }
        console.log(
          `[LOGISTICA_SYNC] Despacho generado para orden #${order.id} (Tracking: ${trackingCode})`
        );
      } else if (alreadyDispatched.tracking) {
        trackingCode = alreadyDispatched.tracking;
      }

      if (order.cellphone) {
        const existingClient = await Client.findOne({ where: { telefono: order.cellphone } });
        if (!existingClient) {
          const fullAddress = [order.address, order.city, order.province, order.postalCode]
            .filter(Boolean)
            .join(', ');
          await Client.create({
            nombre: order.name || 'CLIENTE_ECOMMERCE',
            telefono: order.cellphone,
            direccion: fullAddress || null
          });
        }
      }
    } catch (logisticsError) {
      console.error('[LOGISTICA_ERROR] Fallo al crear despacho/cliente:', logisticsError.message);
    }

    try {
      if (whatsappService?.sendMessage && order.cellphone) {
        const frontendUrl = (
          process.env.FRONTEND_URL ||
          process.env.FONT_URL ||
          'http://localhost:5173'
        ).replace(/\/+$/, '');
        const trackingUrl = `${frontendUrl}/seguimiento?codigo=${trackingCode}`;
        const itemsString = itemsToProcess
          .map((item) => `- ${item.title} (${item.quantity} uds.)`)
          .join('\n');
        const mensaje =
          `*¡PAGO CONFIRMADO EN EQUITOP!* 📱✨\n\n` +
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

    return res.status(200).send('OK');
  } catch (error) {
    console.error('WEBHOOK_ERROR:', error);
    return res.status(200).send('ERROR_PROCESSED');
  }
};

/**
 * 3. GET ORDER STATUS: CONSULTA PÚBLICA RESUMIDA PARA PÁGINAS DE RETORNO
 */
export const getOrderStatus = async (req, res) => {
  try {
    const { externalReference } = req.params;
    if (!externalReference) {
      return res.status(400).json({ error: 'REFERENCIA_REQUERIDA' });
    }

    let order = null;
    if (/^\d+$/.test(String(externalReference))) {
      order = await Order.findByPk(Number(externalReference));
    }
    if (!order) {
      order = await Order.findOne({ where: { identifier: String(externalReference) } });
    }

    if (!order) {
      return res.status(404).json({ error: 'ORDEN_NO_ENCONTRADA' });
    }

    return res.status(200).json({
      id: order.id,
      identifier: order.identifier,
      status: order.status,
      mpStatusDetail: order.mpStatusDetail,
      mpPaymentId: order.mpPaymentId,
      total: Number(order.total),
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('GET_ORDER_STATUS_ERROR:', error.message);
    return res.status(500).json({ error: 'ERROR_CONSULTANDO_ORDEN' });
  }
};

async function realizarRegistrosContables(order) {
  const fechaHoy = new Date().toISOString().split('T')[0];
  const historialVenta = [];
  const itemsToProcess = Array.isArray(order.items)
    ? order.items
    : JSON.parse(order.items || '[]');

  for (const item of itemsToProcess) {
    const productId = item.productId || (item.id ? item.id.toString().split('-')[0] : null);
    const detail = productId
      ? await productService.getProductById(productId).catch(() => null)
      : null;

    let precioCompra = 0;
    if (detail?.variantes) {
      let variantes = detail.variantes;
      if (typeof variantes === 'string') {
        try {
          variantes = JSON.parse(variantes);
        } catch {
          variantes = [];
        }
      }
      const variantIndex = productService.findVariantIndex(
        Array.isArray(variantes) ? variantes : [],
        item.color,
        item.almacenamiento || item.storage
      );
      if (variantIndex !== -1) {
        precioCompra = Number(variantes[variantIndex].costoDeCompra) || 0;
      }
    }

    let nombreFinal = item.title;
    if (item.color || item.storage || item.almacenamiento) {
      const colorName = translateColor(item.color);
      const variantInfo = [colorName, item.almacenamiento || item.storage]
        .filter(Boolean)
        .join(' ');
      nombreFinal += ` (${variantInfo})`;
    }

    await balanceMensualService.createSingleEntry({
      producto: nombreFinal,
      monto: Number(item.unit_price) * Number(item.quantity),
      cantidad: item.quantity,
      metodo_pago: 'mercadopago',
      cliente: `Ecommerce: ${order.name || order.cellphone}`,
      id_transaccion: order.identifier,
      fecha: fechaHoy,
      precioCompra,
      origenDeVenta: item.origenDeVenta || 'ecommerce',
      marca: detail?.marca || 'N/A',
      categoria: detail?.categoria || 'N/A',
      proveedor: detail?.proveedor || 'N/A'
    });

    historialVenta.push({
      ...item,
      title: nombreFinal,
      nombre: nombreFinal,
      cantidad: item.quantity,
      monto: item.unit_price,
      marca: detail?.marca || 'N/A',
      categoria: detail?.categoria || 'N/A',
      proveedor: detail?.proveedor || 'N/A',
      precioCompra,
      cliente: `Ecommerce: ${order.name || order.cellphone}`,
      metodo_pago: 'mercadopago',
      origenDeVenta: item.origenDeVenta || 'ecommerce',
      fecha: fechaHoy
    });
  }

  if (Number(order.shippingCost) > 0) {
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

export default {
  createPayment,
  handleWebhook,
  getOrderStatus
};
