import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import type { Artist } from "@/lib/types";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import Footer from "@/components/Footer";

interface ArtistaProPageType {
  id: string;
  nombre: string;
  matricula?: string;
  trayectoria: {
      id: string;
      nombre: string;
      estreno: string;
      categoria_rol: string;
      thumbnail_url: string;
      compania_nombre: string;
      rol_desempeñado: string
    }[];
}

export function ArtistaProPage() {
    const [artist, setArtist] = useState<ArtistaProPageType | null>(null);

    useEffect(() => {
        const fetchArtist = async () => {
            const id = window.location.pathname.split("/").pop();
            const response = await fetch(`/api/artists/${id}`);
            const data = await response.json();
            console.log("Fetched artist:", data);
            setArtist(data);
        };

        fetchArtist();
    }, []);
  
 
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl min-h-screen mx-auto px-6 mt-10">
      <div className="p-6 max-w-7xl mx-auto bg-gray-50 rounded-xl shadow-sm mb-6">
        <h2 className="text-4xl font-bold text-blue-900 text-center">{artist && artist.nombre}</h2>
      </div>
      {/* Grid de Posters */}
        {artist && artist.trayectoria && artist.trayectoria.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {artist.trayectoria.map((project) => (
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
}

export default ArtistaProPage;
