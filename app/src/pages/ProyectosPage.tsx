import React, { useState, useMemo, useEffect } from 'react';
import { Search, Clapperboard } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import Header from '@/components/Header';
import type { Project, ProjectWithCompany } from '@/lib/types';
import PageTitle from '@/components/PageTitle';
import Footer from '@/components/Footer';

const ProyectosPage = () => {
  const [projects, setProjects] = useState<ProjectWithCompany[]>([]);

  async function getProjects(search = "", page = 1) {
    const response = await fetch(`/api/proyectos?search=${encodeURIComponent(search)}&page=${page}`, {});
    const data = await response.json();
    setProjects(data);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 mt-10">
        <PageTitle
          title="Proyectos Artísticos"
          description="Descubre todos los proyectos artísticos que se han llevado a cabo en el Tecnológico de Monterrey."
          search={(term) => getProjects(term)}
          searchPlaceholder="Buscar títulos" />

        {/* Grid de Posters */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onSelect={(p:any) => window.location.href = `/proyectos/${p.id}`} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
            <p className="text-gray-400 text-lg italic">No se encontraron proyectos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProyectosPage;