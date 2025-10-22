<script lang="ts">
    import type { PageData } from './$types';
    import type { ProjectExpanded } from '$lib/types/alltypes';
    import { getGalleryThumbUrl, getGalleryUrl, getProgramaUrl } from '$lib/services/DatabaseService';

    export let data: PageData;

    let project: ProjectExpanded = data.project;
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    const thumbnailService = new ThumbnailService();

    let galleryPage = 0;
    let galleryPageSize = 3;

    function computeGalleryPageSize(width: number) {
        if (width < 640) return 3;
        if (width < 1024) return 4;
        if (width < 1400) return 5;
        return 6;
    }


    function openPrograma() {
        if (project) window.open(getProgramaUrl(project), '_blank');
    }

    function openGalleryImage(url: string) {
        window.open(url, '_blank');
    }

    $: totalPages = project && project.galeria ? Math.max(1, Math.ceil(project.galeria.length / galleryPageSize)) : 0;
    $: currentGallerySlice = project && project.galeria ? project.galeria.slice(galleryPage * galleryPageSize, (galleryPage + 1) * galleryPageSize) : [];

    let loadedImages = new Set<string>();
    
    function markLoaded(name: string) {
        loadedImages.add(name);
        loadedImages = new Set(loadedImages);
    }

    $: if (project) {
        loadedImages = new Set();
    }

    // Prefetch más agresivo: cargar página siguiente inmediatamente
    $: if (typeof window !== 'undefined' && project && project.galeria) {
        const maxPage = Math.floor((project.galeria.length - 1) / galleryPageSize);
        const nextPage = Math.min(maxPage, galleryPage + 1);
        
        if (nextPage > galleryPage) {
            const start = nextPage * galleryPageSize;
            const slice = project.galeria.slice(start, start + galleryPageSize);
            
            // Usar requestIdleCallback para no bloquear UI
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    slice.forEach(imgName => {
                        if (!loadedImages.has(imgName)) {
                            const img = new Image();
                            img.src = getGalleryThumbUrl(project, imgName, 150, 110, 40);
                        }
                    });
                });
            }
        }
    }

    import { onMount } from 'svelte';
    onMount(() => {
        galleryPageSize = computeGalleryPageSize(window.innerWidth);
        
        const onResize = () => {
            const newSize = computeGalleryPageSize(window.innerWidth);
            if (newSize !== galleryPageSize) {
                galleryPageSize = newSize;
                galleryPage = 0;
            }
        };
        window.addEventListener('resize', onResize);

        // Generate thumbnail client-side if needed
        (async () => {
            if (project && !project.thumbnail) {
                try {
                    project.thumbnailLoading = true;
                    project = { ...project };
                    const dataUrl = await thumbnailService.generateThumbnail(getProgramaUrl(project), 320);
                    project.thumbnail = dataUrl;
                } catch (err) {
                    console.error('Error generando miniatura en detalles:', err);
                } finally {
                    if (project) {
                        project.thumbnailLoading = false;
                        project = { ...project };
                    }
                }
            }
        })();

        return () => window.removeEventListener('resize', onResize);
    });
</script>

{#if project}
<div class="p-4 max-w-7xl mx-auto">
    <a href="/" aria-label="Volver" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        Volver
    </a>
    
    <h1 class="text-3xl font-bold mb-6">{project.nombre}</h1>

    <div class="flex flex-col lg:flex-row gap-8 mb-8">
        <div class="lg:w-2/5 w-full">
            <button on:click={openPrograma} class="block w-full group">
                {#if project.thumbnail}
                    <img 
                        src={project.thumbnail} 
                        alt={project.nombre} 
                        class="w-full max-w-md mx-auto rounded-lg shadow-lg group-hover:shadow-2xl transition-all cursor-pointer"
                        loading="eager"
                    />
                    <p class="text-sm text-gray-500 text-center mt-3 group-hover:text-blue-600 transition-colors">
                        Clic para abrir programa completo →
                    </p>
                {:else if project.thumbnailLoading}
                    <div class="w-full max-w-md h-96 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                        <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-gray-300"></div>
                    </div>
                {:else}
                    <div class="w-full max-w-md h-96 mx-auto bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                        <svg class="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="text-gray-500">Vista previa no disponible</span>
                    </div>
                {/if}
            </button>
        </div>

        <div class="lg:w-3/5 w-full">
            <div class="bg-white rounded-lg shadow-md p-6 space-y-5">
                <div>
                    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Grupo</h2>
                    <p class="text-lg text-gray-900">{project.expand?.grupo_id.nombre}</p>
                </div>
                <div>
                    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Estreno</h2>
                    <p class="text-lg text-gray-900">
                        {new Date(project.estreno).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div>
                    <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Elenco</h2>
                    <p class="text-gray-900 leading-relaxed">{project.expand?.elenco.map(person => person.nombre).join(', ')}</p>
                </div>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-900">Galería</h2>
            {#if project.galeria && project.galeria.length > 0}
                <span class="text-sm text-gray-500">
                    {project.galeria.length} {project.galeria.length === 1 ? 'foto' : 'fotos'}
                </span>
            {/if}
        </div>

        {#if project && project.galeria && project.galeria.length > 0}
            <div class="flex items-center gap-4">
                <button 
                    type="button" 
                    on:click={() => galleryPage = Math.max(0, galleryPage - 1)} 
                    class="p-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0" 
                    disabled={galleryPage === 0}
                    aria-label="Página anterior"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>

                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 flex-1">
                    {#each currentGallerySlice as imgName (imgName)}
                        <button 
                            type="button" 
                            on:click={() => openGalleryImage(getGalleryUrl(project, imgName))} 
                            class="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 group focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Ver imagen en tamaño completo"
                        >
                            <!-- UNA SOLA IMAGEN - Sin placeholder duplicado -->
                            <img 
                                src={getGalleryThumbUrl(project, imgName, 150, 110, 40)} 
                                alt={`${project!.nombre} - foto de galería`}
                                loading="lazy"
                                decoding="async"
                                class="absolute inset-0 w-full h-full object-cover transition-all duration-200 group-hover:scale-110" 
                                class:opacity-0={!loadedImages.has(imgName)}
                                class:opacity-100={loadedImages.has(imgName)}
                                on:load={() => markLoaded(imgName)} 
                                on:error={() => markLoaded(imgName)}
                            />
                            
                            <!-- Spinner minimalista -->
                            {#if !loadedImages.has(imgName)}
                                <div class="absolute inset-0 flex items-center justify-center bg-gray-200">
                                    <div class="w-5 h-5 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                                </div>
                            {/if}

                            <!-- Overlay hover -->
                            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                                <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </div>
                        </button>
                    {/each}
                </div>

                <button 
                    type="button" 
                    on:click={() => galleryPage = Math.min(Math.floor((project.galeria.length - 1) / galleryPageSize), galleryPage + 1)} 
                    class="p-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0" 
                    disabled={project ? (galleryPage >= Math.floor((project.galeria.length - 1) / galleryPageSize)) : true}
                    aria-label="Página siguiente"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
            
            <div class="text-sm text-gray-500 mt-4 text-center">
                Página {galleryPage + 1} de {totalPages}
            </div>
        {:else}
            <div class="text-center py-12">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-gray-500">No hay fotos disponibles.</p>
            </div>
        {/if}
    </div>
</div>
{:else}
<div class="p-4 max-w-7xl mx-auto">
    <div class="text-center py-20">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Proyecto no encontrado</h1>
        <a href="/" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Volver al inicio
        </a>
    </div>
</div>
{/if}