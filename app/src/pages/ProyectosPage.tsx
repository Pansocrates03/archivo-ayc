import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clapperboard } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import Header from '@/components/Header';
import type { ProjectWithCompany } from '@/lib/types';
import PageTitle from '@/components/PageTitle';
import Footer from '@/components/Footer';
import { ProjectService } from '@/lib/services';
import { useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20; // debe coincidir con el limit del backend

const ProyectosPage = () => {
  const [projects, setProjects] = useState<ProjectWithCompany[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const navigate = useNavigate();

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const isLoadingRef = useRef(false); // ← guardia síncrona

  const fetchProjects = useCallback(async (search: string, page: number, replace = false) => {
    if (isLoadingRef.current) return; // ← corta inmediatamente, sin esperar re-render
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      console.log("Fetching projects:", search, page);
      const data: ProjectWithCompany[] = await ProjectService.list(search, page);

      setHasMore(data.length === PAGE_SIZE);
      setProjects(prev => replace ? data : [...prev, ...data]);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      // If network error (e.g. "Failed to fetch"), stop further loads
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []); // ← ahora sin dependencias, el ref siempre tiene el valor actual

  // Búsqueda: reinicia la lista
  const onSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setHasMore(true);
    fetchProjects(term, 1, true);
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchProjects("", 1, true);
  }, []);

  // IntersectionObserver
  useEffect(() => {
    if (!hasMore) return; // ← ya no chequeamos isLoading aquí

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting && !isLoadingRef.current) { // ← ref en su lugar
          setCurrentPage(prev => {
            const nextPage = prev + 1;
            fetchProjects(searchTerm, nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, searchTerm]); // ← isLoading eliminado de las dependencias

  const isEmpty = !isLoading && projects.length === 0;

  // Agrupar proyectos por año
  const groupedProjects = projects.reduce((acc, project) => {
    const year = new Date(project.estreno).getFullYear(); // Asumiendo que cada proyecto tiene un campo "date"
    if (!acc[year]) acc[year] = [];
    acc[year].push(project);
    return acc;
  }, {} as Record<number, ProjectWithCompany[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-6 mt-10">
        <PageTitle
          title="Proyectos Artísticos"
          description="Descubre todos los proyectos artísticos que se han llevado a cabo en el Tecnológico de Monterrey."
          search={onSearch}
          searchPlaceholder="Buscar títulos"
        />

        {/* Grid de Posters */}
        {!isEmpty && (
          <div className="space-y-8">
            {Object.keys(groupedProjects).sort((a, b) => Number(b) - Number(a)).map((year) => (
              <div key={year}>
                <h2 className="text-2xl font-bold mb-4">{year}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {groupedProjects[Number(year)].map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onSelect={(p: any) => navigate(`/proyectos/${p.id}`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sentinel + spinner */}
        <div ref={sentinelRef} className="py-10 flex justify-center">
          {isLoading && (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {!isLoading && !hasMore && projects.length > 0 && (
          <p className="text-center text-gray-400 pb-8">No hay más proyectos.</p>
        )}

        {isEmpty && (
          <div className="text-center py-32">
            <Clapperboard className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-lg italic">
              No se encontraron proyectos que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProyectosPage;