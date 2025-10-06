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

export interface ProyectoDetalle {
    id: string;
    nombre: string;
    anio: number;
    sinopsis: string;
    grupo: {
        id: string;
        tag: string;
        presentadopor: string;
        nombre: string;
    },
    participantes: {
        id: string;
        nombre: string;
        puesto: string;
        equipo: string;
    }[],
    archivos: {
        id: string;
        nombre: string;
        url: string;
    }[]
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