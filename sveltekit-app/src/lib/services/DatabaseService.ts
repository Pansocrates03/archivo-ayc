import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pocketbase-production-f5d2.up.railway.app');

import type { Grupo, Persona, ProjectExpanded, ProjectPreview } from '$lib/types/alltypes';

// Caché en memoria para URLs de thumbnails
const thumbnailUrlCache = new Map<string, string>();

export async function fetchProject(id:string): Promise<ProjectExpanded> {
    try {
        const record = await pb.collection('proyectos').getOne(id, {
            expand: 'grupo_id, direccion_general, direccion_asistente, direccion_coreografico, produccion_ejecutiva, elenco, autor'
        });

        // Normalizar relaciones expandidas que pueden faltar en PocketBase
        // Algunos registros pueden no incluir 'expand' o las relaciones dentro de 'expand'.
        // Queremos que esos campos sean 'undefined' en lugar de lanzar errores.
        const expanded = record.expand ?? {};

        // Asegurarse de que las relaciones esperadas existan o sean undefined
        const safeRecord = {
            ...record,
            expand: {
                grupo_id: expanded.grupo_id ?? undefined,
                // Las relaciones que son listas deben convertirse a arrays vacíos si faltan
                direccion_general: Array.isArray(expanded.direccion_general) ? expanded.direccion_general : (expanded.direccion_general ? [expanded.direccion_general] : []),
                direccion_asistente: Array.isArray(expanded.direccion_asistente) ? expanded.direccion_asistente : (expanded.direccion_asistente ? [expanded.direccion_asistente] : []),
                direccion_coreografico: Array.isArray(expanded.direccion_coreografico) ? expanded.direccion_coreografico : (expanded.direccion_coreografico ? [expanded.direccion_coreografico] : []),
                produccion_ejecutiva: Array.isArray(expanded.produccion_ejecutiva) ? expanded.produccion_ejecutiva : (expanded.produccion_ejecutiva ? [expanded.produccion_ejecutiva] : []),
                // El elenco es una lista de personas: si no viene, devolver array vacío para evitar que .map() falle en la UI
                elenco: Array.isArray(expanded.elenco) ? expanded.elenco : (expanded.elenco ? [expanded.elenco] : []),
                autor: expanded.autor ?? undefined
            }
        } as unknown as ProjectExpanded;

        // Logging seguro: extraer nombre del director con cast a any para evitar errores de tipos
        // const directorName = (safeRecord.expand?.direccion_asistente ? (safeRecord.expand.direccion_asistente as any)?.nombre : undefined) ?? 'undefined';
        // console.log(`Obra obtenida: ${safeRecord.nombre ?? '<sin nombre>'}, director ${directorName}`);

        return safeRecord;
    } catch(err: any) {
        // Mantener el mensaje original del error para debugging
        const message = err?.message ? `Error al cargar el proyecto: ${err.message}` : 'Error al cargar el proyecto';
        throw new Error(message);
    }
}

export async function fetchProjectsPreview(page: number, searchTerm = '', groupId?: string): Promise<{ items: ProjectPreview[]; totalItems: number; page: number; perPage: number }> {
    const perPage = 10;
    try {
        const res = await pb
            .collection('proyectos')
            .getList(page, perPage, {
                filter: (searchTerm ? `nombre ~ "${searchTerm}"` : undefined) && (groupId ? `grupo_id = "${groupId}"` : undefined),
                fields: 'id,nombre,anio,grupo_id,programa,collectionId,collectionName',
                sort: '-anio'
            });

        console.log(`Proyectos de preview obtenidos:`, res.items);
        const items = res.items.map((proyecto: any) => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        })) as ProjectPreview[];
        return { items, totalItems: res.totalItems ?? items.length, page: res.page ?? page, perPage: res.perPage ?? perPage };
    } catch(err) {
        throw new Error('Error al cargar las obras de preview');
    }
}

export async function obtenerObrasPorPersona(personaId: string): Promise<ProjectPreview[]> {
    // Definimos los filtros. Usamos el operador '=' dentro del filtro.
    // PocketBase interpreta 'elenco ~ "personaId"' como 'dame todas las obras donde 
    // el campo de relación 'elenco' contenga esta ID'.
    const filterQuery = `elenco ~ "${personaId}"`;
    
    try {
        console.log("Buscando obras para la persona ID:", personaId);
        // Obtenemos la lista de obras que cumplen el filtro
        const result = await pb.collection('proyectos').getList(1, 50, {
            filter: filterQuery,
            // Sigue siendo buena práctica solo cargar los campos necesarios para la lista.
            fields: 'id,titulo,poster_url,anio_estreno', 
            // Podrías usar expand si quisieras mostrar a los co-actores, pero no es necesario para el objetivo
            // expand: 'elenco' 
        });

        console.log(`Se encontraron ${result.totalItems} obras para la persona ID: ${personaId}`);
        
        return result.items as ProjectPreview[];
    } catch (error: any) {
        console.error("Error al buscar obras por persona:", error.message);
        return [];
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

export function getProgramaUrl(project: ProjectExpanded | ProjectPreview): string {
    try {
        // Validaciones detalladas con logs
        if (!project) {
            console.warn('getProgramaUrl: proyecto es null/undefined');
            return '';
        }
        
        if (!project.programa) {
            console.warn('getProgramaUrl: programa no disponible para proyecto:', { id: project.id, nombre: project.nombre });
            return '';
        }

        if (!project.collectionId || !project.collectionName) {
            console.warn('getProgramaUrl: faltan campos PocketBase:', { 
                id: project.id, 
                collectionId: project.collectionId, 
                collectionName: project.collectionName 
            });
            return '';
        }

        const url = pb.files.getURL(project, project.programa);
        return url;
    } catch (err) {
        console.error('Error en getProgramaUrl:', err, 'Proyecto:', project);
        return '';
    }
}export function getGalleryUrl(project: ProjectExpanded | ProjectPreview, filename: string): string {
    return pb.files.getURL(project, filename);
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
    project: ProjectExpanded, 
    filename: string, 
    width = 120, 
    height = 90, 
    quality = 35
): string {
    // Generar clave de caché
    const cacheKey = `${project.id}_${filename}_${width}_${height}_${quality}`;

    // Verificar caché
    if (thumbnailUrlCache.has(cacheKey)) {
        return thumbnailUrlCache.get(cacheKey)!;
    }
    
    // Generar URL con parámetros optimizados
    const opts: Record<string, any> = { 
        thumb: `${width}x${height}`, 
        quality
    };

    const url = pb.files.getURL(project, filename, opts);

    // Guardar en caché
    thumbnailUrlCache.set(cacheKey, url);
    
    return url;
}


/**
 * NUEVO: Precarga de thumbnails en background
 * Llama a esta función después de cargar un proyecto para calentar la caché
 */
export function preloadGalleryThumbnails(project: ProjectExpanded): void {
    if (!project.galeria || project.galeria.length === 0) return;

    // Precargar los primeros 6 thumbnails
    const toPreload = project.galeria.slice(0, 6);

    toPreload.forEach(imgName => {
        const url = getGalleryThumbUrl(project, imgName, 120, 90, 35);
        
        // Usar Image API para prefetch sin bloquear
        if (typeof window !== 'undefined') {
            const img = new Image();
            img.src = url;
        }
    });
}