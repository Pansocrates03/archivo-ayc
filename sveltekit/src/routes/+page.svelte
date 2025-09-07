
<script lang="ts">
    import { onMount } from 'svelte';
    import PocketBase from 'pocketbase';
    import Modal from '$lib/components/Modal.svelte';
    import { ThumbnailService } from '$lib/services/ThumbnailService';
    
    import type { Proyecto } from '$lib/types/alltypes';

    const pb = new PocketBase('http://127.0.0.1:8090');
    const thumbnailService = new ThumbnailService();

    interface Grupo {
        id: string;
        nombre: string;
    }

    interface GroupedPlays {
        [year: number]: Proyecto[];
    }

    interface ProyectoWithThumbnail extends Proyecto {
        thumbnail?: string;
        thumbnailLoading?: boolean;
    }

    let allPlays: ProyectoWithThumbnail[] = [];
    let filteredPlays: ProyectoWithThumbnail[] = [];
    let searchTerm = '';
    let selectedGroup: string = ''; // Nuevo estado para el grupo seleccionado
    let allGroups: Grupo[] = []; // Nuevo estado para todos los grupos
    let loading = true;
    let error = '';
    let showModal = false;
    let selectedPlay: ProyectoWithThumbnail | null = null;

    // Función para cargar obras desde PocketBase
    async function fetchPlays(): Promise<ProyectoWithThumbnail[]> {
        try {
            const proyectos: Proyecto[] = await pb.collection('vista_proyecto_grupo').getFullList({
                sort: '-anio',
            });
            
            // Agregar propiedades para thumbnails
            return proyectos.map(proyecto => ({
                ...proyecto,
                thumbnail: undefined,
                thumbnailLoading: false
            }));
            
        } catch (err) {
            throw new Error('Error al cargar las obras');
        }
    }

    // Nueva función para cargar grupos
    async function fetchGroups(): Promise<Grupo[]> {
        try {
            return await pb.collection('grupos').getFullList({
                sort: 'nombre',
            });
        } catch (err) {
            console.error('Error al cargar los grupos:', err);
            return [];
        }
    }

    // Generar miniaturas para todas las obras
    async function generateAllThumbnails() {
        const promises = allPlays.map(async (play, index) => {
            try {
                allPlays[index].thumbnailLoading = true;
                const thumbnail = await thumbnailService.generateThumbnail(
                    getProgramaUrl(play), 
                    320
                );
                allPlays[index].thumbnail = thumbnail;
                allPlays[index].thumbnailLoading = false;
                
                // Forzar reactualización
                allPlays = [...allPlays];
            } catch (error) {
                console.error(`Error generando miniatura para ${play.nombre}:`, error);
                allPlays[index].thumbnailLoading = false;
                allPlays = [...allPlays];
            }
        });

        // Procesar en lotes de 3 para no sobrecargar
        for (let i = 0; i < promises.length; i += 3) {
            const batch = promises.slice(i, i + 3);
            await Promise.all(batch);
            // Pequeña pausa entre lotes
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

	// Agrupar obras por año
	function groupPlaysByYear(plays: Proyecto[]): GroupedPlays {
		const grouped: GroupedPlays = {};
		plays.forEach(play => {
			if (!grouped[play.anio]) {
				grouped[play.anio] = [];
			}
			grouped[play.anio].push(play);
		});
		return grouped;
	}

	// Filtrar obras por búsqueda y grupo
	function filterPlays(plays: Proyecto[], search: string, group: string): Proyecto[] {
		let tempPlays = plays;

		// Filtrar por término de búsqueda
		if (search.trim()) {
			tempPlays = tempPlays.filter(play => 
				play.nombre.toLowerCase().includes(search.toLowerCase())
			);
		}

		// Filtrar por grupo seleccionado
		if (group) {
			tempPlays = tempPlays.filter(play => play.grupo_nombre === group);
		}

		return tempPlays;
	}

	function getProgramaUrl(play: Proyecto): string {
		return pb.files.getURL(play, play.programa);
	}

	// Manejar clic en obra
	async function handlePlayClick(play: Proyecto) {
		selectedPlay = play;
		showModal = true;
	}

	function openPrograma() {
		if (selectedPlay) {
			window.open(getProgramaUrl(selectedPlay), '_blank');
		}
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
			generateAllThumbnails();
		} catch (err) {
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
        <header class="mb-8 text-center">
            <h1 class="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
                🎭 Archivo de Arte y Cultura Tec
            </h1>
            
            <div class="mx-auto max-w-md space-y-4">
                <div class="relative">
                    <input
                        type="text"
                        placeholder="Buscar obra por nombre..."
                        bind:value={searchTerm}
                        class="w-full rounded-full border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:-translate-y-1"
                    />
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                </div>
                <!-- Nuevo filtro por grupo -->
                <div class="relative">
                    <select
                        bind:value={selectedGroup}
                        class="w-full rounded-full border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:-translate-y-1 appearance-none pr-10"
                    >
                        <option value="">Filtrar por grupo</option>
                        {#each allGroups as group (group.id)}
                            <option value={group.nombre}>{group.nombre}</option>
                        {/each}
                    </select>
                    <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
                </div>
            </div>
        </header>

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
                                        {:else if play.thumbnailLoading}
                                            <div class="w-full h-80 bg-gray-200 flex items-center justify-center">
                                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                            </div>
                                        {:else}
                                            <div class="w-full h-80 bg-gray-200 flex items-center justify-center">
                                                <span class="text-gray-500">Sin miniatura</span>
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


<!-- 4. Modal ultra simple -->
<Modal
    bind:showModal
    header={selectedPlay ? selectedPlay.nombre : 'Detalles de la obra'}
>
    {#if selectedPlay}
        <div class="flex flex-col md:flex-row gap-6">
            <!-- Imagen PNG a la izquierda -->
            <div class="md:w-1/2 w-full">
                <button on:click={openPrograma} class="block w-full">
                    {#if selectedPlay.thumbnail}
                        <img 
                            src={selectedPlay.thumbnail} 
                            alt={selectedPlay.nombre}
                            class="w-full max-w-sm mx-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                        />
                        <p class="text-sm text-gray-500 text-center mt-2">Clic para abrir PDF completo</p>
                    {:else}
                        <div class="w-full max-w-sm h-80 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                            <span class="text-gray-500">Vista previa no disponible</span>
                        </div>
                    {/if}
                </button>
            </div>
            
            <!-- Info a la derecha -->
            <div class="md:w-1/2 w-full flex flex-col justify-center">
                <div class="space-y-4">
                    <div>
                        <strong class="text-gray-800">Grupo:</strong>
                        <span class="text-gray-600 ml-2">{selectedPlay.grupo_nombre}</span>
                    </div>
                    <div>
                        <strong class="text-gray-800">Año:</strong>
                        <span class="text-gray-600 ml-2">{selectedPlay.anio}</span>
                    </div>
                    <div>
                        <strong class="text-gray-800">Descripción:</strong>
                        <p class="text-gray-600 mt-2 leading-relaxed">
                            {selectedPlay.sinopsis || 'No disponible'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <div class="w-full flex items-center justify-center py-12">
            <p class="text-gray-600">Selecciona una obra para ver los detalles.</p>
        </div>
    {/if}
</Modal>