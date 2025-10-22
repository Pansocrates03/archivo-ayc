import { writable } from 'svelte/store';
import type { ProyectoWithThumbnail } from '$lib/types/alltypes';

export const projectsStore = writable<ProyectoWithThumbnail[]>([]);