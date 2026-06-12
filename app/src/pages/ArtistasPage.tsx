import { useEffect, useState, useRef, useCallback } from "react";
import { User } from "lucide-react";
import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import type { Artist } from "@/lib/types";
import Footer from "@/components/Footer";
import { ArtistService } from "@/lib/services";

export function ArtistasPage() {
  const [artistas, setArtistas] = useState<Artist[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 50; // debe coincidir con el limit del backend

  const fetchArtists = useCallback(async (search: string, page: number, replace = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data: Artist[] = await ArtistService.list(search, page);

      // Si devuelve menos items que el límite, no hay más páginas
      setHasMore(data.length === PAGE_SIZE);

      setArtistas(prev => replace ? data : [...prev, ...data]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Búsqueda: reinicia la lista
  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setHasMore(true);
    fetchArtists(term, 1, true);
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchArtists("", 1, true);
  }, []);

  // IntersectionObserver: dispara la siguiente página cuando el sentinel es visible
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          setCurrentPage(prev => {
            const nextPage = prev + 1;
            fetchArtists(searchTerm, nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, isLoading, searchTerm]);

  const onSelect = (artist: Artist) => {
    window.location.href = `/artistas/${artist.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <PageTitle
          title="Artistas"
          description="Conoce a los artistas que han hecho posible cada proyecto. Explora sus perfiles y descubre su trabajo."
          search={onSearch}
          searchPlaceholder="Buscar artistas"
        />

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

        {/* Sentinel: el observer lo vigila para cargar la siguiente página */}
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {isLoading && (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {!isLoading && !hasMore && artistas.length > 0 && (
          <p className="text-center text-gray-400 pb-6">Has llegado al final. Mostrando a {artistas.length} artista{artistas.length > 1 ? 's' : ''}.</p>
        )}

        {!isLoading && artistas.length === 0 && (
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