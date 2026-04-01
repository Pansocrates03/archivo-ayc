
import AdminPage from "./pages/AdminPage";

import CompaniesPage from "./pages/CompaniesPage"
import ArtistasPage from "./pages/ArtistasPage";
import ProyectosPage from "./pages/ProyectosPage";

import ArtistaProPage from "./pages/ArtistaProPage";
import ProyectoProPage from "./pages/ProyectoProPage";
import CompaniaProPage from "./pages/CompaniaProPage";

import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";



export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProyectosPage />} />
        <Route path="/admin" element={<AdminPage />} />
        
        <Route path="/artistas" element={<ArtistasPage />} />
        <Route path="/artistas/:id" element={<ArtistaProPage />} />
        <Route path="/companias" element={<CompaniesPage />} />
        <Route path="/companias/:id" element={<CompaniaProPage />} />
        <Route path="/proyectos" element={<ProyectosPage />} />
        <Route path="/proyectos/:id" element={<ProyectoProPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
