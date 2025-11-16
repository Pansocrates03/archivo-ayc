<script lang="ts">
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    import { lazyThumbnail } from '$lib/actions/lazyThumbnail';
    import { getProgramaUrl, fetchGroups } from '$lib/services/DatabaseService';
    import type { Grupo, ProjectPreview } from '$lib/types/alltypes';

    export let data: PageData;
    let { projects, persona } = data;
    console.log('Projects for persona:', projects);

    const thumbnailService = new ThumbnailService();
    let allGroups: Grupo[] = [];


    function groupProjectByGroup(projects: ProjectPreview[]): { [groupId: string]: ProjectPreview[] } {
        const grouped: { [groupId: string]: ProjectPreview[] } = {};
        projects.forEach((project) => {
            if (!grouped[project.grupo_id]) grouped[project.grupo_id] = [];
            grouped[project.grupo_id].push(project);
        });
        return grouped;
    }

    function handleProjectClick(project: ProjectPreview) {
        window.location.href = `/proyecto/${project.id}`;
    }

    $: groupedProjects = groupProjectByGroup(projects || []);
    $: sortedGroups = Object.keys(groupedProjects).sort();

    onMount(async () => {
        allGroups = await fetchGroups();
    });
</script>

<svelte:head>
    <title>{persona.nombre} - Archivo de Arte y Cultura Tec</title>
    <meta name="description" content="Proyectos de {persona.nombre}" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
    <div class="mx-auto max-w-7xl rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-10">
        <!-- Header con botón de regreso -->
        <div class="mb-8">
            <button 
                on:click={() => window.history.back()} 
                class="mb-6 flex items-center gap-2 text-indigo-600 transition-colors hover:text-indigo-800">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Volver
            </button>

            <!-- Perfil del actor -->
            <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 p-8 text-white shadow-lg">
                <h1 class="mb-4 text-4xl font-bold md:text-5xl">{persona.nombre}</h1>
                {#if persona.biografia}
                    <p class="text-lg leading-relaxed opacity-95">{persona.biografia}</p>
                {:else}
                    <p class="text-lg italic opacity-75">Actor en el Tecnológico de Monterrey</p>
                {/if}
            </div>

            <!-- Contador de proyectos -->
            <div class="mb-6 flex items-center gap-3">
                <div class="rounded-full bg-indigo-100 px-4 py-2">
                    <span class="font-semibold text-indigo-700">
                        {projects?.length || 0} {projects?.length === 1 ? 'proyecto' : 'proyectos'}
                    </span>
                </div>
            </div>
        </div>

        <main>
            {#if !projects || projects.length === 0}
                <div class="rounded-xl bg-gray-50 p-12 text-center">
                    <svg class="mx-auto mb-4 h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/>
                    </svg>
                    <p class="text-xl text-gray-600">No hay proyectos asociados a esta persona.</p>
                </div>
            {:else}
                {#each sortedGroups as group}
                    <section class="mb-12 animate-fade-in">
                        <h2 class="relative mb-6 text-3xl font-bold text-gray-700 md:text-4xl">
                            {groupedProjects[group] && groupedProjects[group].length > 0 ? allGroups.find(g => g.id === group)?.nombre : 'Sin grupo'    }
                            <span class="absolute bottom-0 left-0 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                        </h2>
                        <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {#each groupedProjects[group] as project (project.id)}
                                <article
                                    class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2" 
                                    on:click={() => handleProjectClick(project)}
                                    on:keydown={(e) => e.key === 'Enter' && handleProjectClick(project)}
                                    role="button" 
                                    tabindex="0">
                                    <div class="relative overflow-hidden max-h-80">
                                        {#if project.thumbnail}
                                            <img 
                                                src={project.thumbnail} 
                                                alt={project.nombre} 
                                                class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                                            />
                                        {:else}
                                            <div
                                                use:lazyThumbnail={{
                                                    generate: async () => {
                                                        const url = getProgramaUrl(project);
                                                        return await thumbnailService.generateThumbnail(url, 320);
                                                    },
                                                    onStart: () => {
                                                        project.thumbnailLoading = true;
                                                        projects = [...projects];
                                                    },
                                                    onLoaded: (dataUrl) => {
                                                        project.thumbnail = dataUrl;
                                                        project.thumbnailLoading = false;
                                                        projects = [...projects];
                                                    },
                                                    rootMargin: '300px'
                                                }}
                                                class="w-full h-80 bg-gray-200 flex items-center justify-center">
                                                {#if project.thumbnailLoading}
                                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                {:else}
                                                    <span class="text-gray-500">Sin miniatura</span>
                                                {/if}
                                            </div>
                                        {/if}
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    </div>
                                    <div class="p-5">
                                        <h3 class="mb-2 text-center text-lg font-semibold text-gray-800">{project.nombre}</h3>
                                        <div class="flex justify-center">
                                            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                                {allGroups.find(g => g.id === project.grupo_id)?.nombre || 'Sin grupo'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    </section>
                {/each}
            {/if}
        </main>
    </div>
</div>

<style>
    @keyframes fade-in {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-fade-in {
        animation: fade-in 0.5s ease-out;
    }
</style>