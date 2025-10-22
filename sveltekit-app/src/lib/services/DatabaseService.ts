import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pocketbase-production-f5d2.up.railway.app');

import type { Proyecto, Grupo, Persona, ProyectoWithThumbnail, ProjectExpanded, ProjectPreview } from '$lib/types/alltypes';

// Caché en memoria para URLs de thumbnails
const thumbnailUrlCache = new Map<string, string>();

export async function fetchProject(id:string): Promise<ProjectExpanded | undefined> {
    try {
        const record = await pb.collection('proyectos').getOne("h1ob6kse96m3xs0", {
            expand: 'grupo_id, direccion_general, direccion_asistente, produccion_ejecutiva'
        });

        console.log(`Obra obtenida: ${record.nombre}, director ${record.expand?.direccion_asistente.nombre}`);
        return record as unknown as ProjectExpanded;
    } catch(err) {
        console.error('Error fetching play:', err);
        return;
    }
}

export async function fetchProjectsPreview(page: number, searchTerm = ''): Promise<ProjectPreview[]> {
    const perPage = 10;
    try {
        const res = await pb
            .collection('vista_proyecto_grupo')
            .getList(page, perPage, {
                filter: searchTerm ? `nombre ~ "${searchTerm}"` : undefined,
                fields: 'id,titulo,anio,grupo_nombre,programa',
                sort: '-anio'
            });

        console.log(`Proyectos de preview obtenidos:`, res.items);
        return res.items.map((proyecto: any) => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        })) as ProjectPreview[];
    } catch(err) {
        throw new Error('Error al cargar las obras de preview');
    }
}

export async function fetchPlays(): Promise<ProyectoWithThumbnail[]> {
    try {
        const proyectos: Proyecto[] = await pb
            .collection('vista_proyecto_grupo')
            .getFullList({ sort: '-anio' });
            
        return proyectos.map((proyecto) => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        }));
    } catch(err) {
        throw new Error('Error al cargar las obras');
    }
}

export async function fetchPlaysPage(page = 1, perPage = 15): Promise<{ items: ProyectoWithThumbnail[]; totalItems: number; page: number; perPage: number }> {
    try {
        const res = await pb.collection('vista_proyecto_grupo')
            .getList(page, perPage, { sort: '-anio' });

        const items = res.items.map((proyecto: any) => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        })) as ProyectoWithThumbnail[];
        return { items, totalItems: res.totalItems ?? items.length, page: res.page ?? page, perPage: res.perPage ?? perPage };
    } catch (err) {
        console.error('Error fetching plays page:', err);
        throw new Error('Error al cargar las obras paginadas');
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

export function getGalleryUrl(play: ProyectoWithThumbnail, filename: string): string {
    return pb.files.getURL(play, filename);
}

/**
 * SOLUCIÓN OPTIMIZADA: Thumbnails ultra-pequeños con caché
 * Para imágenes de 25MB, necesitamos thumbnails muy pequeños
 * 
 * @param play - Proyecto
 * @param filename - Nombre del archivo
 * @param width - Ancho (default: 120px - suficiente para preview)
 * @param height - Alto (default: 90px)
 * @param quality - Calidad (default: 35 para máxima compresión)
 */
export function getGalleryThumbUrl(
    play: ProyectoWithThumbnail, 
    filename: string, 
    width = 120, 
    height = 90, 
    quality = 35
): string {
    // Generar clave de caché
    const cacheKey = `${play.id}_${filename}_${width}_${height}_${quality}`;
    
    // Verificar caché
    if (thumbnailUrlCache.has(cacheKey)) {
        return thumbnailUrlCache.get(cacheKey)!;
    }
    
    // Generar URL con parámetros optimizados
    const opts: Record<string, any> = { 
        thumb: `${width}x${height}`, 
        quality
    };
    
    const url = pb.files.getURL(play, filename, opts);
    
    // Guardar en caché
    thumbnailUrlCache.set(cacheKey, url);
    
    return url;
}

export async function fetchPlayById(id: string): Promise<ProyectoWithThumbnail | null> {
    try {
        const proyecto = await pb.collection('vista_proyecto_grupo').getOne(id);
        return ({ ...proyecto, thumbnail: undefined, thumbnailLoading: false } as unknown) as ProyectoWithThumbnail;
    } catch (err) {
        console.error('Error fetching play by id:', err);
        return null;
    }
}

/**
 * NUEVO: Precarga de thumbnails en background
 * Llama a esta función después de cargar un proyecto para calentar la caché
 */
export function preloadGalleryThumbnails(play: ProyectoWithThumbnail): void {
    if (!play.galeria || play.galeria.length === 0) return;
    
    // Precargar los primeros 6 thumbnails
    const toPreload = play.galeria.slice(0, 6);
    
    toPreload.forEach(imgName => {
        const url = getGalleryThumbUrl(play, imgName, 120, 90, 35);
        
        // Usar Image API para prefetch sin bloquear
        if (typeof window !== 'undefined') {
            const img = new Image();
            img.src = url;
        }
    });
}