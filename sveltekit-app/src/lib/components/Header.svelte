<script lang="ts">
    import type { Grupo } from '$lib/types/alltypes';

    export let searchTerm: string = '';
    export let selectedGroup: string = '';
    export let allGroups: Grupo[] = [];

    let prepa: Grupo[] = [];
    let arte: Grupo[] = [];
    let otros: Grupo[] = [];

    $: prepa = allGroups.filter(g => g.presentadopor === 'Prepa Tec');
    $: arte = allGroups.filter(g => g.presentadopor === 'Arte y Cultura');
    $: otros = allGroups.filter(g => g.presentadopor && g.presentadopor !== 'Prepa Tec' && g.presentadopor !== 'Arte y Cultura');
</script>

<header class="mb-8 text-center">
    <h1 class="mb-6 text-4xl font-bold text-gray-800 md:text-5xl">
        🎭 Archivo de Arte y Cultura Tec
    </h1>
    <div class="mx-auto max-w-3xl flex flex-col md:flex-row items-center gap-4">
        <div class="relative flex-1">
            <input type="text" placeholder="Buscar obra por nombre..." bind:value={searchTerm} class="block w-full rounded-full border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:-translate-y-1" />
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
        <div class="relative flex-1">
            <select bind:value={selectedGroup} class="block w-full rounded-full border-2 border-gray-200 bg-white px-6 py-4 text-lg shadow-lg transition-all duration-300 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:-translate-y-1 appearance-none pr-10">
                <option value="">Filtrar por grupo</option>
                {#if allGroups && allGroups.length}
                    {#if prepa.length}
                        <optgroup label="Prepa Tec">
                            {#each prepa as group (group.id)}
                                <option value={group.nombre}>{group.nombre}</option>
                            {/each}
                        </optgroup>
                    {/if}
                    {#if arte.length}
                        <optgroup label="Arte y Cultura">
                            {#each arte as group (group.id)}
                                <option value={group.nombre}>{group.nombre}</option>
                            {/each}
                        </optgroup>
                    {/if}
                    {#if otros.length}
                        <optgroup label="Otros">
                            {#each otros as group (group.id)}
                                <option value={group.nombre}>{group.nombre} — {group.presentadopor}</option>
                            {/each}
                        </optgroup>
                    {/if}
                {/if}
            </select>
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
        </div>
    </div>
</header>

