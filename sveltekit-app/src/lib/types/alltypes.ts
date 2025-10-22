export interface Proyecto {
    id: string;
    nombre: string;
    anio: number;
    estreno: string;
    elenco: any;
    sinopsis: string;
    programa: string;
    grupo_nombre: string;
    galeria: string[];
}

export interface Grupo { id: string; nombre: string; presentadopor?: string }

export interface Persona {
    id: string;
    nombre: string;
    matricula: string;
}

export interface ProyectoWithThumbnail extends Proyecto {
    thumbnail?: string;
    thumbnailLoading?: boolean
}

export interface ProjectExpanded {
    id: string;
    anio: number;
    estreno: string;
    nombre: string;
    programa: string; // id del programa de mano
    galeria: string[]; // ids de las imágenes de la galería 

    thumbnail?: string; // Variable temporal para la URL del thumbnail
    thumbnailLoading?: boolean // Variable temporal para el estado de carga del thumbnail

    expand: {
        grupo: Grupo[];
        direccion_general: Persona[];
        direccion_asistente: Persona[];
        produccion_ejecutiva: Persona[];
        autor: Persona[];
    }
}

export interface ProjectPreview {
    id: string;
    titulo: string;
    anio: number;
    grupo_nombre: string;
    programa: string;
    thumbnail: undefined,
    thumbnailLoading: false
}