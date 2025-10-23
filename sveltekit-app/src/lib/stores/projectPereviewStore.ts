import { writable } from 'svelte/store';
import type { ProjectPreview } from '$lib/types/alltypes';

export const projectsPreviewStore = writable<ProjectPreview[]>([]);