<script lang="ts">
    import { onMount } from 'svelte';
    import { projectsPreviewStore } from "$lib/stores/projectPereviewStore";
    import { fetchGroups } from '$lib/services/DatabaseService';
    import { goto } from '$app/navigation';
    import type { ProjectPreview, Grupo } from "$lib/types/alltypes";

    // reactive store
    $: store = $projectsPreviewStore;
    $: allProjects = store.items;

    let groups: Grupo[] = [];
    let search = '';
    let selectedGroup = '';

    onMount(async () => {
        groups = await fetchGroups();
        // ensure first page loaded
        projectsPreviewStore.loadPage(1);
    });

    function onCreate() {
        goto('/admin/project');
    }

    function onEdit(id: string) {
        goto(`/admin/project?id=${id}`);
    }

    function onSearchChange() {
        projectsPreviewStore.setSearch(search);
    }

    function onGroupChange() {
        projectsPreviewStore.setGroup(selectedGroup);
    }
</script>

<div class="p-6">
    <div class="flex items-center justify-between mb-6">
        <div>
            <h1 class="text-2xl font-bold">Admin Dashboard</h1>
            <p class="text-sm text-gray-600">Gestiona obras: crear, filtrar y editar.</p>
        </div>
        <div class="flex gap-3">
            <button on:click={onCreate} class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Crear obra</button>
        </div>
    </div>

    <div class="flex gap-3 mb-4">
        <input type="text" placeholder="Buscar por nombre..." bind:value={search} on:input={onSearchChange} class="px-3 py-2 border rounded-md w-72" />
        <select bind:value={selectedGroup} on:change={onGroupChange} class="px-3 py-2 border rounded-md">
            <option value="">Todos los grupos</option>
            {#each groups as g}
                <option value={g.id}>{g.nombre}</option>
            {/each}
        </select>
    </div>

    <div class="relative overflow-x-auto bg-white rounded-lg shadow">
        <table class="w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th class="px-6 py-3">Nombre</th>
                    <th class="px-6 py-3">Año</th>
                    <th class="px-6 py-3">Producción</th>
                    <th class="px-6 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {#each allProjects as project}
                    <tr class="border-b hover:bg-gray-50">
                        <td class="px-6 py-4 font-medium text-gray-900">{project.nombre}</td>
                        <td class="px-6 py-4">{project.anio}</td>
                        <td class="px-6 py-4">{project.grupo_id}</td>
                        <td class="px-6 py-4">
                            <button on:click={() => onEdit(project.id)} class="mr-2 px-3 py-1 bg-yellow-400 text-sm rounded">Editar</button>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
