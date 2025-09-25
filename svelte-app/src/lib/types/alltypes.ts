export interface Proyecto {
    id: string;
    nombre: string;
    anio: number;
    estreno: any;
    sinopsis: string;
    programa: string;
    grupo_nombre: string;
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