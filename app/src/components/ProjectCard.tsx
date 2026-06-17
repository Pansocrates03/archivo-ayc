import React from 'react';
import { Calendar, Theater } from 'lucide-react';
import type { ProjectDetail } from '@/lib/types';
import { timestampToDate } from '@/lib/utils';

const ProjectCard: React.FC<{ project: ProjectDetail; onSelect: (project: any) => void }> = ({ project, onSelect }) => {
  // project: { id, titulo, compania, fecha, posterUrl, disciplina }

  return (
    <button
      onClick={() => onSelect(project)}
      className="group relative flex flex-col w-full bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none"
    >
      {/* Contenedor del Poster (Relación de aspecto vertical 2:3 aprox) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <img
          src={project.thumbnail_url || "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=400&auto=format&fit=crop"}
          alt={`Poster de ${project.nombre}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badge de Disciplina en la esquina superior */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-white/20">
          {project.disciplina}
        </div>

        {/* Overlay Gradual Inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Información del Proyecto */}
      <div className="p-4 bg-white flex-1 flex flex-col justify-between border-t border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">
            {project.nombre}
          </h3>
          
          <div className="flex items-center gap-1.5 text-gray-600 mb-2">
            <span className="text-xs font-medium truncate">{project.company_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-gray-400 mt-2 pt-2 border-t border-gray-50">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">{timestampToDate(project.estreno)}</span>
        </div>
      </div>
    </button>
  );
};

export default ProjectCard;