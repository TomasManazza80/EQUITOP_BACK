import * as baileys from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = baileys;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sock = null;
let ultimoQR = null;
let estado = 'loading';
let qrAttempts = 0;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const MAX_QR_ATTEMPTS = 3;
let isConnected = false;
let reconnectTimeout = null;

const cleanupAuth = async () => {
    try {
        const authDir = path.join(process.cwd(), 'auth_info_baileys');
        try {
            const files = await fs.readdir(authDir);
            for (const file of files) {
                await fs.unlink(path.join(authDir, file));
            }
            await fs.rmdir(authDir);
            console.log("🧹 [WhatsApp] Credenciales antiguas eliminadas");
            return true;
        } catch (e) {
            console.log("ℹ️ [WhatsApp] No hay credenciales para limpiar");
            return false;
        }
    } catch (error) {
        console.log("⚠️ Error limpiando auth:", error.message);
        return false;
    }
};

export const init = async () => {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (isConnected && sock) {
        console.log("ℹ️ [WhatsApp] Ya está conectado");
        return;
    }

    connectionAttempts++;

    if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
        console.log("🛑 [WhatsApp] Máximo de intentos de conexión alcanzado");
        estado = 'max_attempts_reached';
        return;
    }

    console.log(`🚀 [WhatsApp] Iniciando (Intento conexión ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);

    try {
        // Obtener la versión más reciente de WA Web para evitar el error 405
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🔧 [WhatsApp] Usando versión WA Web: ${version.join('.')} | ¿Última? ${isLatest}`);

        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        sock = makeWASocket({
            version,
            auth: state,
            logger: pino({ level: 'error' }),
            browser: Browsers.ubuntu('Chrome'),
            connectTimeoutMs: 90000,
            keepAliveIntervalMs: 10000,
            markOnlineOnConnect: false,
            printQRInTerminal: true,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrAttempts++;
                ultimoQR = qr;
                estado = 'qr';
                console.log(`📲 [WhatsApp] QR generado (Intento ${qrAttempts}/${MAX_QR_ATTEMPTS})`);

                if (qrAttempts >= MAX_QR_ATTEMPTS) {
                    console.log("🛑 [WhatsApp] Límite de 3 QRs alcanzado. Deteniendo servicio.");
                    estado = 'max_qr_attempts_reached';

                    if (sock) {
                        sock.ev.removeAllListeners();
                        await sock.end();
                        sock = null;
                    }
                    return;
                }

                connectionAttempts = 0;
            }

            if (connection === 'open') {
                isConnected = true;
                estado = 'connected';
                ultimoQR = null;
                qrAttempts = 0;
                connectionAttempts = 0;
                console.log("🟢 [WhatsApp] Conectado exitosamente");
            }

            if (connection === 'close') {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const errorMessage = lastDisconnect?.error?.message;

                // Log detallado del error de desconexión
                console.log(`🔌 [WhatsApp] Desconectado. Código: ${statusCode || 'desconocido'} | Mensaje: ${errorMessage || 'sin mensaje'}`);
                if (lastDisconnect?.error) {
                    console.log("🔍 [WhatsApp] Detalle del error:", JSON.stringify(lastDisconnect.error, null, 2));
                }

                // 440 suele ser conflicto de sesión o stream. Limpiamos y reintentamos.
                if (statusCode === 401 || statusCode === 440 || statusCode === DisconnectReason.loggedOut) {
                    console.log(`🔑 [WhatsApp] Sesión conflictiva (${statusCode}). Limpiando auth...`);
                    estado = 'session_expired';
                    await cleanupAuth();

                    qrAttempts = 0;
                    connectionAttempts = 0;

                    if (sock) {
                        sock.ev.removeAllListeners();
                        await sock.end();
                        sock = null;
                    }

                    console.log("⏳ [WhatsApp] Reiniciando en 3 segundos...");
                    reconnectTimeout = setTimeout(async () => {
                        await init();
                    }, 3000);
                    return;
                }

                if (connectionAttempts < MAX_CONNECTION_ATTEMPTS && estado !== 'max_qr_attempts_reached') {
                    estado = 'reconnecting';
                    console.log(`🔄 [WhatsApp] Reconectando en 5 segundos...`);

                    reconnectTimeout = setTimeout(async () => {
                        if (!isConnected) {
                            await init();
                        }
                    }, 5000);
                } else {
                    if (estado !== 'max_qr_attempts_reached') estado = 'disconnected';
                    console.log("🛑 [WhatsApp] No se reconectará automáticamente");
                }
            }
        });

        sock.ev.on('error', (err) => {
            console.log("❌ [WhatsApp] Error de evento:", err.message);
        });

    } catch (error) {
        console.error("❌ [WhatsApp] Error crítico al inicializar:", error);
        estado = 'error';
        isConnected = false;

        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            reconnectTimeout = setTimeout(async () => {
                await init();
            }, 5000);
        }
    }
};

export const getStatus = () => ({
    qr: ultimoQR,
    status: estado,
    qrAttempts: qrAttempts,
    maxQrAttempts: MAX_QR_ATTEMPTS,
    connectionAttempts: connectionAttempts,
    maxAttempts: MAX_CONNECTION_ATTEMPTS,
    isConnected: isConnected,
    timestamp: new Date().toISOString()
});

export const restart = async () => {
    console.log("♻️ [WhatsApp] Reinicio manual solicitado");

    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    if (sock) {
        try {
            isConnected = false;
            sock.ev.removeAllListeners();
            await sock.end();
            sock = null;
            console.log("✅ [WhatsApp] Socket cerrado");
        } catch (e) {
            console.log("⚠️ Error cerrando socket:", e.message);
        }
    }

    // Reset completo del estado para que siempre se genere un QR nuevo
    qrAttempts = 0;
    connectionAttempts = 0;
    ultimoQR = null;
    estado = 'loading';
    isConnected = false;

    // Limpiar auth para forzar nuevo QR
    console.log("🧹 [WhatsApp] Limpiando credenciales para forzar nuevo QR...");
    await cleanupAuth();

    try {
        await delay(2000);
        await init();
        return { success: true, message: 'Reinicio iniciado' };
    } catch (error) {
        console.error("❌ [WhatsApp] Error durante el reinicio:", error);
        throw error;
    }
};

export const disconnect = async () => {
    if (sock) {
        try {
            console.log("🔌 [WhatsApp] Desconexión manual");
            isConnected = false;
            await sock.end();
            sock = null;
            estado = 'manually_disconnected';
            connectionAttempts = MAX_CONNECTION_ATTEMPTS + 1;
        } catch (e) {
            console.log("⚠️ Error desconectando:", e.message);
        }
    }
};

export const getSocket = () => sock;

export const sendMessage = async (number, message) => {
    if (!sock || !isConnected) {
        throw new Error("WHATSAPP_NOT_CONNECTED");
    }

    // Formatear número: eliminar +, -, espacios
    let cleanedNumber = number.replace(/\D/g, '');

    // Lógica para Argentina: Si tiene 10 dígitos (ej: 1122334455), le agregamos el 549
    if (cleanedNumber.length === 10) {
        cleanedNumber = '549' + cleanedNumber;
    }

    // Asegurar que termine en @s.whatsapp.net
    const jid = cleanedNumber.includes('@') ? cleanedNumber : `${cleanedNumber}@s.whatsapp.net`;

    console.log(`📤 [WhatsApp] Enviando mensaje a: ${jid}`);

    await sock.sendMessage(jid, { text: message });
    return { success: true };
};

export const forceCleanup = async () => {
    return await cleanupAuth();
};
