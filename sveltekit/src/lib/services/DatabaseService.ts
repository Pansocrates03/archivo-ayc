import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Función para cargar obras desde PocketBase
async function fetchPlays(): Promise<ProyectoWithThumbnail[]> {
    try {
        const proyectos: Proyecto[] = await pb.collection('vista_proyecto_grupo').getFullList({
            sort: '-anio',
        });
        
        // Agregar propiedades para thumbnails
        return proyectos.map(proyecto => ({
            ...proyecto,
            thumbnail: undefined,
            thumbnailLoading: false
        }));
        
    } catch (err) {
        throw new Error('Error al cargar las obras');
    }
}

// Nueva función para cargar grupos
async function fetchGroups(): Promise<Grupo[]> {
    try {
        return await pb.collection('grupos').getFullList({
            sort: 'nombre',
        });
    } catch (err) {
        console.error('Error al cargar los grupos:', err);
        return [];
    }
}