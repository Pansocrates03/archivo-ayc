<script lang="ts">
    import './+page.css';
    import { onMount, onDestroy } from 'svelte';
    import Header from '$lib/components/Header.svelte';
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    import { lazyThumbnail } from '$lib/actions/lazyThumbnail';
    import type { Grupo, ProjectPreview } from '$lib/types/alltypes';
    import { fetchGroups, getProgramaUrl, obtenerObrasPorPersona } from '$lib/services/DatabaseService';

    // STORES
    import { projectsPreviewStore } from '$lib/stores/projectPereviewStore';
    
    const thumbnailService = new ThumbnailService();

    interface GroupedPlays { [year: number]: ProjectPreview[] }

    let allGroups: Grupo[] = [];
    let filteredPlays: ProjectPreview[] = [];
    
    let sentinel: HTMLElement | null = null;
    let observer: IntersectionObserver | null = null;
    let removeScroll: (() => void) | null = null;
    let _prevSentinel: HTMLElement | null = null;
    
    // Local UI state for inputs (estos son los valores del input del usuario)
    let searchTerm = '';
    let selectedGroup: string = '';
    let loading = true;
    
    // Debounce timer
    let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_DELAY = 500;

    // Subscribe to store state
    $: storeState = $projectsPreviewStore;
    $: allPlays = storeState.items;
    $: error = storeState.error || '';

    function groupPlaysByYear(plays: ProjectPreview[]): GroupedPlays {
        const grouped: GroupedPlays = {};
        plays.forEach((play) => {
            if (!grouped[play.anio]) grouped[play.anio] = [];
            grouped[play.anio].push(play);
        });
        return grouped;
    }

    function filterPlays(plays: ProjectPreview[], group: string): ProjectPreview[] {
        let tempPlays = plays;
        // Solo filtrar por grupo localmente, la búsqueda se hace en el servidor
        if (group) tempPlays = tempPlays.filter((p) => p.grupo_id === group);
        return tempPlays;
    }

    async function handlePlayClick(play: ProjectPreview) {
        obtenerObrasPorPersona('42lczslha38mu7q');
        window.location.href = `/proyecto/${play.id}`;
    }

    // Solo filtrar por grupo localmente
    $: filteredPlays = filterPlays(allPlays, selectedGroup);
    $: groupedPlays = groupPlaysByYear(filteredPlays);
    $: sortedYears = Object.keys(groupedPlays).map(Number).sort((a, b) => b - a);

    // Watch searchTerm with debounce - solo reacciona a cambios en searchTerm
    $: if (typeof window !== 'undefined' && searchTerm !== undefined) {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        searchDebounceTimer = setTimeout(() => {
            // Solo actualizar si el valor cambió respecto al store
            const currentStoreSearch = $projectsPreviewStore.search;
            if (searchTerm !== currentStoreSearch) {
                console.log('[live-search] Actualizando búsqueda:', searchTerm);
                projectsPreviewStore.setSearch(searchTerm);
            }
        }, DEBOUNCE_DELAY);
    }

    // Watch selectedGroup changes - usar función separada para evitar loops
    function handleGroupChange(group: string) {
        const currentStoreGroup = $projectsPreviewStore.group || '';
        if (group !== currentStoreGroup) {
            console.log('[group-filter] Actualizando grupo:', group);
            projectsPreviewStore.setGroup(group || undefined);
        }
    }
    
    // Solo reaccionar a cambios en selectedGroup, no en todo el storeState
    $: if (typeof window !== 'undefined' && !loading && selectedGroup !== undefined) {
        handleGroupChange(selectedGroup);
    }

    onMount(async () => {
        loading = true;
        try {
            // Cargar grupos primero
            allGroups = await fetchGroups();
            
            // Inicializar búsqueda desde el store si existe
            searchTerm = $projectsPreviewStore.search;
            selectedGroup = $projectsPreviewStore.group || '';
            
            // Cargar primera página
            projectsPreviewStore.loadPage(1);

            // Setup intersection observer for infinite scroll
            if (typeof window !== 'undefined') {
                if ('IntersectionObserver' in window) {
                    observer = new IntersectionObserver((entries) => {
                        for (const entry of entries) {
                            const state = $projectsPreviewStore;
                            console.log('[observer] Entry:', {
                                isIntersecting: entry.isIntersecting,
                                hasMore: state.hasMore,
                                loadingMore: state.loadingMore,
                                page: state.page,
                                itemsCount: state.items.length
                            });
                            
                            if (entry.isIntersecting && state.hasMore && !state.loadingMore) {
                                console.log('[observer] ✅ Loading next page...');
                                projectsPreviewStore.loadNext();
                            }
                        }
                    }, { root: null, rootMargin: '400px', threshold: 0.1 });
                    
                    if (sentinel) observer.observe(sentinel);
                } else {
                    // Fallback: debounced scroll listener
                    let scrollTimeout: number | null = null;
                    const scrollHandler = () => {
                        if (scrollTimeout) window.clearTimeout(scrollTimeout);
                        scrollTimeout = window.setTimeout(() => {
                            const state = $projectsPreviewStore;
                            const nearBottom = (window.innerHeight + window.scrollY) >= 
                                (document.documentElement.offsetHeight - 800);
                            
                            console.log('[scroll] Check:', {
                                nearBottom,
                                hasMore: state.hasMore,
                                loadingMore: state.loadingMore
                            });
                            
                            if (nearBottom && state.hasMore && !state.loadingMore) {
                                console.log('[scroll] ✅ Loading next page...');
                                projectsPreviewStore.loadNext();
                            }
                        }, 150);
                    };
                    window.addEventListener('scroll', scrollHandler);
                    removeScroll = () => window.removeEventListener('scroll', scrollHandler);
                }
            }
        } catch (err) {
            console.error('Error en onMount:', err);
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        try { observer?.disconnect(); } catch(e) {}
        try { removeScroll?.(); } catch(e) {}
    });

    // Ensure observer is attached to sentinel
    $: if (observer) {
        if (_prevSentinel && _prevSentinel !== sentinel) {
            try { observer.unobserve(_prevSentinel); } catch(e) {}
            _prevSentinel = null;
        }
        if (sentinel && _prevSentinel !== sentinel) {
            try { 
                observer.observe(sentinel); 
                _prevSentinel = sentinel; 
            } catch(e) {}
        }
    }
</script>

<svelte:head>
    <title>Archivo de Arte y Cultura Tec</title>
    <meta name="description" content="Explora nuestra colección de obras de teatro organizadas por año" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
    <div class="mx-auto max-w-7xl rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-10">
        <Header bind:searchTerm bind:selectedGroup {allGroups} />
        <main>
            {#if loading}
                <div class="py-20 text-center">
                    <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                    <p class="mt-4 text-xl text-indigo-600">Cargando obras de teatro...</p>
                </div>
            {:else if error}
                <div class="rounded-xl bg-red-50 p-8 text-center">
                    <p class="text-xl text-red-600">{error}</p>
                    <button 
                        on:click={() => window.location.reload()} 
                        class="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700">
                        Reintentar
                    </button>
                </div>
            {:else if filteredPlays.length === 0}
                <div class="rounded-xl bg-gray-50 p-8 text-center">
                    <p class="text-xl text-gray-600">
                        {searchTerm || selectedGroup 
                            ? 'No se encontraron obras que coincidan con tu búsqueda o filtro de grupo' 
                            : 'No hay obras disponibles'}
                    </p>
                </div>
            {:else}
                {#each sortedYears as year}
                    <section class="mb-12 animate-fade-in">
                        <h2 class="relative mb-6 text-3xl font-bold text-gray-700 md:text-4xl">
                            {year}
                            <span class="absolute bottom-0 left-0 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                        </h2>
                        <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {#each groupedPlays[year] as play (play.id)}
                                <article 
                                    class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2" 
                                    on:click={() => handlePlayClick(play)} 
                                    on:keydown={(e) => e.key === 'Enter' && handlePlayClick(play)}
                                    role="button" 
                                    tabindex="0">
                                    <div class="relative overflow-hidden max-h-80">
                                        {#if play.thumbnail}
                                            <img 
                                                src={play.thumbnail} 
                                                alt={play.nombre} 
                                                class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" 
                                            />
                                        {:else}
                                            <div
                                                use:lazyThumbnail={{
                                                    generate: async () => {
                                                        const url = getProgramaUrl(play);
                                                        return await thumbnailService.generateThumbnail(url, 320);
                                                    },
                                                    onStart: () => {
                                                        projectsPreviewStore.patchItem(play.id, { thumbnailLoading: true });
                                                    },
                                                    onLoaded: (dataUrl) => {
                                                        projectsPreviewStore.patchItem(play.id, { 
                                                            thumbnail: dataUrl, 
                                                            thumbnailLoading: false 
                                                        });
                                                    },
                                                    rootMargin: '300px'
                                                }}
                                                class="w-full h-80 bg-gray-200 flex items-center justify-center">
                                                {#if play.thumbnailLoading}
                                                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                {:else}
                                                    <span class="text-gray-500">Sin miniatura</span>
                                                {/if}
                                            </div>
                                        {/if}
                                        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                                    </div>
                                    <div class="p-5">
                                        <h3 class="mb-2 text-center text-lg font-semibold text-gray-800">{play.nombre}</h3>
                                        <div class="flex justify-center">
                                            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                                {allGroups.find(g => g.id === play.grupo_id)?.nombre || 'Sin grupo'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    </section>
                {/each}
                
                <!-- Sentinel for infinite scroll -->
                <div bind:this={sentinel} class="h-4"></div>
                
                {#if storeState.loadingMore}
                    <div class="py-6 text-center">
                        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        <p class="mt-2 text-sm text-gray-600">Cargando más obras...</p>
                    </div>
                {/if}
            {/if}
        </main>
    </div>
</div>