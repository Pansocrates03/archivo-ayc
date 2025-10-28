import type { PageLoad } from './$types';
import { fetchProject } from '$lib/services/DatabaseService';

export const load: PageLoad = async ({ params }) => {
    const id = params.id;
    const project = await fetchProject(id);
    console.log('Proyecto cargado en load():', project);
    return { project };
};

