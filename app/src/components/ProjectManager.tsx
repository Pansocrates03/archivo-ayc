import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Users, Upload, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { timestampToDate } from '@/lib/utils';
import { ProjectService, RoleService, CompanyService, ArtistService } from '@/lib/services';

interface Rol { id: string; nombre: string; categoria: string; requerido: boolean; created_at: string; updated_at: string; }
interface Compania { id: string; tag: string; nombre: string; sede: string | null; descripcion: string | null; disciplina: string; banner_url: string; created_at: string; updated_at: string; }
interface Artista { id: string; nombre: string; matricula: string | null; updated_at: string; }
interface Proyecto { id: string; nombre: string; estreno: string; grupo_id: string; programa_url: string | null; thumbnail_url: string | null; youtube_url: string | null; created_at: string; updated_at: string; creditos: any[]; }

// --- FUNCIÓN DE COMPRESIÓN DE IMÁGENES (CLIENT-SIDE) ---
const compressImage = (file: File, maxSizeMB = 1): Promise<File> => {
  return new Promise((resolve) => {
    const fileSizeMB = file.size / 1024 / 1024;
    // Si la imagen ya es ligera, no la tocamos
    if (fileSizeMB <= maxSizeMB) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        // Mantener relación de aspecto
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG con 80% de calidad para reducir peso
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
          } else {
            resolve(file); // Fallback por si algo sale mal
          }
        }, 'image/jpeg', 0.8);
      };
    };
  });
};

// --- COMPONENTE PRINCIPAL ---
const ProjectManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para archivos
  const [programaFile, setProgramaFile] = useState<File | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);

  // Estados de datos
  const [roles, setRoles] = useState<Rol[]>([]);
  const [companias, setCompanias] = useState<Compania[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);

  async function fetchRoles() { const data = await RoleService.list(); setRoles(data); }
  async function fetchCompanias() { const data = await CompanyService.listAll(); setCompanias(data); }
  async function fetchArtistas() { const data = await ArtistService.listAll(); setArtistas(data); }
  async function fetchProyectos() { const data = await ProjectService.list('', 1); data.map((p: any) => p.creditos = []); setProyectos(data); }
  async function fetchCreditos(proyectoId: string) { /* ... tu lógica ... */ return []; }

  useEffect(() => {
    fetchRoles(); fetchCompanias(); fetchArtistas(); fetchProyectos();
  }, []);

  const [formData, setFormData] = useState({
    id: '', nombre: '', grupo_id: '', estreno: '', creditos: [] as any[]
  });

  const handleCreateNew = () => {
    setFormData({ id: '', nombre: '', grupo_id: '', estreno: '', creditos: [] });
    setProgramaFile(null);
    setGaleriaFiles([]);
    setView('form');
  };

  const handleEdit = (project: any) => {
    setFormData(JSON.parse(JSON.stringify(project)));
    fetchCreditos(project.id).then(creditos => {
      setFormData(prev => ({ ...prev, creditos }));
    });
    setProgramaFile(null);
    setGaleriaFiles([]);
    setView('form');
  };

  // ... (addCreditRow, removeCreditRow, updateCredit se mantienen igual) ...
  const addCreditRow = () => setFormData(prev => ({ ...prev, creditos: [...prev.creditos, { id: `temp_${Date.now()}`, rol_id: '', persona_id: '' }] }));
  const removeCreditRow = (id: string) => setFormData(prev => ({ ...prev, creditos: prev.creditos.filter(c => c.id !== id) }));
  const updateCredit = (id: string, field: string, value: string) => setFormData(prev => ({ ...prev, creditos: prev.creditos.map(c => c.id === id ? { ...c, [field]: value } : c) }));

  // NUEVO HANDLE SUBMIT (Con FormData y Compresión)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Preparamos el FormData en lugar de un JSON normal
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('grupo_id', formData.grupo_id);
      formDataToSend.append('estreno', formData.estreno);
      // Los arrays anidados se envían como string JSON
      formDataToSend.append('creditos', JSON.stringify(formData.creditos));

      // 2. Adjuntamos el PDF
      if (programaFile) {
        formDataToSend.append('programa', programaFile);
      }

      // 3. Comprimimos y adjuntamos las imágenes de la galería
      if (galeriaFiles.length > 0) {
        for (let i = 0; i < galeriaFiles.length; i++) {
          const compressedFile = await compressImage(galeriaFiles[i]);
          formDataToSend.append('galeria', compressedFile);
        }
      }

      // 4. Enviamos a la API
      if (formData.id) {
        await ProjectService.update(formData.id, formDataToSend);
      } else {
        await ProjectService.create(formDataToSend);
      }
      
      alert("Proyecto y archivos guardados con éxito.");
      await fetchProyectos(); // Recargamos la lista
      setView('list');
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al subir los archivos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* ... VISTA DE LISTA (Se mantiene igual) ... */}
      {view === 'list' && (
        // ... (Tu código actual de la lista) ...
        <div>
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">Proyectos Registrados</h2>
            <button onClick={handleCreateNew} className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Proyecto
            </button>
          </div>
          <div className="space-y-3">
            {proyectos.map(p => (
               <div key={p.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
               <div>
                 <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                 <p className="text-sm text-gray-500">Estreno: {timestampToDate(p.estreno)}</p>
               </div>
               <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                 <Edit2 className="w-5 h-5" />
               </button>
             </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA DE FORMULARIO */}
      {view === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {formData.id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </h2>
            <button type="button" onClick={() => setView('list')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
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
            <button type="button" onClick={() => setView('list')} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-950 text-white py-2.5 px-8 rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 shadow-md disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : <><Save className="w-4 h-4" /> Guardar Proyecto</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProjectManager;