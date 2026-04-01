export interface Company {
    id: string;
    tag: string;
    nombre: string;
    sede: string | null;
    description: string | null;
    disciplina: string;
    banner_url: string;
    created_at: string;
    updated_at: string;
}

export interface Artist {
    id: string;
    nombre: string;
    matricula: string | null;
}

export interface Project {
    id: string;
    nombre: string;
    estreno: string;
    grupo_id: string;
    programa_url: string;
    thumbnail_url: string;
    youtube_url: string;
    galeria_urls: string[];
}

export interface ProjectWithCompany extends Project {
    company_name: string;
    disciplina: string;
}