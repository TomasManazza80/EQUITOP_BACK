import express from 'express';
import ImageKit from 'imagekit';

const router = express.Router();

let imagekit;

try {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
} catch (error) {
    console.warn("SISTEMA: Error al inicializar ImageKit. Comprueba tus variables de entorno.", error.message);
}

// Endpoint para proveer los parámetros de autenticación al frontend
router.get('/', (req, res) => {
    try {
        if (!imagekit) {
            return res.status(500).json({ error: "ImageKit no está configurado correctamente en el servidor." });
        }
        const authenticationParameters = imagekit.getAuthenticationParameters();
        res.json(authenticationParameters);
    } catch (err) {
        console.error("Error obteniendo parámetros de ImageKit:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
