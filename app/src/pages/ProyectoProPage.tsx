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
    rol_id: string;
    persona_nombre: string;
  }[];
};

export function ProyectoProPage() {
  const [proyecto, setProyecto] = useState<ProyectoProPageType | null>(null);

  function proyectoClick() {
    // proyecto &&  proyecto.programa_url && window.open(proyecto?.programa_url)
    const matricula = prompt("Por seguridad solo se mostrará el programa de mano completo a quienes han participado en este proyecto.\n\nIngresa tu matrícula o nómina para continuar:", "A0");

    fetch(`/api/validate-matricula/${matricula}`)
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        window.open(proyecto?.programa_url, '_blank');
      } else {
        alert(`La matrícula "${matricula}" no se encuentra registrada.\nSi participaste en este proyecto envía un correo a e.s.baccio@gmail.com para registrar tu matrícula.`);
      }
    })
    
  }

  const defaultImage = "https://placehold.co/200x300?text=No+Image";

  useEffect(() => {
          const fetchProyecto = async () => {
              const id = window.location.pathname.split("/").pop();
              const response = await fetch(`/api/proyectos/${id}`);
              const data = await response.json();
              console.log("Proyecto data:", data.creditos);
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
          {/* <Edit onClick={() => window.location.href = window.location + '/edit'} className="inline-block ml-2" /> */}
        </h1>
        <p>{timestampToDate(proyecto?.estreno || "") || "Descripción no disponible."}</p>
      </div>

      <div className="w-full">
        <button className="mx-auto block group" onClick={proyectoClick}>
          <img
            src={proyecto?.thumbnail_url || defaultImage}
            alt={proyecto?.proyecto_nombre}
            // Agregamos un tamaño fijo (ej. w-64 h-96) y object-cover
            className="w-64 h-96 object-cover rounded-lg shadow-lg mx-auto" 
          />
          <p className="text-sm text-gray-500 text-center mt-3 group-hover:text-blue-600 transition-colors">
            Clic para abrir programa completo →
          </p>
        </button>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6 space-y-5">
        <span className="text-lg font-bold">DIRECCIÓN</span>
        
        <div>
          {/* DIRECCIÓN GENERAL */}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Dirección General").length! > 0 && (
            <span className="text-gray-500 font-bold">DIR. GENERAL: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Dirección General").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}

          {/* ASISTENTE DE DIRECCIÓN */}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Asistente de Dirección").length! > 0 && (
            <span className="text-gray-500 font-bold">A. de Dirección: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Asistente de Dirección").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}
          {/* DIRECCIÓN COREOGRÁFICA */}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Dirección Coreográfica").length! > 0 && (
            <span className="text-gray-500 font-bold">Dir. Coreográfica: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_nombre === "Dirección Coreográfica").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}
        </div>

{/* 
        <div>
          {proyecto?.creditos.filter(c => c.categoria === "direccion").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
            )}
        </div>
        */}
        <span className="text-lg font-bold">COMPAÑÍA</span>
        <div>

          {/* ACTORES */}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_actores").length! > 0 && (
            <span className="text-gray-500 font-bold">ACTORES: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_actores").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}

          {/* BAILARINES */}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_bailari").length! > 0 && (
            <span className="text-gray-500 font-bold">BAILARINES: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_bailari").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}

          {/* CANTANTES */}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_cantant").length! > 0 && (
            <span className="text-gray-500 font-bold">CANTANTES: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_cantant").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}

          {/* MÚSICOS */}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_musicos").length! > 0 && (
            <span className="text-gray-500 font-bold">MÚSICOS: </span>
          )}
          {proyecto?.creditos.filter(c => c.rol_id === "rol_musicos").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}


        </div>

{/* 
        <div>
          {proyecto?.creditos.filter(c => c.categoria === "elenco").map((cred) =>
            <a className="hover:text-blue-500" href={`/artistas/${cred.persona_id}`}>{cred.persona_nombre}, </a>
          )}
        </div>
        */}
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
