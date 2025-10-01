<script lang="ts">
    import Modal from './Modal.svelte';
    import type { ProyectoWithThumbnail, Persona } from '../types/alltypes';
    import { createEventDispatcher } from 'svelte';
    import { getGalleryUrl, getGalleryThumbUrl, getProgramaUrl } from '../services/DatabaseService';

    export let showModal: boolean;
    export let play: ProyectoWithThumbnail | null = null;
    export let people: Persona[] = [];

    const dispatch = createEventDispatcher();

    // Gallery local state
    let galleryPage = 0;
    let galleryPageSize = 3;

    function computeGalleryPageSize(width: number) {
        if (width < 640) return 2;
        if (width < 1024) return 3;
        if (width < 1400) return 4;
        return 5;
    }

    function close() {
        showModal = false;
        dispatch('close');
    }

    function getElencoNames(play: ProyectoWithThumbnail | null): string {
        if (!play || !play.elenco || !Array.isArray(play.elenco) || !people) return 'No disponible';
        const names = play.elenco.map((pid) => {
            const person = people.find(p => p.id === pid);
            return person?.nombre ?? 'Desconocido';
        });
        const filtered = names.filter(n => n && n.trim().length > 0);
        return filtered.length ? filtered.join(', ') : 'No disponible';
    }

    function openPrograma() {
        if (play) window.open(getProgramaUrl(play), '_blank');
    }

    function openGalleryImage(url: string) {
        window.open(url, '_blank');
    }

    function getCurrentGallerySlice() {
        if (!play || !play.galeria) return [];
        const start = galleryPage * galleryPageSize;
        return play.galeria.slice(start, start + galleryPageSize);
    }

    function nextGalleryPage() {
        if (!play || !play.galeria) return;
        const maxPage = Math.floor((play.galeria.length - 1) / galleryPageSize);
        galleryPage = Math.min(maxPage, galleryPage + 1);
    }

    function prevGalleryPage() {
        galleryPage = Math.max(0, galleryPage - 1);
    }

    // Reactive derived values for rendering
    $: totalPages = play && play.galeria ? Math.max(1, Math.ceil(play.galeria.length / galleryPageSize)) : 0;
    $: currentGallerySlice = (play && play.galeria) ? play.galeria.slice(galleryPage * galleryPageSize, (galleryPage + 1) * galleryPageSize) : [];

    // Track loaded thumbnails to show a loading animation until each image is ready
    let loadedImages = new Set<string>();
    function markLoaded(name: string) {
        loadedImages.add(name);
        // reassign to trigger reactivity
        loadedImages = new Set(loadedImages);
    }

    // Reset loaded images when a new play is opened
    $: if (play) {
        loadedImages = new Set();
    }

    // Keep only loaded images that belong to current page or next page (preloaded)
    $: if (currentGallerySlice) {
        const keep = new Set(currentGallerySlice);
        // also keep next page slice if available
        if (play && play.galeria) {
            const nextStart = (galleryPage + 1) * galleryPageSize;
            const nextSlice = play.galeria.slice(nextStart, nextStart + galleryPageSize);
            for (const n of nextSlice) keep.add(n);
        }
        const newSet = new Set<string>();
        for (const v of loadedImages) if (keep.has(v)) newSet.add(v);
        loadedImages = newSet;
    }

    $: if (play) {
        const maxPage = play.galeria ? Math.floor((play.galeria.length - 1) / galleryPageSize) : -1;
        const nextPage = Math.min(maxPage, galleryPage + 1);
        if (nextPage > galleryPage && play.galeria) {
            const start = nextPage * galleryPageSize;
            const slice = play.galeria.slice(start, start + galleryPageSize);
            for (const imgName of slice) {
                const img = new Image();
                img.onload = () => markLoaded(imgName);
                img.onerror = () => markLoaded(imgName);
                img.src = getGalleryThumbUrl(play, imgName, 320, 240, 60);
            }
        }
    }

    // responsive sizing
    import { onMount, onDestroy } from 'svelte';
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
        return () => window.removeEventListener('resize', onResize);
    });

</script>

<Modal
    bind:showModal={showModal}
    onopen={console.log("open")}
    onclose={close}
    header={play ? play.nombre : 'Detalles de la obra'}>
    {#if play}
        <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/2 w-full">
                <button on:click={openPrograma} class="block w-full">
                    {#if play.thumbnail}
                        <img src={play.thumbnail} alt={play.nombre} class="w-full max-w-sm mx-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer" />
                        <p class="text-sm text-gray-500 text-center mt-2">Clic para abrir PDF completo</p>
                    {:else}
                        <div class="w-full max-w-sm h-80 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                            <span class="text-gray-500">Vista previa no disponible</span>
                        </div>
                    {/if}
                </button>
            </div>

            <div class="md:w-1/2 w-full flex flex-col justify-center">
                <div class="space-y-4">
                    <div>
                        <strong class="text-gray-800">Grupo:</strong>
                        <span class="text-gray-600 ml-2">{play.grupo_nombre}</span>
                    </div>
                    <div>
                        <strong class="text-gray-800">Estreno:</strong>
                        <span class="text-gray-600 ml-2">{new Date(play.estreno).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div>
                        <strong class="text-gray-800">Elenco:</strong>
                        <p class="text-gray-600 mt-2 leading-relaxed">{getElencoNames(play)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <strong class="text-gray-800">Galería:</strong>
            {#if play && play.galeria && play.galeria.length > 0}
                    <div class="mt-3 flex items-center gap-3">
                    <button type="button" on:click={prevGalleryPage} class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-40" disabled={galleryPage === 0}>◀</button>

                    <div class="grid grid-cols-3 md:grid-cols-5 gap-3 flex-1">
                            {#each currentGallerySlice as imgName (imgName)}
                            <button type="button" on:click={() => openGalleryImage(getGalleryUrl(play, imgName))} class="overflow-hidden rounded-lg relative">
                                <img src={getGalleryThumbUrl(play, imgName, 80, 60, 5)} alt={play.nombre + ' - imagen'} loading="lazy" class="w-full h-24 object-cover transition-transform duration-200 hover:scale-105" on:load={() => markLoaded(imgName)} on:error={() => markLoaded(imgName)} />
                                {#if !loadedImages.has(imgName)}
                                    <div class="absolute inset-0 flex items-center justify-center bg-white/60">
                                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-gray-700"></div>
                                    </div>
                                {/if}
                            </button>
                        {/each}
                    </div>

                    <button type="button" on:click={nextGalleryPage} class="px-3 py-2 rounded-md bg-gray-100 text-gray-700 disabled:opacity-40" disabled={play ? (galleryPage >= Math.floor((play.galeria.length - 1) / galleryPageSize)) : true}>▶</button>
                </div>
                <div class="text-sm text-gray-500 mt-2">Página {galleryPage + 1} de {totalPages}</div>
            {:else}
                <p class="text-gray-600 mt-2">No hay fotos disponibles.</p>
            {/if}
        </div>
    {:else}
        <div class="w-full flex items-center justify-center py-12">
            <p class="text-gray-600">Selecciona una obra para ver los detalles.</p>
        </div>
    {/if}
</Modal>