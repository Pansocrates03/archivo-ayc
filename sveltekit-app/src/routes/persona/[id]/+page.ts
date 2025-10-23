import type { PageLoad } from './$types';
import { obtenerObrasPorPersona, fetchPersona } from '$lib/services/DatabaseService';

export const load: PageLoad = async ({ params }) => {
    const id = params.id;
    const projects = await obtenerObrasPorPersona(id);
    const persona = await fetchPersona(id);
    return { projects, persona };
};

