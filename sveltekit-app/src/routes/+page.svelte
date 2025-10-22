<script lang="ts">
    import './+page.css';
    import { onMount, onDestroy } from 'svelte';
    import Header from '$lib/components/Header.svelte';
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    import { lazyThumbnail } from '$lib/actions/lazyThumbnail';
    import type { ProyectoWithThumbnail, Persona, Grupo } from '$lib/types/alltypes';
    import { fetchPeople, fetchPlaysPage, fetchGroups, getProgramaUrl, fetchProject, fetchProjectsPreview } from '$lib/services/DatabaseService';

    const thumbnailService = new ThumbnailService();

    interface GroupedPlays { [year: number]: ProyectoWithThumbnail[] }

    let allPlays: ProyectoWithThumbnail[] = [];
    let allGroups: Grupo[] = [];
    let allPeople: Persona[] = [];
    let filteredPlays: ProyectoWithThumbnail[] = [];
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
    let galleryPage = 0;
    let galleryPageSize = 3;

    function computeGalleryPageSize(width: number) {
        if (width < 640) return 2;
        if (width < 1024) return 3;
        if (width < 1400) return 4;
        return 5;
    }

    


    function groupPlaysByYear(plays: ProyectoWithThumbnail[]): GroupedPlays {
        const grouped: GroupedPlays = {};
        plays.forEach((play) => {
            if (!grouped[play.anio]) grouped[play.anio] = [];
            grouped[play.anio].push(play);
        });
        return grouped;
    }

    function filterPlays(plays: ProyectoWithThumbnail[], search: string, group: string): ProyectoWithThumbnail[] {
        let tempPlays = plays;
        if (search.trim()) tempPlays = tempPlays.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()));
        if (group) tempPlays = tempPlays.filter((p) => p.grupo_nombre === group);
        return tempPlays;
    }

    async function handlePlayClick(play: ProyectoWithThumbnail) {
        // Navigate to details page
        console.log('Navigating to play:', play);
        window.location.href = `/proyecto/${play.id}`;
    }

    $: filteredPlays = filterPlays(allPlays, searchTerm, selectedGroup);
    $: groupedPlays = groupPlaysByYear(filteredPlays);
    $: sortedYears = Object.keys(groupedPlays).map(Number).sort((a, b) => b - a);

    async function loadPage(p: number) {
        try {
                console.log('[pagination] loadPage start', p);
            loadingMore = true;
            const res = await fetchPlaysPage(p, perPage);
            if (p === 1) {
                allPlays = res.items;
            } else {
                allPlays = [...allPlays, ...res.items];
            }
            totalItems = res.totalItems;
            hasMore = allPlays.length < totalItems;
        } catch (err) {
            console.error('Error cargando página de obras:', err);
            if (!error) error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loadingMore = false;
            console.log('[pagination] loadPage done', p, 'hasMore=', hasMore);
        }
    }

    onMount(async () => {
        loading = true;
        try {
            error = '';
            page = 1;
            await loadPage(page);
            allGroups = await fetchGroups();
            allPeople = await fetchPeople();

            fetchProjectsPreview(1);

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
                    window.addEventListener('scroll', scrollHandler);
                    // ensure we remove it on destroy (assign function to top-level var)
                    removeScroll = () => window.removeEventListener('scroll', scrollHandler);
                }
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loading = false;
        }
    });

    onDestroy(() => {
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
                            {#each groupedPlays[year] as play (play.id)}
                                <article class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2" on:click={() => handlePlayClick(play)} role="button" tabindex="0">
                                    <div class="relative overflow-hidden max-h-80">
                                        {#if play.thumbnail}
                                            <img src={play.thumbnail} alt={play.nombre} class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" />
                                        {:else}
                                            <div
                                                use:lazyThumbnail={{
                                                    generate: async () => await thumbnailService.generateThumbnail(getProgramaUrl(play), 320),
                                                    onStart: () => { play.thumbnailLoading = true; allPlays = [...allPlays]; },
                                                    onLoaded: (dataUrl) => { play.thumbnail = dataUrl; play.thumbnailLoading = false; allPlays = [...allPlays]; },
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
                                            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">{play.grupo_nombre}</span>
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

