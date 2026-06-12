import React, { useState, useMemo, useEffect } from 'react';
import { Search, Building2 } from 'lucide-react';
import CompanyCard from '../components/CompanyCard';
import Header from '@/components/Header';
import PageTitle from '@/components/PageTitle';
import type { Company } from '@/lib/types';
import Footer from '../components/Footer';
import { CompanyService } from '@/lib/services';

// DATOS DE PRUEBA (Mock Data) para visualizar el ejemplo nacional

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  async function getCompanies(search = "") {
    const data = await CompanyService.list(search);
    console.log("Compañías obtenidas del backend");
    setCompanies(data);
  }

  useEffect(() => {
    console.log("Obteniendo compañías del backend...");
    getCompanies();
  }, []);


  // Función al seleccionar una compañía
  const handleSelectCompany = (company: any) => {
    window.location.href = `/companias/${company.tag}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegación simulada del Tec */}
      <Header />

      {/* Contenido Principal */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        <PageTitle
          title="Compañías Representativas"
          description="Descubre los grupos de música, teatro y danza del Tecnológico de Monterrey."
          search={(term) => getCompanies(term)}
          searchPlaceholder='Buscar compañías' />
      

        {/* Grid de Compañías (Configuración de columnas visual) */}
        {companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {companies.map((company) => (
              <CompanyCard 
                key={company.id} 
                company={company} 
                onSelect={handleSelectCompany} 
              />
            ))}
          </div>
        ) : (
          // Estado vacío si no hay resultados
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <p className="text-2xl text-gray-600 font-semibold">No encontramos esa compañía</p>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">Intenta buscar por el nombre exacto de la agrupación o por el nombre del campus.</p>
            <button 
              onClick={() => getCompanies("")}
              className="mt-8 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Mostrar todas las compañías
            </button>
          </div>
        )}

      </main>

      {/* Footer simple */}
      <Footer />
    </div>
  );
};

export default CompaniesPage;