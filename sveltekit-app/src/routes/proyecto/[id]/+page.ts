import type { PageLoad } from './$types';
import { fetchPlayById, fetchPeople } from '$lib/services/DatabaseService';

export const load: PageLoad = async ({ params }) => {
    const id = params.id;
    const [play, people] = await Promise.all([fetchPlayById(id), fetchPeople()]);
    return { play, people };
};

