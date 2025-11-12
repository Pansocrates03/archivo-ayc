import PocketBase from 'pocketbase';
export const pb = new PocketBase('http://127.0.0.1:8090/');

import type { Grupo, Persona, ProjectExpanded, ProjectPreview } from '$lib/types/alltypes';

// Caché en memoria para URLs de thumbnails
const thumbnailUrlCache = new Map<string, string>();

export async function fetchProject(id:string): Promise<ProjectExpanded> {
    try {
        const record = await pb.collection('proyectos').getOne(id, {
            expand: 'grupo_id, direccion_general, direccion_asistente, direccion_coreografico, produccion_ejecutiva, elenco, bailarines, musicos, cantantes, autor'
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
                bailarines: Array.isArray(expanded.bailarines) ? expanded.bailarines : (expanded.bailarines ? [expanded.bailarines] : []),
                musicos: Array.isArray(expanded.musicos) ? expanded.musicos : (expanded.musicos ? [expanded.musicos] : []),
                cantantes: Array.isArray(expanded.cantantes) ? expanded.cantantes : (expanded.cantantes ? [expanded.cantantes] : []),
                autor: expanded.autor ?? undefined
            }
        } as unknown as ProjectExpanded;

        // Logging seguro: extraer nombre del director con cast a any para evitar errores de tipos
        // const directorName = (safeRecord.expand?.direccion_asistente ? (safeRecord.expand.direccion_asistente as any)?.nombre : undefined) ?? 'undefined';
        // console.log(`Obra obtenida: ${safeRecord.nombre ?? '<sin nombre>'}, director ${directorName}`);

        // Convertir campo 'thumbnail' (filename) a URL si existe
        try {
            if ((safeRecord as any).thumbnail) {
                const thumb = (safeRecord as any).thumbnail;
                if (typeof thumb === 'string') {
                    (safeRecord as any).thumbnail = pb.files.getURL(record, thumb);
                } else if (Array.isArray(thumb) && thumb.length > 0) {
                    (safeRecord as any).thumbnail = pb.files.getURL(record, thumb[0]);
                }
            }
        } catch (e) {
            // ignore conversion errors
        }

        console.log('Musicos cargados:', safeRecord.expand?.musicos?.length ?? 0);
        return safeRecord;
    } catch(err: any) {
        // Mantener el mensaje original del error para debugging
        const message = err?.message ? `Error al cargar el proyecto: ${err.message}` : 'Error al cargar el proyecto';
        throw new Error(message);
    }
}

export async function fetchProjectsPreview(
    page: number, 
    searchTerm = '', 
    groupId?: string
): Promise<{ items: ProjectPreview[]; totalItems: number; page: number; perPage: number }> {
    const perPage = 10;
    
    try {
        // Construir filtros correctamente
        const filters: string[] = [];
        
        if (searchTerm && searchTerm.trim() !== '') {
            filters.push(`nombre ~ "${searchTerm.trim()}"`);
        }
        
        if (groupId && groupId.trim() !== '') {
            filters.push(`grupo_id = "${groupId}"`);
        }
        
        // Combinar con && solo si hay filtros
        const filterString = filters.length > 0 ? filters.join(' && ') : undefined;
        
        console.log('[fetchProjectsPreview] Filter:', filterString);
        
        const res = await pb
            .collection('proyectos')
            .getList(page, perPage, {
                filter: filterString,
                fields: 'id,nombre,anio,estreno,programa,grupo_id,collectionId,collectionName,thumbnail',
                sort: '-estreno,-anio'
            });

        console.log(`Proyectos de preview obtenidos:`, res.items.length, 'de', res.totalItems);
        
        const items = res.items.map((proyecto: any) => {
            // Convert PocketBase file reference to a full URL when possible
            let thumbUrl: string | undefined = undefined;
            try {
                if (proyecto.thumbnail) {
                    if (typeof proyecto.thumbnail === 'string') {
                        thumbUrl = pb.files.getURL(proyecto, proyecto.thumbnail);
                    } else if (Array.isArray(proyecto.thumbnail) && proyecto.thumbnail.length > 0) {
                        thumbUrl = pb.files.getURL(proyecto, proyecto.thumbnail[0]);
                    }
                }
            } catch (e) {
                // ignore and leave undefined
            }

            return {
                ...proyecto,
                // Use server-provided thumbnail URL when available; otherwise undefined so client can generate one
                thumbnail: thumbUrl ?? undefined,
                thumbnailLoading: false
            } as ProjectPreview;
        }) as ProjectPreview[];
        
        return { 
            items, 
            totalItems: res.totalItems ?? items.length, 
            page: res.page ?? page, 
            perPage: res.perPage ?? perPage 
        };
    } catch(err) {
        console.error('[fetchProjectsPreview] Error:', err);
        throw new Error('Error al cargar las obras de preview');
    }
}

export async function obtenerObrasPorPersona(personaId: string): Promise<ProjectPreview[]> {
    // Definimos los filtros. Usamos el operador '=' dentro del filtro.
    // PocketBase interpreta 'elenco ~ "personaId"' como 'dame todas las obras donde 
    // el campo de relación 'elenco' contenga esta ID'.
    const pid = String(personaId).replace(/"/g, '\\"');
    const terms = [
        `elenco ~ "${pid}"`,
        `bailarines ~ "${pid}"`,
        `musicos ~ "${pid}"`
    ];
    const filterQuery = terms.join(' || ');
    
    try {
        console.log("Buscando obras para la persona ID:", personaId);
        // Obtenemos la lista de obras que cumplen el filtro
        const result = await pb.collection('proyectos').getList(1, 50, {
            filter: filterQuery,
            // Sigue siendo buena práctica solo cargar los campos necesarios para la lista.
            fields: 'id,nombre,anio,grupo_id,programa,collectionId,collectionName',
            // Podrías usar expand si quisieras mostrar a los co-actores, pero no es necesario para el objetivo
            // expand: 'elenco' 
        });

        
        return result.items as ProjectPreview[];
    } catch (error: any) {
        console.error("Error al buscar obras por persona:", error.message);
        return [];
    }
}

export async function fetchPersona(id: string): Promise<Persona> {
    try {
        return await pb.collection('personas').getOne(id);
    } catch(err) {
        throw new Error('Error al cargar la persona');
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

export async function createProject(data: Record<string, any>): Promise<any> {
    try {
        // If caller passed a FormData (for file uploads) use it directly
        if (data instanceof FormData) {
            return await pb.collection('proyectos').create(data);
        }

        // Otherwise create with plain object
        return await pb.collection('proyectos').create(data);
    } catch (err: any) {
        console.error('Error creating project:', err);
        throw err;
    }
}

export async function updateProject(id: string, data: Record<string, any>): Promise<any> {
    try {
        if (data instanceof FormData) {
            return await pb.collection('proyectos').update(id, data);
        }
        return await pb.collection('proyectos').update(id, data);
    } catch (err: any) {
        console.error('Error updating project:', err);
        throw err;
    }
}

export async function fetchPeople(): Promise<Persona[]>{
    try {
        return await pb.collection('personas').getFullList({
            sort: 'nombre'
        }); 
    } catch(err) {
        console.error('Error al cargar los grupos:', err);
        return [];
    }
}

export async function createPersona(data: { nombre: string }): Promise<any> {
    try {
        return await pb.collection('personas').create(data);
    } catch (err: any) {
        console.error('Error creating persona:', err);
        throw err;
    }
}

export async function updatePersona(id: string, data: { nombre?: string }): Promise<any> {
    try {
        return await pb.collection('personas').update(id, data);
    } catch (err: any) {
        console.error('Error updating persona:', err);
        throw err;
    }
}

export async function deletePersona(id: string): Promise<any> {
    try {
        return await pb.collection('personas').delete(id);
    } catch (err: any) {
        console.error('Error deleting persona:', err);
        throw err;
    }
}

/**
 * Devuelve la cantidad total de proyectos asociados a una persona usando filtros en PocketBase
 */
export async function countProjectsForPersona(personaId: string): Promise<number> {
    try {
        const pid = String(personaId).replace(/"/g, '\\"');
        const terms = [
            `elenco ~ "${pid}"`,
            `bailarines ~ "${pid}"`,
            `musicos ~ "${pid}"`
        ];
        const filterQuery = terms.join(' || ');

        const res = await pb.collection('proyectos').getList(1, 1, {
            filter: filterQuery,
            fields: 'id'
        });

        return res.totalItems ?? 0;
    } catch (err) {
        console.error('Error counting projects for persona:', err);
        return 0;
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