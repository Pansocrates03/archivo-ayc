import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Users, Plus, X, Trash2 } from 'lucide-react';
import Header from '../Header';

interface Rol {
    id: string;
    nombre: string;
    categoria: string;
    requerido: boolean;
}

interface Proyecto {
    id: string;
    nombre: string;
    estreno: string;
}

interface CreditoRow {
    id: string;
    proyecto_id: string;
    rol_id: string;
}

const ArtistaForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [isLoading, setIsLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [proyectos, setProyectos] = useState<Proyecto[]>([]);
    const [formData, setFormData] = useState({
        id: '',
        nombre: '',
        matricula: '',
        creditos: [] as CreditoRow[],
    });

    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                const [rolesRes, proyectosRes] = await Promise.all([
                    fetch('/api/roles'),
                    fetch('/api/all-proyectos') // Usamos la nueva ruta para obtener solo id y nombre de proyectos
                ]);

                if (!rolesRes.ok || !proyectosRes.ok) {
                    throw new Error('No se pudo cargar la información de catálogos');
                }

                const rolesData = await rolesRes.json();
                const proyectosData = await proyectosRes.json();

                setRoles(rolesData);
                setProyectos(proyectosData);
            } catch (error) {
                console.error(error);
            }
        };

        loadCatalogs();
    }, []);

    useEffect(() => {
        if (!isEditMode || !id) {
            return;
        }

        fetch(`/api/artists/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error('Artista no encontrado');
                return res.json();
            })
            .then((data) => {
                setFormData({
                    id: data.id,
                    nombre: data.nombre,
                    matricula: data.matricula || '',
                    creditos: (data.creditos || []).map((c: any) => ({
                        id: c.id || `temp_${Math.random()}`,
                        proyecto_id: c.proyecto_id,
                        rol_id: c.rol_id,
                    })),
                });
            })
            .catch((err) => {
                console.error(err);
                alert('Error cargando el artista. Serás redirigido.');
                navigate('/artistas');
            })
            .finally(() => setIsLoading(false));
    }, [id, isEditMode, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEditMode ? `/api/artists/${id}` : `/api/artists`;
            const method = isEditMode ? 'PUT' : 'POST';
            const payload = {
                nombre: formData.nombre,
                matricula: formData.matricula,
                creditos: formData.creditos.map(({ proyecto_id, rol_id }) => ({ proyecto_id, rol_id }))
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Error al guardar el artista');
            }

            alert(`Artista ${isEditMode ? 'actualizado' : 'creado'} con éxito.`);
            navigate('/artistas');
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error al guardar el artista.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addCreditRow = () => {
        setFormData(prev => ({
            ...prev,
            creditos: [...prev.creditos, { id: `temp_${Date.now()}`, proyecto_id: '', rol_id: '' }],
        }));
    };

    const removeCreditRow = (creditId: string) => {
        setFormData(prev => ({
            ...prev,
            creditos: prev.creditos.filter(credito => credito.id !== creditId),
        }));
    };

    const updateCredit = (creditId: string, field: keyof Omit<CreditoRow, 'id'>, value: string) => {
        setFormData(prev => ({
            ...prev,
            creditos: prev.creditos.map((credito) =>
                credito.id === creditId ? { ...credito, [field]: value } : credito
            ),
        }));
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

                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Créditos del Artista
                                </h3>
                                <button
                                    type="button"
                                    onClick={addCreditRow}
                                    className="text-sm bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-50 font-medium flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir crédito
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                {formData.creditos.length === 0 ? (
                                    <p className="text-center text-gray-400 py-4 text-sm">No hay proyectos asignados a este artista.</p>
                                ) : (
                                    formData.creditos.map((credito, index) => (
                                        <div key={credito.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                            <span className="text-xs font-bold text-gray-400 w-6">{index + 1}.</span>

                                            <div className="flex-1 w-full">
                                                <label className="block text-xs text-gray-500 mb-1">Proyecto</label>
                                                <select
                                                    required
                                                    value={credito.proyecto_id}
                                                    onChange={(e) => updateCredit(credito.id, 'proyecto_id', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                >
                                                    <option value="">Selecciona un proyecto...</option>
                                                    {proyectos.map((proyecto) => (
                                                        <option key={proyecto.id} value={proyecto.id}>{proyecto.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex-1 w-full">
                                                <label className="block text-xs text-gray-500 mb-1">Rol</label>
                                                <select
                                                    required
                                                    value={credito.rol_id}
                                                    onChange={(e) => updateCredit(credito.id, 'rol_id', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                >
                                                    <option value="">Selecciona un rol...</option>
                                                    {roles.map((rol) => (
                                                        <option key={rol.id} value={rol.id}>{rol.nombre} ({rol.categoria})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeCreditRow(credito.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors w-full sm:w-auto flex justify-center mt-2 sm:mt-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
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