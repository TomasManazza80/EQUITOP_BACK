import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IKContext, IKUpload } from 'imagekitio-react';
import { FiUpload, FiTrash2, FiCheck, FiPlus } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const authenticator = async () => {
    try {
        const response = await fetch(`${API_URL}/api/auth/imagekit`);
        if (!response.ok) throw new Error("Authentication failed");
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Auth failed: ${error.message}`);
    }
};

const AdminCasosExito = () => {
    const [casos, setCasos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [nuevoCaso, setNuevoCaso] = useState({
        equipo: '',
        falla: '',
        resultado: '',
        imagen: ''
    });

    useEffect(() => {
        fetchCasos();
    }, []);

    const fetchCasos = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/success-cases`);
            setCasos(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!nuevoCaso.imagen) return alert("Falta la imagen");
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/success-cases`, nuevoCaso);
            setNuevoCaso({ equipo: '', falla: '', resultado: '', imagen: '' });
            fetchCasos();
            alert("Caso de éxito agregado!");
        } catch (error) {
            alert("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Eliminar este caso?")) return;
        try {
            await axios.delete(`${API_URL}/api/success-cases/${id}`);
            fetchCasos();
        } catch (error) {
            alert("Error al eliminar");
        }
    };

    const onUploadSuccess = (res) => {
        setNuevoCaso({ ...nuevoCaso, imagen: res.url });
        setUploading(false);
    };

    const onUploadError = () => {
        alert("Error al subir imagen");
        setUploading(false);
    };

    const inputStyle = "w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-sm outline-none focus:border-orange-500";

    return (
        <div className="p-8 bg-black min-h-screen text-white font-['Inter']">
            <h1 className="text-3xl font-black uppercase mb-8 text-orange-500">Gestión Casos de Éxito</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* FORMULARIO */}
                <div className="bg-zinc-900/30 p-6 border border-zinc-800 h-fit">
                    <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                        <FiPlus /> Nuevo Caso
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="text-xs uppercase font-bold text-zinc-500 block mb-1">Equipo / Modelo</label>
                            <input
                                type="text"
                                value={nuevoCaso.equipo}
                                onChange={e => setNuevoCaso({ ...nuevoCaso, equipo: e.target.value })}
                                className={inputStyle}
                                placeholder="Ej: IPHONE 13 PRO"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-zinc-500 block mb-1">Falla Reportada</label>
                            <input
                                type="text"
                                value={nuevoCaso.falla}
                                onChange={e => setNuevoCaso({ ...nuevoCaso, falla: e.target.value })}
                                className={inputStyle}
                                placeholder="Ej: PANTALLA ROTA"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase font-bold text-zinc-500 block mb-1">Resultado / Solución</label>
                            <textarea
                                value={nuevoCaso.resultado}
                                onChange={e => setNuevoCaso({ ...nuevoCaso, resultado: e.target.value })}
                                className={inputStyle}
                                rows="3"
                                placeholder="Ej: Cambio de módulo exitoso..."
                                required
                            />
                        </div>

                        {/* UPLOAD IMAGEN */}
                        <div>
                            <label className="text-xs uppercase font-bold text-zinc-500 block mb-1">Evidencia (Foto)</label>
                            <div className="border border-dashed border-zinc-700 p-4 text-center relative hover:bg-zinc-800 transition-colors">
                                {uploading ? (
                                    <span className="text-orange-500 text-xs font-bold animate-pulse">SUBIENDO...</span>
                                ) : nuevoCaso.imagen ? (
                                    <div className="relative">
                                        <img src={nuevoCaso.imagen} alt="Preview" className="h-32 mx-auto object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setNuevoCaso({ ...nuevoCaso, imagen: '' })}
                                            className="absolute top-0 right-0 bg-red-600 p-1"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <FiUpload className="mx-auto mb-2 text-zinc-500" />
                                        <span className="text-xs text-zinc-500">CLICK PARA SUBIR FOTO</span>
                                    </>
                                )}

                                {!nuevoCaso.imagen && (
                                    <IKContext
                                        publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
                                        urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
                                        authenticator={authenticator}
                                    >
                                        <IKUpload
                                            fileName="caso_exito"
                                            folder="/casos_exito"
                                            onUploadStart={() => setUploading(true)}
                                            onSuccess={onUploadSuccess}
                                            onError={onUploadError}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </IKContext>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full bg-orange-500 text-black font-black uppercase py-4 hover:bg-white transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? "GUARDANDO..." : <><FiCheck /> PUBLICAR CASO</>}
                        </button>
                    </form>
                </div>

                {/* LISTA */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold uppercase mb-6">Casos Activos ({casos.length})</h2>
                    {casos.map(caso => (
                        <div key={caso.id} className="flex gap-4 bg-zinc-900 border border-zinc-800 p-4 items-center">
                            <img src={caso.imagen} alt="" className="w-20 h-20 object-cover bg-black" />
                            <div className="flex-1">
                                <h3 className="font-bold text-orange-500">{caso.equipo}</h3>
                                <p className="text-xs text-zinc-400 uppercase tracking-wider">{caso.falla}</p>
                                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{caso.resultado}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(caso.id)}
                                className="p-3 hover:bg-red-600 hover:text-white transition-colors text-zinc-500"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    ))}
                    {casos.length === 0 && <p className="text-zinc-600 italic">No hay casos cargados aún.</p>}
                </div>
            </div>
        </div>
    );
};

export default AdminCasosExito;