
import AdminPage from "./pages/AdminPage";

import CompaniesPage from "./pages/CompaniesPage"
import ArtistasPage from "./pages/ArtistasPage";
import ProyectosPage from "./pages/ProyectosPage";

import ArtistaProPage from "./pages/ArtistaProPage";
import ProyectoProPage from "./pages/ProyectoProPage";
import CompaniaProPage from "./pages/CompaniaProPage";

import ProjectForm from "./components/forms/ProjectForm";
import CompanyForm from "./components/forms/CompanyForm";
import ArtistaForm from "./components/forms/ArtistaForm";

import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";





export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProyectosPage />} />
        <Route path="/admin" element={<AdminPage />} />
        
        <Route path="/artistas" element={<ArtistasPage />} />
        <Route path="/artistas/new" element={<ArtistaForm />} />
        <Route path="/artistas/:id" element={<ArtistaProPage />} />
        <Route path="/artistas/:id/edit" element={<ArtistaForm />} />
        

        <Route path="/companias" element={<CompaniesPage />} />
        <Route path="/companias/new" element={<CompanyForm />} />
        <Route path="/companias/:id" element={<CompaniaProPage />} />
        <Route path="/companias/:id/edit" element={<CompanyForm />} />

        <Route path="/proyectos" element={<ProyectosPage />} />
        <Route path="/proyectos/new" element={<ProjectForm />} />
        <Route path="/proyectos/:id" element={<ProyectoProPage />} />
        <Route path="/proyectos/:id/edit" element={<ProjectForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
