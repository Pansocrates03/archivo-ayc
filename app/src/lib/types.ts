export interface Artist {
    id: string;
    nombre: string;
    matricula: string | null;
}

interface Credit {
    id: string;
    proyecto_id: string;
    ro_id: string;
    persona_id: string;
    orden: number;
    created_at: string;
    credito: string;
}

export interface Company {
    id: string;
    tag: string;
    nombre: string;
    sede: string | null;
    descripcion: string | null;
    disciplina: string;
    banner_url: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyDetail extends Company {
    proyectos: Project[];
}

export interface ArtistDetail extends Artist {
    creditos: {
        id: string;
        orden: number;
        proyecto: ProjectDetail;
        rol_id: string;
        rol_nombre: string;
        categoriarol: string;
    }[];
}

export interface Project {
    id: string;
    nombre: string;
    estreno: string;
    grupo_id: string;
    programa_url: string;
    thumbnail_url: string;
    youtube_url: string | null;
    galeria_urls: string[];
}

export interface ProjectDetail extends Project {
    company_name: string;
    disciplina: string;
}