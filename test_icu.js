try {
    const d = new Date();
    const s = d.toLocaleTimeString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    console.log("SUPPORTED:", s);
} catch (e) {
    console.log("NOT_SUPPORTED:", e.message);
}
