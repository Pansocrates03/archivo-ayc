import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { timestampToDate } from "@/lib/utils";
import { Edit } from "lucide-react";

interface ProyectoProPageType {
  id: string;
  proyecto_nombre: string;
  estreno: string;
  programa_url: string;
  thumbnail_url: string;
  galeria_urls: string[];
  youtube_url: string;
  grupo_nombre: string;
  grupo_tag: string;
  creditos: {
    categoria: string;
    credito_id: string;
    persona_id: string;
    rol_nombre: string;
    persona_nombre: string;
  }[];
};

export function ProyectoProPage() {
  const [proyecto, setProyecto] = useState<ProyectoProPageType | null>(null);

  function proyectoClick() {
    // proyecto &&  proyecto.programa_url && window.open(proyecto?.programa_url)
    const matricula = prompt("Por seguridad solo se mostrará el programa de mano completo a quienes han participado en este proyecto.\n\nIngresa tu matrícula o nómina para continuar:", "A0");
    if (matricula) {
      alert(`La matrícula ${matricula} no se encuentra registrada. Por seguridad, el programa completo no se puede abrir. Si participaste en este proyecto envía un correo a e.s.baccio@gmail.com para registrar tu matrícula.`);
    } 
    
    // window.open(proyecto?.programa_url);
    
  }

  const defaultImage = "https://placehold.co/200x300?text=No+Image";

  useEffect(() => {
          const fetchProyecto = async () => {
              const id = window.location.pathname.split("/").pop();
              const response = await fetch(`/api/proyectos/${id}`);
              const data = await response.json();
              setProyecto(data);
          };
  
          fetchProyecto();
      }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div>{proyecto?.grupo_nombre}</div>
        <h1 className="text-5xl font-bold my-4">
          {proyecto?.proyecto_nombre || "Proyecto"}
          <Edit onClick={() => window.location.href = window.location + '/edit'} className="inline-block ml-2" />
        </h1>
        <p>{timestampToDate(proyecto?.estreno || "") || "Descripción no disponible."}</p>
      </div>

      <button className="block w-full group" onClick={proyectoClick}>
        <img src={proyecto?.thumbnail_url || defaultImage} alt={proyecto?.proyecto_nombre} className="mx-auto rounded-lg shadow-lg" />
        <p className="text-sm text-gray-500 text-center mt-3 group-hover:text-blue-600 transition-colors">Clic para abrir programa completo →</p>
      </button>

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6 space-y-5">
        <span className="text-lg font-bold">DIRECCIÓN</span>
        <div>
          {proyecto?.creditos.filter(c => c.categoria === "direccion").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
            )}
        </div>
        <span className="text-lg font-bold">COMPAÑÍA</span>
        <div>
          {proyecto?.creditos.filter(c => c.categoria === "elenco").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}
        </div>
        <span className="text-lg font-bold">STAFF</span>
        <div>
          {proyecto?.creditos.filter(c => c.categoria === "staff").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProyectoProPage;
