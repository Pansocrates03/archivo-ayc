import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import Header from '../Header';

interface Artista {
    id: string;
    nombre: string;
    matricula: string;
}

const ArtistaForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        matricula: '',
    });

    useEffect(() => {
        console.log('IsEditMode:', isEditMode, 'ID:', id);
        if (isEditMode && id) {
            fetch(`/api/artists/${id}`)
                .then((res) => {
                    if (!res.ok) throw new Error('Artista no encontrado');
                    console.log('res', res);
                    return res.json();
                })
                .then((data) => {
                    console.log('data', data);
                    setFormData({
                        id: data.id,
                        nombre: data.nombre,
                        matricula: data.matricula,
                    });
                })
                .catch((err) => {
                    alert('Error cargando el artista. Serás redirigido.');
                    //navigate('/artistas');
                })
                .finally(() => setIsLoading(false));
        }
    }, [id, isEditMode, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEditMode ? `/api/artists/${id}` : `/api/artists`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Error al guardar el artista');

            alert(`Artista ${isEditMode ? 'actualizado' : 'creado'} con éxito.`);
            navigate('/artistas');
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error al guardar el artista.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-500 font-medium">Cargando artista...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
                    <Header />
        <div className="flex justify-center p-6">
            <div className="bg-white w-full rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="flex justify-between items-center border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isEditMode ? 'Editar Artista' : 'Crear Nuevo Artista'}
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                            Información del Artista
                        </h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) =>
                                    setFormData({ ...formData, nombre: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Matrícula
                            </label>
                            <input
                                type="text"
                                value={formData.matricula}
                                onChange={(e) =>
                                    setFormData({ ...formData, matricula: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        </div>
    );
};

export default ArtistaForm;