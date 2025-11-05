<script lang="ts">
	// 1. Eliminamos 'createEventDispatcher' y 'onMount' que ya no son necesarios
	export let items: { id: string; nombre: string }[] = [];
	export let placeholder = 'Buscar...';
	export let disabled = false;
	// bind:selected se encargará de la comunicación con el padre
	export let selected: string[] = [];

	let query = '';
	let open = false;
	let highlighted = -1;
	let inputEl: HTMLInputElement | null = null;
	let wrapperEl: HTMLDivElement; // <--- Para detectar clics fuera

	// Reactive statements para eficiencia
	$: filtered = query.trim()
		? items.filter((i) => i.nombre.toLowerCase().includes(query.toLowerCase()))
		: items;

	// Un array con los objetos seleccionados, más eficiente que buscar en el HTML
	$: selectedItems = selected
		.map((id) => items.find((i) => i.id === id))
		.filter(Boolean) as { id: string; nombre: string }[];

	// 3. Lógica movida fuera de onMount
	$: if (!open) highlighted = -1;

	function toggle(id: string) {
		if (selected.includes(id)) {
			selected = selected.filter((x) => x !== id);
		} else {
			selected = [...selected, id];
		}
		// 3. 'dispatch' eliminado. bind:selected se encarga de actualizar al padre.
		
		// 2. Limpiamos el input después de seleccionar con clic
		query = '';
		inputEl?.focus(); // Mantenemos el foco para seguir seleccionando
	}

	function remove(id: string) {
		selected = selected.filter((x) => x !== id);
		// 3. 'dispatch' eliminado.
		inputEl?.focus(); // Devolvemos el foco al input
	}

	// 1. Función para cerrar el dropdown si se hace clic fuera
	function handleFocusOut(e: FocusEvent) {
		// Si el nuevo elemento enfocado NO está dentro de nuestro componente, cerramos.
		// El 'relatedTarget' es el elemento que RECIBE el foco.
		if (e.relatedTarget === null || !wrapperEl.contains(e.relatedTarget as Node)) {
			open = false;
		}
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			highlighted = Math.min(highlighted + 1, filtered.length - 1);
			e.preventDefault();
			open = true;
		} else if (e.key === 'ArrowUp') {
			highlighted = Math.max(highlighted - 1, 0);
			e.preventDefault();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (open && highlighted >= 0 && filtered[highlighted]) {
				toggle(filtered[highlighted].id);
				// 2. 'query = '' ' eliminado de aquí, porque toggle() ya lo hace.
			}
		} else if (e.key === 'Escape') {
			open = false;
		}
	}
</script>

<!-- 1. Añadimos bind:this y on:focusout al div principal -->
<div class="relative" bind:this={wrapperEl} on:focusout={handleFocusOut}>
	<div class="flex items-center flex-wrap gap-2 p-2 border rounded-md bg-white">
		<!-- Usamos selectedItems para ser más eficientes -->
		{#each selectedItems as sel (sel.id)}
			<span
				class="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm"
			>
				<span>{sel.nombre}</span>
				<button
					type="button"
					on:click={() => remove(sel.id)}
					class="text-indigo-600 hover:text-indigo-900 focus:outline-none"
				>
					&times;
				</button>
			</span>
		{/each}

		<input
			bind:this={inputEl}
			class="flex-1 min-w-[120px] outline-none p-1 text-sm"
			placeholder={selected.length > 0 ? '' : placeholder}
			bind:value={query}
			on:input={() => {
				open = true;
				highlighted = 0;
			}}
			on:focus={() => (open = true)}
			on:keydown={onKeyDown}
			{disabled}
		/>
	</div>

	{#if open}
		<ul class="absolute z-50 mt-1 w-full bg-white border rounded-md max-h-48 overflow-auto shadow-lg">
			{#if filtered.length === 0}
				<li class="px-3 py-2 text-sm text-gray-500">No se encontraron personas</li>
			{/if}
			{#each filtered as it, idx (it.id)}
				<li
					class={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 ${
						highlighted === idx ? 'bg-gray-100' : ''
					}`}
					on:mousedown|preventDefault={() => {
						toggle(it.id);
					}}
					on:mouseenter={() => (highlighted = idx)}
				>
					<div class="flex items-center gap-3">
						<input
							type="checkbox"
							readonly
							class="w-4 h-4 pointer-events-none"
							checked={selected.includes(it.id)}
						/>
						<span class="text-sm">{it.nombre}</span>
					</div>
					{#if selected.includes(it.id)}
						<svg
							class="w-4 h-4 text-green-600"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="3"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	/* small tweak to ensure dropdown renders over other content */
	:global(.svelte-multiselect) {
		z-index: 50;
	}
</style>