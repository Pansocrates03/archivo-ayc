
<script lang="ts">
    // IMPORTS
    import './app.css';
    import { onMount, onDestroy } from 'svelte';
    import Modal from "./lib/components/Modal.svelte";
    import ProjectDetailsModal from './lib/components/ProjectDetailsModal.svelte';
    import { ThumbnailService } from './lib/services/ThumbnailService';
    import { lazyThumbnail } from './lib/actions/lazyThumbnail';
    import type { Proyecto, Grupo, Persona } from './lib/types/alltypes';
    import Header from './lib/components/Header.svelte';
    import type { ProyectoWithThumbnail } from './lib/types/alltypes';
    import { fetchPeople, fetchPlays, fetchGroups, getProgramaUrl, getGalleryUrl, getGalleryThumbUrl } from './lib/services/DatabaseService';
    
    // Leer variable Vite; usar fallback local para desarrollo.
    const thumbnailService = new ThumbnailService();
    
    interface GroupedPlays { [year: number]: ProyectoWithThumbnail[] }
    
    
    // Variables
    let allPlays: ProyectoWithThumbnail[] = [];
    let allGroups: Grupo[] = []; // Nuevo estado para todos los grupos
    let allPeople: Persona[] = [];
    
    let filteredPlays: ProyectoWithThumbnail[] = [];
    let searchTerm = '';
    let selectedGroup: string = ''; // Nuevo estado para el grupo seleccionado
    
    let loading = true;
    let error = '';
    let showModal = false;
    let selectedPlay: ProyectoWithThumbnail | null = null;
    // Galería: paginación simple para mostrar solo una "línea" a la vez
    let galleryPage = 0;
    let galleryPageSize = 3; // se calculará responsive

    function computeGalleryPageSize(width: number) {
        // Ajusta estos breakpoints según diseño
        if (width < 640) return 2;       // móvil
        if (width < 1024) return 3;      // tablet/pequeño desktop
        if (width < 1400) return 4;      // desktop mediano
        return 5;                        // pantallas grandes
    }
    
    // Agrupar obras por año
    function groupPlaysByYear(plays: ProyectoWithThumbnail[]): GroupedPlays {
        const grouped: GroupedPlays = {};

        plays.forEach((play) => {
            if (!grouped[play.anio]) {
                grouped[play.anio] = [];
            }

            grouped[play.anio].push(play);
        });

        return grouped;
    }
    
    // Filtrar obras por búsqueda y grupo
    function filterPlays(
        plays: ProyectoWithThumbnail[],
        search: string,
        group: string
    ): ProyectoWithThumbnail[] {
        let tempPlays = plays;
    
        // Filtrar por término de búsqueda
        if (search.trim()) {
            tempPlays = tempPlays.filter((play) => play.nombre.toLowerCase().includes(search.toLowerCase()));
        }
    
        // Filtrar por grupo seleccionado
        if (group) {
            tempPlays = tempPlays.filter((play) => play.grupo_nombre === group);
        }
    
        return tempPlays;
    }
    


    
    // Manejar clic en obra
    async function handlePlayClick(play: ProyectoWithThumbnail) {
        selectedPlay = play;
        galleryPage = 0; // resetear a la primera fila al abrir modal
        showModal = true;

        // Si la miniatura no se ha generado (por lazy load), generarla para el modal
        if (!play.thumbnail && !play.thumbnailLoading) {
            play.thumbnailLoading = true;
            allPlays = [...allPlays];
            try {
                const data = await thumbnailService.generateThumbnail(getProgramaUrl(play), 640);
                play.thumbnail = data;
            } catch (err) {
                console.error('Error generando miniatura al abrir modal:', err);
            } finally {
                play.thumbnailLoading = false;
                allPlays = [...allPlays];
                // Si el modal sigue abierto y es la misma obra, refrescar selectedPlay
                if (selectedPlay && selectedPlay.id === play.id) selectedPlay = play;
            }
        }

    }
    
    function openPrograma() {
        if (selectedPlay) {
            window.open(getProgramaUrl(selectedPlay), '_blank');
        }
    }

    function openGalleryImage(url: string) {
        window.open(url, '_blank');
    }

    function getCurrentGallerySlice() {
        if (!selectedPlay || !selectedPlay.galeria) return [];
        const start = galleryPage * galleryPageSize;
        return selectedPlay.galeria.slice(start, start + galleryPageSize);
    }

    function nextGalleryPage() {
        if (!selectedPlay || !selectedPlay.galeria) return;
        const maxPage = Math.floor((selectedPlay.galeria.length - 1) / galleryPageSize);
        if (galleryPage < maxPage) galleryPage += 1;
    }

    function prevGalleryPage() {
        if (galleryPage > 0) galleryPage -= 1;
    }

    // Preload thumbnails for the next page when galleryPage or selectedPlay changes
    $: if (selectedPlay) {
        const maxPage = selectedPlay.galeria ? Math.floor((selectedPlay.galeria.length - 1) / galleryPageSize) : -1;
        const nextPage = Math.min(maxPage, galleryPage + 1);
        if (nextPage > galleryPage && selectedPlay.galeria) {
            const start = nextPage * galleryPageSize;
            const slice = selectedPlay.galeria.slice(start, start + galleryPageSize);
            // Preload each thumb
            for (const imgName of slice) {
                const img = new Image();
                img.src = getGalleryThumbUrl(selectedPlay, imgName, 320, 240, 60);
            }
        }
    }

    onMount(() => {
        // establecer tamaño inicial y listener responsive
        galleryPageSize = computeGalleryPageSize(window.innerWidth);

        const onResize = () => {
            const newSize = computeGalleryPageSize(window.innerWidth);
            if (newSize !== galleryPageSize) {
                galleryPageSize = newSize;
                // resetear página para evitar overflow
                galleryPage = 0;
            }
        };

        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    });

    onDestroy(() => {
        // en caso de que onMount no limpie por alguna razón
        try { window.removeEventListener('resize', () => {}); } catch(e) {}
    });

    function getEstrenoDate(play: ProyectoWithThumbnail): string {
        if (play.estreno) {
            const date = new Date(play.estreno);
            return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return play.anio.toString();
    }

    // Devuelve una cadena con los nombres del elenco separados por comas
    function getElencoNames(play: ProyectoWithThumbnail | null): string {
        if (!play || !play.elenco || !Array.isArray(play.elenco) || !allPeople) return 'No disponible';

        const names = play.elenco.map((pid) => {
            const person = allPeople.find(p => p.id === pid);
            return person?.nombre ?? 'Desconocido';
        });

        // Filtrar valores vacíos y unir
        const filtered = names.filter(n => n && n.trim().length > 0);
        return filtered.length ? filtered.join(', ') : 'No disponible';
    }
    
    // Reactive statements
    $: filteredPlays = filterPlays(allPlays, searchTerm, selectedGroup);
    $: groupedPlays = groupPlaysByYear(filteredPlays);
    $: sortedYears = Object.keys(groupedPlays).map(Number).sort((a, b) => b - a);
    
    // Cargar datos al montar el componente
    onMount(async () => {
        try {
            loading = true;
            error = '';
            allPlays = await fetchPlays();
            allGroups = await fetchGroups(); // Cargar todos los grupos
            allPeople = await fetchPeople();
        } catch(err) {
            error = err instanceof Error ? err.message : 'Error desconocido';
        } finally {
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Archivo de Arte y Cultura Tec</title>
    <meta name="description" content="Explora nuestra colección de obras de teatro organizadas por año" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
    <div class="mx-auto max-w-7xl rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-10">
        
      <!-- Tu header existente -->
      <Header bind:searchTerm bind:selectedGroup {allGroups} />

        <!-- Content -->
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
                        class="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
                    >
                        Reintentar
                    </button>
                </div>
            {:else if filteredPlays.length === 0}
                <div class="rounded-xl bg-gray-50 p-8 text-center">
                    <p class="text-xl text-gray-600">
                        {searchTerm || selectedGroup ? 'No se encontraron obras que coincidan con tu búsqueda o filtro de grupo' : 'No hay obras disponibles'}
                    </p>
                </div>
            {:else}
                <!-- Years and Plays -->
                {#each sortedYears as year}
                    <section class="mb-12 animate-fade-in">
                        <h2 class="relative mb-6 text-3xl font-bold text-gray-700 md:text-4xl">
                            {year}
                            <span class="absolute bottom-0 left-0 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></span>
                        </h2>
                        
                        <div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {#each groupedPlays[year] as play (play.id)}
                                <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                <article
                                    class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                                    on:click={() => handlePlayClick(play)}
                                    on:keydown={(e) => e.key === 'Enter' && handlePlayClick(play)}
                                    role="button"
                                    tabindex="0"
                                >
                                    <div class="relative overflow-hidden max-h-80">
                                        {#if play.thumbnail}
                                            <img 
                                                src={play.thumbnail} 
                                                alt={play.nombre}
                                                class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        {:else}
                                            <div use:lazyThumbnail={{
                                                generate: async () => await thumbnailService.generateThumbnail(getProgramaUrl(play), 320),
                                                onStart: () => {
                                                    play.thumbnailLoading = true;
                                                    allPlays = [...allPlays];
                                                },
                                                onLoaded: (dataUrl) => {
                                                    play.thumbnail = dataUrl;
                                                    play.thumbnailLoading = false;
                                                    allPlays = [...allPlays];
                                                },
                                                rootMargin: '300px'
                                            }} class="w-full h-80 bg-gray-200 flex items-center justify-center">
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
                                        <h3 class="mb-2 text-center text-lg font-semibold text-gray-800">
                                            {play.nombre}
                                        </h3>
                                        <div class="flex justify-center">
                                            <span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                                                {play.grupo_nombre}
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


<!-- Project details modal component -->
<ProjectDetailsModal bind:showModal={showModal} play={selectedPlay} people={allPeople} on:close={() => selectedPlay = null} />
