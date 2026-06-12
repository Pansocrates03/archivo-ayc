import React, { useState } from 'react';
import Header from '@/components/Header';
import { CircleUserRound, Building2, Clapperboard, Save } from "lucide-react";
import ProjectManager from '../components/ProjectManager';
import { ArtistService, CompanyService } from '@/lib/services';

type TabType = 'compania' | 'artista' | 'proyecto';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('compania');

  // Manejadores genéricos de submit para tu API
  const handleCompaniaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      const responseData = await CompanyService.create(formData as any);
      console.log("Respuesta del backend al crear compañía:", responseData);
      alert(`Compañía "${responseData.nombre}" creada con ID: ${responseData.id}`);
    } catch (error) {
      console.error("Error al crear compañía:", error);
      alert("Hubo un error al crear la compañía. Por favor, intenta de nuevo.");
    }
  };

  const handleArtistaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      const responseData = await ArtistService.create(data as any);
      console.log("Respuesta del backend al crear artista:", responseData);
      alert(`Artista "${responseData.nombre}" creado con ID: ${responseData.id}`);
    } catch (error) {
      console.error("Error al crear artista:", error);
      alert("Hubo un error al crear el artista. Por favor, intenta de nuevo.");
    }
  };

  const handleProyectoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Datos del Proyecto a enviar:", data);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      {/* Encabezado */}
      <div className="max-w-4xl mx-auto p-8 mt-4">
        <h1 className="text-3xl font-extrabold text-blue-950">Panel de Administración</h1>
        <p className="text-gray-500 mt-2">Gestiona el catálogo de talento, grupos y cartelera nacional.</p>
      </div>

      {/* Tabs de Navegación */}
      <div className="max-w-4xl mx-auto px-8 mb-6">
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 gap-2">
          <button
            onClick={() => setActiveTab('compania')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'compania' ? 'bg-blue-950 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Compañía
          </button>
          
          <button
            onClick={() => setActiveTab('artista')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'artista' ? 'bg-blue-950 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CircleUserRound className="w-5 h-5" />
            Artista
          </button>

          <button
            onClick={() => setActiveTab('proyecto')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'proyecto' ? 'bg-blue-950 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clapperboard className="w-5 h-5" />
            Proyecto
          </button>
        </div>
      </div>

      {/* Área de Formularios */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          
          {/* FORMULARIO: COMPAÑÍA (grupos) */}
          {activeTab === 'compania' && (
            <form onSubmit={handleCompaniaSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">Registrar Nueva Compañía / Grupo</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Oficial</label>
                  <input type="text" name="nombre" id="nombre" required placeholder="Ej: Compañía de Teatro MTY" 
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                
                <div>
                  <label htmlFor="tag" className="block text-sm font-semibold text-gray-700 mb-1">Identificador Único (Tag)</label>
                  <input type="text" name="tag" id="tag" required placeholder="Ej: mty-tea" 
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>

                <div>
                  <label htmlFor="disciplina" className="block text-sm font-semibold text-gray-700 mb-1">Disciplina</label>
                  <select name="disciplina" id="disciplina" required 
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
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
                    <option value="Arte y Cultura">Arte y Cultura</option>
                    <option value="Prepa Tec">Prepa Tec</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">Descripción corta</label>
                <textarea name="description" id="description" rows={3} placeholder="Describe el objetivo o historia de la compañía..."
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Compañía
                </button>
              </div>
            </form>
          )}

          {/* FORMULARIO: ARTISTA (personas) */}
          {activeTab === 'artista' && (
            <form onSubmit={handleArtistaSubmit} className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">Registrar Nuevo Artista</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nombreArtista" className="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" name="nombre" id="nombreArtista" required placeholder="Nombre del alumno o colaborador" 
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                
                <div>
                  <label htmlFor="matricula" className="block text-sm font-semibold text-gray-700 mb-1">Matrícula (Opcional)</label>
                  <input type="text" name="matricula" id="matricula" placeholder="Ej: A01234567" 
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="bg-blue-600 text-white py-2.5 px-6 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Artista
                </button>
              </div>
            </form>
          )}

          {/* FORMULARIO: PROYECTO (proyectos) */}
          {activeTab === 'proyecto' && (
            <ProjectManager />
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminPage;