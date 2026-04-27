const mercadopago = require('mercadopago');
const productService = require('../services/productService');

// CONFIGURACIÓN DE ACCESO
const ACCESS_TOKEN = 'APP_USR-2648142854934849-012012-5a948aed8f1967e68d8e41e4a5120c2b-632503296';
const FONT_URL = process.env.FONT_URL;
/**
 * CREA UNA PREFERENCIA DIRECTA EN MERCADO PAGO (OPCIONAL SI NO USAS VEXOR)
 */
const createPreference = async (createPaymentDto, orderId) => {
  mercadopago.configure({
    access_token: ACCESS_TOKEN,
  });

  const preferenceData = {
    items: [
      {
        title: createPaymentDto.title,
        quantity: Number(createPaymentDto.quantity),
        unit_price: Number(createPaymentDto.price),
        currency_id: 'ARS',
      },
    ],
    back_urls: {
      success: FONT_URL + '/pagoExitoso',
      failure: FONT_URL + '/pago-fallido',
      pending: FONT_URL + '/pago-pendiente',
    },
    auto_return: 'approved',
    external_reference: String(orderId),
  };

  try {
    const response = await mercadopago.preferences.create(preferenceData);
    return response.body;
  } catch (error) {
    console.error('[MP_SERVICE_ERROR]:', error);
    throw error;
  }
};

/**
 * PROCESA EL WEBHOOK PARA DESCONTAR STOCK (VERSION LEGACY)
 */
const processWebhookData = async (webhookData) => {
  if (webhookData?.data?.product) {
    const { id, quantity, color, almacenamiento, storage } = webhookData.data.product;
    return await productService.updateQuantityProduct(id, {
      quantityToDiscount: quantity,
      color,
      almacenamiento: almacenamiento || storage
    });
  } else {
    console.warn('DATOS_INSUFICIENTES: El webhook no contiene info de producto');
  }
};

/**
 * ENVÍA NOTIFICACIÓN DE ÉXITO A URL EXTERNA
 */
const notifySuccess = async (webhookData) => {
  const url = 'https://indumentarianam.netlify.app/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: webhookData.id,
        status: webhookData.data?.status,
        amount: webhookData.data?.amount,
        product: webhookData.data?.product
      })
    });
    console.log('[NOTIFICACION_EXTERNA] Enviada con éxito');
    return await response.json();
  } catch (error) {
    console.error('[ERROR_NOTIFICACION_EXTERNA]:', error.message);
  }
};

/**
 * OBTIENE EL ESTADO DEL PAGO DIRECTAMENTE DE MERCADO PAGO
 */
const getPaymentById = async (id) => {
  mercadopago.configure({ access_token: ACCESS_TOKEN });
  try {
    const response = await mercadopago.payment.get(id);
    return response.body;
  } catch (error) {
    console.error('[MP_SERVICE_ERROR] getPaymentById:', error);
    return null;
  }
};

module.exports = {
  createPreference,
  processWebhookData,
  notifySuccess,
  getPaymentById
};