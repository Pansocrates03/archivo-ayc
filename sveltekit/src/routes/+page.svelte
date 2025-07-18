<script lang="ts">
	import { onMount } from 'svelte';
    import PocketBase from 'pocketbase';
	import PdfPoster from '../lib/components/PdfPoster.svelte';

	import PdfViewer from 'svelte-pdf';

    import type { Proyecto } from '$lib/types/alltypes';
    import { get } from 'svelte/store';

    const pb = new PocketBase('http://127.0.0.1:8090');

	interface GroupedPlays {
		[year: number]: Proyecto[];
	}

	let allPlays: Proyecto[] = [];
	let filteredPlays: Proyecto[] = [];
	let searchTerm = '';
	let loading = true;
	let error = '';

	// Función para cargar obras desde PocketBase
	async function fetchPlays(): Promise<Proyecto[]> {
		try {

			const proyectos: Proyecto[] = await pb.collection('vista_proyecto_grupo').getFullList({
				 sort: '-anio',
			});
			console.log('Proyectos cargados:', proyectos);


			return proyectos;
			
			//return mockPlays;
		} catch (err) {
			throw new Error('Error al cargar las obras');
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

	// Filtrar obras por búsqueda
	function filterPlays(plays: Proyecto[], search: string): Proyecto[] {
		if (!search.trim()) {
			return plays;
		}
		return plays.filter(play => 
			play.nombre.toLowerCase().includes(search.toLowerCase())
		);
	}

	function getProgramaUrl(play: Proyecto): string {
		if (play.programa) {
			try {
				const url = pb.files.getURL(play, play.programa, { thumb: '100x250' });
				console.log('URL del programa:', url);
				return url;
			} catch (e) {
				console.error('Error obteniendo URL del programa:', e);
			}
		}
		return 'https://via.placeholder.com/400x600?text=No+Image';
	}

	// Manejar clic en obra
	function handlePlayClick(play: Proyecto) {
		window.open(getProgramaUrl(play), '_blank');
		// Aquí puedes navegar a una página de detalles o abrir un modal
		//alert(`Detalles de la obra: ${play.nombre}\n\nEsta funcionalidad se puede expandir para mostrar más información.`);
	}

	// Reactive statements
	$: filteredPlays = filterPlays(allPlays, searchTerm);
	$: groupedPlays = groupPlaysByYear(filteredPlays);
	$: sortedYears = Object.keys(groupedPlays).map(Number).sort((a, b) => b - a);

	// Cargar datos al montar el componente
	onMount(async () => {
		try {
			loading = true;
			error = '';
			allPlays = await fetchPlays();
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
	<div class="mx-auto max-w-6xl rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-sm md:p-10">
		<!-- Header -->
		<header class="mb-8 text-center">
			<h1 class="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
				🎭 Archivo de Arte y Cultura Tec
			</h1>
			
			<!-- Search Box -->
			<div class="mx-auto max-w-md">
				<div class="relative">
					<input
						type="text"
						placeholder="Buscar obra por nombre..."
						bind:value={searchTerm}
						class="w-full rounded-full border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:-translate-y-1"
					/>
					<span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
						🔍
					</span>
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
						{searchTerm ? 'No se encontraron obras que coincidan con tu búsqueda' : 'No hay obras disponibles'}
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
						
						<div class="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
							{#each groupedPlays[year] as play (play.id)}
								<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
								<article
									class="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
									on:click={() => handlePlayClick(play)}
									on:keydown={(e) => e.key === 'Enter' && handlePlayClick(play)}
									role="button"
									tabindex="0"
								>
									<div class="relative overflow-hidden max-h-80 ">
										<PdfPoster
											showTopButton={false}
											showBorder={false}
											scale={0.5}
											url={getProgramaUrl(play)} />
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
		animation: fade-in 0.6s ease-out;
	}
</style>