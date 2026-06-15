import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import { useEffect, useState } from "react";
import { CompanyService } from "@/lib/services";
import { useNavigate } from "react-router-dom";

interface CompaniaProPageType {
  id: string;
  nombre: string;
  descripcion: string | null;
  sede: string | null;
  disciplina: string;
  banner_url: string;
  proyectos: {
      id: string;
      nombre: string;
      estreno: string;
      youtube_url: string;
      programa_url: string;
      thumbnail_url: string;
      disciplina: string;
    }[];
}

export function CompaniaProPage() {

  const url = new URL(window.location.href);
  const companyId = url.pathname.split("/").pop();
  const navigate = useNavigate();

  const [company, setCompany] = useState<CompaniaProPageType | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    async function getCompany() {
      if (!companyId) return;
      const data = await CompanyService.getById(companyId);
      setCompany(data);
    }
    getCompany();
  }, [companyId]);


  return (
    <div className="min-h-screen bg-gray-100">
        {/* NAV */}
        <Header />

        {/* BANNER DE LA COMPAÑÍA */}
        <div 
          className="relative h-64 cursor-pointer group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}>
          
          {/* Imagen de Fondo */}
          <img
            src={company?.banner_url}
            alt={`${company?.nombre} banner`}
            className={`w-full h-64 object-cover transition-all duration-300 ${isHovering ? 'filter brightness-50' : ''}`} />
          
          {/* Degradado y Overlay */}
          <div className="absolute inset-0 w-full h-64">
            <div className={`absolute inset-0 transition-all duration-300 ${isHovering ? 'bg-white/80' : 'bg-gradient-to-t from-black/90 via-black/50 to-transparent'}`}>

              {/* Título o Descripción */}
              {!isHovering ? (
                <h3 className="text-8xl font-bold leading-tight text-white absolute inset-0 flex items-center justify-center">
                  {company?.nombre}
                </h3>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="text-center">
                    <h3 className="text-4xl font-bold text-gray-800 mb-4">{company?.nombre}</h3>
                    <p className="text-gray-700 text-lg leading-relaxed max-w-2xl">
                      {company?.descripcion || 'Historia de la compañía no disponible'}
                    </p>
                    {company?.sede && (
                      <p className="text-gray-600 text-sm mt-4">
                        <span className="font-semibold">Sede:</span> {company.sede}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        <main className="max-w-7xl mx-auto px-6 mt-10">
    
          {/* Grid de Posters */}
          {company && company.proyectos && company.proyectos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {company.proyectos.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  onSelect={(p:any) => navigate(`/proyectos/${p.id}`)} 
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
}

export default CompaniaProPage;
