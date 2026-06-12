import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import Header from "../Header";

// Asumo que tienes esta función exportada en utils, como indicaste
import { compressImage } from "@/lib/utils";
import { CompanyService } from '@/lib/services';

const CompanyForm = () => {
    // 1. HOOKS DE ENRUTAMIENTO
    const { id } = useParams<{ id: string }>(); // Captura el ID o Tag de la URL
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // 2. ESTADOS
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        tag: '',
        disciplina: '',
        presentadopor: 'Arte y Cultura', // Valor por defecto
        descripcion: ''
    });

    // 3. CARGA INICIAL DE DATOS (Si es edición)
    useEffect(() => {
        if (isEditMode && id) {
            // Llama a tu endpoint de detalles de la compañía
            CompanyService.getById(id)
                .then(data => {
                    setFormData({
                        id: data.id || '',
                        nombre: data.nombre || '',
                        tag: data.tag || '',
                        disciplina: data.disciplina || '',
                        presentadopor: data.presentadopor || 'Arte y Cultura',
                        // Cubrimos ambos casos por si en la DB se llama description o descripcion
                        descripcion: data.descripcion || data.description || '' 
                    });
                })
                .catch(err => {
                    alert("Error cargando la compañía. Serás redirigido.");
                    navigate(-1);
                })
                .finally(() => setIsLoading(false));
        }
    }, [id, isEditMode, navigate]);

    // Manejador genérico para inputs de texto
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 4. ENVÍO DEL FORMULARIO
    const handleCompaniaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Usamos FormData para poder enviar archivos multimedia
            const formDataToSend = new FormData();
            formDataToSend.append('nombre', formData.nombre);
            formDataToSend.append('tag', formData.tag);
            formDataToSend.append('disciplina', formData.disciplina);
            formDataToSend.append('presentadopor', formData.presentadopor);
            formDataToSend.append('descripcion', formData.descripcion);

            // Si el usuario seleccionó una imagen, la comprimimos y la adjuntamos
            if (bannerFile) {
                const compressedFile = await compressImage(bannerFile);
                formDataToSend.append('banner', compressedFile);
            }

            if (isEditMode && id) {
                await CompanyService.update(id, formDataToSend);
            } else {
                await CompanyService.create(formDataToSend);
            }
            
            alert(`Compañía ${isEditMode ? 'actualizada' : 'creada'} con éxito.`);
            navigate(-1); // Regresa a la vista anterior

        } catch (error) {
            console.error("Error al guardar compañía:", error);
            alert("Hubo un error al guardar la compañía. Por favor, intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <Header />
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-500 font-medium">Cargando compañía...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />

            <div className="max-w-4xl mx-auto px-8 mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleCompaniaSubmit} className="space-y-8">
                        
                        {/* CABECERA DEL FORMULARIO */}
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? 'Editar Compañía' : 'Registrar Nueva Compañía'}
                            </h2>
                            <button type="button" onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    
                        {/* DATOS GENERALES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Oficial</label>
                                <input type="text" name="nombre" id="nombre" required placeholder="Ej: Compañía de Teatro MTY" 
                                    value={formData.nombre} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>
                            
                            <div>
                                <label htmlFor="tag" className="block text-sm font-semibold text-gray-700 mb-1">Identificador Único (Tag)</label>
                                <input type="text" name="tag" id="tag" required placeholder="Ej: mty-tea" 
                                    value={formData.tag} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                            </div>

                            <div>
                                <label htmlFor="disciplina" className="block text-sm font-semibold text-gray-700 mb-1">Disciplina</label>
                                <select name="disciplina" id="disciplina" required 
                                    value={formData.disciplina} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                    <option value="">Seleccione...</option>
                                    <option value="Teatro">Teatro</option>
                                    <option value="Danza">Danza</option>
                                    <option value="Música">Música</option>
                                    <option value="Arte">Arte</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="presentadopor" className="block text-sm font-semibold text-gray-700 mb-1">Presentado Por</label>
                                <select name="presentadopor" id="presentadopor" required 
                                    value={formData.presentadopor} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                                    <option value="Arte y Cultura">Arte y Cultura</option>
                                    <option value="Prepa Tec">Prepa Tec</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label htmlFor="descripcion" className="block text-sm font-semibold text-gray-700 mb-1">Descripción corta</label>
                                <textarea name="descripcion" id="descripcion" rows={3} placeholder="Describe el objetivo o historia de la compañía..."
                                    value={formData.descripcion} onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
                            </div>
                        </div>

                        {/* SECCIÓN MULTIMEDIA (Banner) */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3 mb-4">
                                <Upload className="w-4 h-4" /> Imagen de Portada (Banner)
                            </h3>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-blue-500" /> Subir Banner
                                </label>
                                <p className="text-xs text-gray-500 mb-2">Sube una imagen horizontal (JPG o PNG). Se comprimirá automáticamente.</p>
                                <input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                                />
                                {bannerFile && <span className="text-xs text-green-600 font-medium mt-2 block">Imagen seleccionada: {bannerFile.name}</span>}
                            </div>
                        </div>

                        {/* BOTONES DE ACCIÓN */}
                        <div className="pt-6 border-t flex justify-end gap-3">
                            <button type="button" onClick={() => navigate(-1)} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white py-2.5 px-8 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md disabled:opacity-50">
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Compañía</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
};

export default CompanyForm;