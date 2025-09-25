import PocketBase from 'pocketbase';
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

import type { Proyecto, Grupo, Persona, ProyectoWithThumbnail } from '../types/alltypes';

export async function fetchPlays(): Promise<ProyectoWithThumbnail[]> {
    try {
        const proyectos: Proyecto[] = await pb.collection('vista_proyecto_grupo').getFullList({ sort: '-anio' });

        // Agregar propiedades para thumbnails
        return proyectos.map((proyecto) => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        }));
    } catch(err) {
        throw new Error('Error al cargar las obras');
    }
}

export async function fetchGroups(): Promise<Grupo[]> {
    try {
        return await pb.collection('grupos').getFullList({ sort: 'nombre' });
    } catch(err) {
        console.error('Error al cargar los grupos:', err);
        return [];
    }
}

export async function fetchPeople(): Promise<Persona[]>{
    try {
        return await pb.collection('personas').getFullList();
    } catch(err) {
        console.error('Error al cargar los grupos:', err);
        return [];
    }
}