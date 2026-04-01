import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import type { Artist } from "@/lib/types";
import Footer from "@/components/Footer";

export function ArtistasPage() {

  const [artistas, setArtistas] = useState<Artist[]>([]);
  
  async function getArtists(search = "", page = 1) {
    const response = await fetch(`/api/artists?search=${search}&page=${page}`);
    const data = await response.json();
    setArtistas(data);
  }

  const onSelect = (artist: Artist) => {
    window.location.href = `/artistas/${artist.id}`;
    //alert(`Seleccionaste a ${artist.nombre}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
    <Header />
    
    <main className="p-6 md:p-10 max-w-7xl mx-auto">
      <PageTitle
        title="Artistas"
        description="Conoce a los artistas que han hecho posible cada proyecto. Explora sus perfiles y descubre su trabajo."
        search={(term) => getArtists(term)}
        searchPlaceholder="Buscar artistas" />

      {/* Grid de Artistas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artistas.map((artist) => (
          <button
            key={artist.id}
            onClick={() => onSelect(artist)}
            className="flex items-center p-4 bg-white border border-gray-100 rounded-lg hover:border-blue-400 hover:shadow-md hover:bg-blue-50 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium text-gray-700 truncate">{artist.nombre}</span>
          </button>
        ))}
      </div>
      
      {/* Reload para cargar siguiente página */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => getArtists(searchTerm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cargar más artistas
        </button>
      </div>


      {artistas.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          No se encontraron artistas con ese nombre.
        </div>
      )}

    </main>
    <Footer />
  </div>
  );
}

export default ArtistasPage;
