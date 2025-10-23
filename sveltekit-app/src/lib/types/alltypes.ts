// Campos base de PocketBase que necesitamos para getURL
interface PocketBaseRecord {
    id: string;
    collectionId: string;
    collectionName: string;
}

export interface Grupo { id: string; nombre: string; presentadopor?: string }

export interface Persona {
    id: string;
    nombre: string;
    matricula: string;
}


export interface ProjectExpanded extends PocketBaseRecord {
    anio: number;
    estreno: string;
    nombre: string;
    programa: string; // id del programa de mano
    galeria: string[]; // ids de las imágenes de la galería 

    thumbnail?: string; // Variable temporal para la URL del thumbnail
    thumbnailLoading?: boolean // Variable temporal para el estado de carga del thumbnail

    expand: {
        grupo_id: Grupo;
        direccion_general: Persona[];
        direccion_asistente: Persona[];
        direccion_coreografico: Persona[];
        produccion_ejecutiva: Persona[];
        autor: Persona;
        elenco: Persona[];
    }
}

export interface ProjectPreview extends PocketBaseRecord {
    nombre: string;
    anio: number;
    grupo_id: string;
    programa: string;
    thumbnail?: string;
    thumbnailLoading?: boolean;
}