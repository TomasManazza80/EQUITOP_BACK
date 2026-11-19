import crypto from 'crypto';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

dotenv.config();

const getMercadoPagoClient = () => {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no está configurado en las variables de entorno.');
  }
  return new MercadoPagoConfig({ accessToken });
};

/**
 * Crea una preferencia de Checkout Pro usando Mercado Pago SDK v2.
 */
export const createCheckoutPreference = async ({
  items,
  externalReference,
  backUrls,
  autoReturn,
  notificationUrl,
  payer
}) => {
  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const body = {
    items: items.map((item) => ({
      id: String(item.id),
      title: String(item.title).slice(0, 256),
      quantity: Number(item.quantity),
      unit_price: Number(Number(item.unit_price).toFixed(2)),
      currency_id: 'ARS',
      ...(item.description ? { description: String(item.description).slice(0, 256) } : {})
    })),
    external_reference: String(externalReference),
    back_urls: backUrls,
    ...(autoReturn ? { auto_return: autoReturn } : {}),
    ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    ...(payer ? { payer } : {})
  };

  const response = await preference.create({ body });
  return {
    id: response.id,
    init_point: response.init_point,
    sandbox_init_point: response.sandbox_init_point
  };
};

/**
 * Consulta un pago real en Mercado Pago usando SDK v2.
 */
export const getPaymentById = async (paymentId) => {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  return await payment.get({ id: String(paymentId) });
};

/**
 * Valida la firma HMAC de webhooks cuando MP_WEBHOOK_SECRET está configurado.
 */
export const verifyWebhookSignature = (req, dataId) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = String(xSignature).split(',');
  let ts = null;
  let v1 = null;

  for (const part of parts) {
    const [rawKey, rawVal] = part.split('=');
    const key = rawKey?.trim();
    const val = rawVal?.trim();
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }

  if (!ts || !v1) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
};

export default {
  createCheckoutPreference,
  getPaymentById,
  verifyWebhookSignature
};
