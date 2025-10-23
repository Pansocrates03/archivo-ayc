<script lang="ts">
    import './+page.css';
    import { onMount, onDestroy } from 'svelte';
    import Header from '$lib/components/Header.svelte';
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    import { lazyThumbnail } from '$lib/actions/lazyThumbnail';
    import type { Grupo, ProjectPreview } from '$lib/types/alltypes';
    import { fetchGroups, getProgramaUrl, fetchProjectsPreview, obtenerObrasPorPersona } from '$lib/services/DatabaseService';

    // STORES
    import { projectsPreviewStore } from '$lib/stores/projectPereviewStore';
    let allPlays: ProjectPreview[] = [];
    projectsPreviewStore.subscribe(value => {
        allPlays = value;
    });

    const thumbnailService = new ThumbnailService();

    interface GroupedPlays { [year: number]: ProjectPreview[] }

    
    let allGroups: Grupo[] = [];
    let filteredPlays: ProjectPreview[] = [];
    // pagination state
    let page = 1;
    const perPage = 15;
    let totalItems = 0;
    let hasMore = true;
    let loadingMore = false;
    let sentinel: HTMLElement | null = null;
    let observer: IntersectionObserver | null = null;
    let removeScroll: (() => void) | null = null;
    let _prevSentinel: HTMLElement | null = null;
    let searchTerm = '';
    let selectedGroup: string = '';
    let loading = true;
    let error = '';
    
    // Debounce timer
    let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const DEBOUNCE_DELAY = 500; // 500ms delay

    function groupPlaysByYear(plays: ProjectPreview[]): GroupedPlays {
        const grouped: GroupedPlays = {};
        plays.forEach((play) => {
            if (!grouped[play.anio]) grouped[play.anio] = [];
            grouped[play.anio].push(play);
        });
        return grouped;
    }

    function filterPlays(plays: ProjectPreview[], search: string, group: string): ProjectPreview[] {
        let tempPlays = plays;
        // Solo filtrar por grupo localmente, la búsqueda se hace en el servidor
        if (group) tempPlays = tempPlays.filter((p) => p.grupo_id === group);
        return tempPlays;
    }

    async function handlePlayClick(play: ProjectPreview) {
        obtenerObrasPorPersona('42lczslha38mu7q');
        window.location.href = `/proyecto/${play.id}`;
    }

    $: filteredPlays = filterPlays(allPlays, searchTerm, selectedGroup);
    $: groupedPlays = groupPlaysByYear(filteredPlays);
    $: sortedYears = Object.keys(groupedPlays).map(Number).sort((a, b) => b - a);

    // track the current active search term used for server queries
    let activeSearch = '';

    async function loadPage(p: number, search = '') {
        try {
            loadingMore = true;
            
            // use provided search, fallback to activeSearch
            const searchQuery = search || activeSearch;
            const res = await fetchProjectsPreview(p, searchQuery, selectedGroup || undefined);

            // Si llegamos aquí, la búsqueda fue exitosa - limpiar error
            error = '';

            // Append new items instead of replacing
            if (p === 1) {
                projectsPreviewStore.set(res.items);
            } else {
                projectsPreviewStore.update(current => [...current, ...res.items]);
            }

            // Update pagination metadata
            totalItems = res.totalItems ?? allPlays.length;
            hasMore = allPlays.length < totalItems;
        } catch (err) {
            console.error('Error cargando página de obras:', err);
            const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
            
            // Solo mostrar error si es la primera página o no hay datos
            if (p === 1) {
                error = errorMsg;
                allPlays = [];
                hasMore = false;
            } else {
                // Para páginas subsecuentes, solo log el error
                console.warn('Error en paginación, manteniendo datos existentes');
            }
        } finally {
            loadingMore = false;
            console.log('[pagination] loadPage done', p, 'hasMore=', hasMore);
        }
    }

    // Función para realizar búsqueda en vivo
    async function performLiveSearch(search: string) {
        try {
            console.log('[live-search] Buscando:', search);
            activeSearch = search;
            page = 1;
            hasMore = true;
            // loadPage manejará el estado de error internamente
            await loadPage(1, search);
        } catch (err) {
            console.error('[live-search] Error:', err);
            // El error ya fue manejado en loadPage
        }
    }

    // Reactive statement para detectar cambios en searchTerm con debounce
    $: if (typeof window !== 'undefined') {
        // Limpiar timer anterior
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        // Crear nuevo timer
        searchDebounceTimer = setTimeout(() => {
            // Solo hacer búsqueda si el término cambió
            if (searchTerm !== activeSearch) {
                performLiveSearch(searchTerm);
            }
        }, DEBOUNCE_DELAY);
    }

    // También reaccionar a cambios en selectedGroup
    $: {
        if (selectedGroup !== undefined && !loading) {
            // Reiniciar búsqueda cuando cambia el grupo
            page = 1;
            hasMore = true;
            loadPage(1, activeSearch);
        }
    }

    onMount(async () => {
        loading = true;
        try {
            error = '';
            page = 1;
            await loadPage(page);
            allGroups = await fetchGroups();

            // intersection observer for infinite scroll
            if (typeof window !== 'undefined') {
                if ('IntersectionObserver' in window) {
                    observer = new IntersectionObserver((entries) => {
                        for (const entry of entries) {
                            console.log('[pagination] observer entry', entry.isIntersecting, entry.target);
                            if (entry.isIntersecting && hasMore && !loadingMore) {
                                page += 1;
                                loadPage(page);
                            }
                        }
                    }, { root: null, rootMargin: '400px', threshold: 0.1 });
                    if (sentinel) observer.observe(sentinel);
                } else {
                    // fallback: debounced scroll listener
                    let scrollTimeout: number | null = null;
                    const scrollHandler = () => {
                        if (scrollTimeout) window.clearTimeout(scrollTimeout);
                        scrollTimeout = window.setTimeout(() => {
                            const nearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.offsetHeight - 800);
                            console.log('[pagination] scroll check, nearBottom=', nearBottom, 'hasMore=', hasMore, 'loadingMore=', loadingMore);
                            if (nearBottom && hasMore && !loadingMore) {
                                page += 1;
                                loadPage(page);
                            }
                        }, 150);
                    };
                    (window as any).addEventListener('scroll', scrollHandler);
                    // ensure we remove it on destroy (assign function to top-level var)
                    removeScroll = () => (window as any).removeEventListener('scroll', scrollHandler);
                }
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
        // Limpiar debounce timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        try { window.removeEventListener('resize', () => {}); } catch(e) {}
        try { observer?.disconnect(); } catch(e) {}
        try { removeScroll?.(); } catch(e) {}
    });

    // ensure observer is attached to sentinel even if sentinel is set after onMount
    $: if (observer) {
        // detach previous
        if (_prevSentinel && _prevSentinel !== sentinel) {
            try { observer.unobserve(_prevSentinel); } catch(e) {}
            _prevSentinel = null;
        }
        if (sentinel && _prevSentinel !== sentinel) {
            try { observer.observe(sentinel); _prevSentinel = sentinel; } catch(e) {}
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
                    <button on:click={() => window.location.reload()} class="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700">Reintentar</button>
                </div>
            {:else if filteredPlays.length === 0}
                <div class="rounded-xl bg-gray-50 p-8 text-center">
                    <p class="text-xl text-gray-600">{searchTerm || selectedGroup ? 'No se encontraron obras que coincidan con tu búsqueda o filtro de grupo' : 'No hay obras disponibles'}</p>
                </div>
            {:else}
                {#each sortedYears as year}
                    <section class="mb-12 animate-fade-in">
                        <h2 class="relative mb-6 text-3xl font-bold text-gray-700 md:text-4xl">
                            {year}
                            <span class="absolute bottom-0 left-0 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                        </h2>
                        <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            {#each groupedPlays[year] as play (play.id)}
                                <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                <article class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2" on:click={() => handlePlayClick(play)} role="button" tabindex="0">
                                    <div class="relative overflow-hidden max-h-80">
                                        {#if play.thumbnail}
                                            <img src={play.thumbnail} alt={play.nombre} class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" />
                                        {:else}
                                            <div
                                                use:lazyThumbnail={{
                                                    generate: async () => {
                                                        const url = getProgramaUrl(play);
                                                        return await thumbnailService.generateThumbnail(url, 320);
                                                    },
                                                    onStart: () => {
                                                        //console.log('[thumb] start', play.id);
                                                        play.thumbnailLoading = true;
                                                        allPlays = [...allPlays];
                                                    },
                                                    onLoaded: (dataUrl) => {
                                                        //console.log('[thumb] loaded for', play.id, 'len:', dataUrl?.length);
                                                        play.thumbnail = dataUrl;
                                                        play.thumbnailLoading = false;
                                                        allPlays = [...allPlays];
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
                                            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">{allGroups.find(g => g.id === play.grupo_id)?.nombre}</span>
                                        </div>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    </section>
                {/each}
                <!-- sentinel for infinite scroll -->
                <div bind:this={sentinel} class="h-4"></div>
                {#if loadingMore}
                    <div class="py-6 text-center">
                        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                        <p class="mt-2 text-sm text-gray-600">Cargando más obras...</p>
                    </div>
                {/if}
            {/if}
        </main>
    </div>
</div>