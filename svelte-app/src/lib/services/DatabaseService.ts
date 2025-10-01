import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pocketbase-production-f5d2.up.railway.app');

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

export function getProgramaUrl(play: ProyectoWithThumbnail): string {
    return pb.files.getURL(play, play.programa);
}

// Obtener la URL de una imagen/archivo en la galería de un proyecto
export function getGalleryUrl(play: ProyectoWithThumbnail, filename: string): string {
    return pb.files.getURL(play, filename);
}

// Obtener una URL de thumbnail generada por PocketBase (si el servidor lo soporta)
// width x height como "300x200" y quality entre 1-100
export function getGalleryThumbUrl(play: ProyectoWithThumbnail, filename: string, width = 160, height = 110, quality = 5): string {
    // PocketBase client supports passing options which are converted to query params.
    // We use the `thumb` and `quality` params if available on the server.
    const opts: Record<string, any> = { thumb: `${width}x${height}`, quality };
    return pb.files.getURL(play, filename, opts);
}