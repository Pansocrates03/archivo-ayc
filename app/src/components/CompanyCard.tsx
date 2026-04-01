import React from 'react';
import { MapPin, Users } from 'lucide-react'; // Iconos opcionales para dar contexto
import type { Company } from '@/lib/types';

const CompanyCard: React.FC<{ company: Company; onSelect: (company: any) => void }> = ({ company, onSelect }) => {
  // Asumimos que 'company' tiene: { id, nombre, campus, disciplina, imageUrl }

  // Imagen por defecto si la compañía no tiene una
  const defaultImage = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=600&auto=format&fit=crop";

  return (
    <button
      onClick={() => onSelect(company)}
      className="group relative w-full h-64 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-blue-300"
    >
      {/* 1. Imagen de Fondo (Banner) */}
      <img
        src={company.banner_url || defaultImage}
        alt={`Banner de la compañía ${company.nombre}`}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* 2. Degradado Superpuesto (Overlay) para legibilidad del texto */}
      {/* Va de transparente arriba a negro opaco abajo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* 3. Contenido de Texto (Superpuesto) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-left text-white">
        {/* Disciplina o categoría (Etiqueta pequeña) */}
        <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
          {company.disciplina}
        </span>

        {/* Nombre de la Compañía (Grande y prominente) */}
        <h3 className="text-2xl font-bold leading-tight mb-2 group-hover:text-blue-200 transition-colors">
          {company.nombre}
        </h3>

        {/* Detalles adicionales (Campus) 
        <div className="flex items-center text-sm text-gray-300 gap-4 mt-3 border-t border-gray-700 pt-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Campus {company.campus}</span>
          </div>
          {/* Ejemplo de otro dato si lo tuvieras 
          {/* <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            <span>{company.integrantes} Integrantes</span>
          </div> 
        </div>
        */}
      </div>
    </button>
  );
};

export default CompanyCard;