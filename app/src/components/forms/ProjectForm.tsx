import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Save, X, Users, Upload, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils';

interface Rol { id: string; nombre: string; categoria: string; requerido: boolean; }
interface Compania { id: string; tag: string; nombre: string; sede: string | null; }
interface Artista { id: string; nombre: string; }

const ProjectForm: React.FC = () => {
    // 1. HOOKS DE ENRUTAMIENTO
    const { id } = useParams<{ id: string }>(); // Captura el ID de la URL (si existe)
    const navigate = useNavigate();
    const isEditMode = Boolean(id); // Si hay ID, estamos editando

    const [isLoading, setIsLoading] = useState(isEditMode); // Pantalla de carga inicial
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [programaFile, setProgramaFile] = useState<File | null>(null);
    const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

    const [roles, setRoles] = useState<Rol[]>([]);
    const [companias, setCompanias] = useState<Compania[]>([]);
    const [artistas, setArtistas] = useState<Artista[]>([]);

    const [formData, setFormData] = useState({
        id: '', nombre: '', grupo_id: '', estreno: '', creditos: [] as any[]
    });

    // 2. CARGA INICIAL DE DATOS
    useEffect(() => {
        // Cargamos catálogos siempre
        Promise.all([
            fetch('/api/roles').then(res => res.json()),
            fetch('/api/companies').then(res => res.json()),
            fetch('/api/artists?nolimits=true').then(res => res.json())
        ]).then(([rolesData, companiasData, artistasData]) => {
            setRoles(rolesData);
            setCompanias(companiasData);
            setArtistas(artistasData);
        });

        // Si estamos en edición, traemos los datos del proyecto
        if (isEditMode && id) {
            fetch(`/api/proyectos/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Proyecto no encontrado");
                    return res.json();
                })
                .then(data => {
                    setFormData({
                        id: data.id,
                        nombre: data.proyecto_nombre || data.nombre, // Ajustado al nombre que devuelve tu SQL
                        grupo_id: data.grupo_id || data.id, // Ajustado al nombre que devuelve tu SQL
                        estreno: data.estreno ? new Date(data.estreno).toISOString().split('T')[0] : '',
                        // Mapeamos los créditos para el UI
                        creditos: (data.creditos || []).map((c: any) => ({
                            id: c.credito_id || `temp_${Math.random()}`,
                            rol_id: c.rol_id,
                            persona_id: c.persona_id
                        }))
                    });
                })
                .catch(err => {
                    alert("Error cargando el proyecto. Serás redirigido.");
                    navigate('/proyectos');
                })
                .finally(() => setIsLoading(false));
        }
    }, [id, isEditMode, navigate]);

    // Funciones de créditos
    const addCreditRow = () => setFormData(prev => ({ ...prev, creditos: [...prev.creditos, { id: `temp_${Date.now()}`, rol_id: '', persona_id: '' }] }));
    const removeCreditRow = (creditId: string) => setFormData(prev => ({ ...prev, creditos: prev.creditos.filter(c => c.id !== creditId) }));
    const updateCredit = (creditId: string, field: string, value: string) => setFormData(prev => ({ ...prev, creditos: prev.creditos.map(c => c.id === creditId ? { ...c, [field]: value } : c) }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
    
        try {
          const formDataToSend = new FormData();
          formDataToSend.append('nombre', formData.nombre);
          formDataToSend.append('grupo_id', formData.grupo_id);
          formDataToSend.append('estreno', formData.estreno);
          formDataToSend.append('creditos', JSON.stringify(formData.creditos));
    
          if (programaFile) formDataToSend.append('programa', programaFile);
    
          if (galeriaFiles.length > 0) {
            for (let i = 0; i < galeriaFiles.length; i++) {
              const compressedFile = await compressImage(galeriaFiles[i]);
              formDataToSend.append('galeria', compressedFile);
            }
          }
    
          const url = isEditMode ? `/api/proyectos/${id}` : `/api/proyectos`;
          const method = isEditMode ? 'PUT' : 'POST';
    
          const res = await fetch(url, { method, body: formDataToSend });
          if (!res.ok) throw new Error("Error al guardar el proyecto");
          
          alert(`Proyecto ${isEditMode ? 'actualizado' : 'creado'} con éxito.`);
          
          // 3. REDIRECCIÓN TRAS ÉXITO
          navigate(-1); // Regresa a la página anterior (o puedes poner navigate('/proyectos'))
          
        } catch (error) {
          console.error(error);
          alert("Ocurrió un error al guardar el proyecto.");
        } finally {
          setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-500 font-medium">Cargando proyecto...</span>
            </div>
        );
    }

  return (
    <div className='flex justify-center p-6'>
        <div className='bg-white w-full rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl'>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex justify-between items-center border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                    </h2>
                    <button type="button" onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Datos Generales ... (Mantenido igual) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="md:col-span-2 text-sm font-bold text-blue-900 uppercase tracking-wider">Información General</h3>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Obra</label>
              <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Compañía</label>
              <select required value={formData.grupo_id} onChange={e => setFormData({...formData, grupo_id: e.target.value})} className="w-full border border-gray-300 rounded-lg py-2.5 px-4 bg-white">
                <option value="">Selecciona...</option>
                {companias.map(g => <option key={g.id} value={g.id}>{g.nombre} {g.sede ? `[${g.sede}]` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de Estreno</label>
              <input type="date" required value={formData.estreno ? new Date(formData.estreno).toISOString().split('T')[0] : ''} onChange={e => setFormData({...formData, estreno: e.target.value})} className="w-full border border-gray-300 rounded-lg py-2.5 px-4" />
            </div>
          </div>

          {/* NUEVO: SECCIÓN MULTIMEDIA */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6 space-y-6">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 border-b pb-3">
              <Upload className="w-4 h-4" /> Archivos Multimedia
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Programa de Mano (PDF) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" /> Programa de Mano (PDF)
                </label>
                <p className="text-xs text-gray-500 mb-2">El póster se generará automáticamente a partir de la primera página de este documento.</p>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setProgramaFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
                {programaFile && <span className="text-xs text-green-600 font-medium">Archivo seleccionado: {programaFile.name}</span>}
              </div>

              {/* Galería (Múltiples Imágenes) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Fotos de la Galería
                </label>
                <p className="text-xs text-gray-500 mb-2">Se comprimirán automáticamente antes de subir. (Formatos: JPG, PNG)</p>
                <input 
                  type="file" 
                  multiple
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => setGaleriaFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
                {galeriaFiles.length > 0 && <span className="text-xs text-green-600 font-medium">{galeriaFiles.length} imágenes seleccionadas</span>}
              </div>
            </div>
          </div>

          {/* ... Gestión de Créditos (Mantenida igual) ... */}
          {/* Gestión de Créditos (Relaciones múltiples) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Créditos y Elenco
              </h3>
              <button type="button" onClick={addCreditRow} className="text-sm bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-50 font-medium flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Añadir Persona
              </button>
            </div>

            <div className="p-4 space-y-3">
              {formData.creditos.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">No hay créditos asignados a este proyecto.</p>
              ) : (
                formData.creditos.map((credito, index) => (
                  <div key={credito.id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs font-bold text-gray-400 w-6">{index + 1}.</span>
                    
                    <div className="flex-1 w-full">
                      <label className="block text-xs text-gray-500 mb-1">Rol / Puesto</label>
                      <select required value={credito.rol_id} onChange={e => updateCredit(credito.id, 'rol_id', e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="">Selecciona un rol...</option>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.nombre} ({r.categoria})</option>)}
                      </select>
                    </div>

                    <div className="flex-1 w-full">
                      <label className="block text-xs text-gray-500 mb-1">Artista / Persona</label>
                      <select required value={credito.persona_id} onChange={e => updateCredit(credito.id, 'persona_id', e.target.value)}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="">Selecciona persona...</option>
                        {artistas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>

                    <button type="button" onClick={() => removeCreditRow(credito.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors w-full sm:w-auto flex justify-center mt-2 sm:mt-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
                
                <div className="pt-6 border-t flex justify-end gap-3">
                    <button type="button" onClick={() => navigate(-1)} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                    Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-950 text-white py-2.5 px-8 rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 shadow-md disabled:opacity-50">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Proyecto</>}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}

export default ProjectForm;