<script lang="ts">
    import { onMount } from 'svelte';
    import { projectsPreviewStore } from "$lib/stores/projectPereviewStore";
    import { fetchGroups, fetchPeople, createPersona, updatePersona, deletePersona, countProjectsForPersona } from '$lib/services/DatabaseService';
    import type { Persona } from '$lib/types/alltypes';
    import { goto } from '$app/navigation';
    import type { ProjectPreview, Grupo } from "$lib/types/alltypes";

    // reactive store
    $: store = $projectsPreviewStore;
    $: allProjects = store.items;

    let groups: Grupo[] = [];
    let search = '';
    let selectedGroup = '';
    let people: Persona[] = [];
    let newPersonName = '';
    let creatingPerson = false;
    // UI state for editing/deleting
    let editingId: string | null = null;
    let editName = '';
    let deletingId: string | null = null;

    // Lista filtrada de personas usando newPersonName como filtro
    $: filteredPeople = newPersonName
        ? people.filter(p => p.nombre.toLowerCase().includes(newPersonName.toLowerCase()))
        : people;
    // Map personaId -> projects count
    let projectsCount: Record<string, number> = {};

    onMount(async () => {
        groups = await fetchGroups();
        people = await fetchPeople();
        // Preload project counts (parallel)
        await Promise.all(people.map(async (p) => {
            try {
                const cnt = await countProjectsForPersona(p.id);
                projectsCount[p.id] = cnt;
            } catch (e) {
                projectsCount[p.id] = 0;
            }
        }));
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

    async function onCreatePerson() {
        if (!newPersonName || newPersonName.trim().length === 0) return;
        creatingPerson = true;
        try {
            const created = await createPersona({ nombre: newPersonName.trim() });
            // Añadir al inicio de la lista para visible inmediato
            people = [created, ...people];
            // fetch count for created person
            projectsCount[created.id] = await countProjectsForPersona(created.id);
            newPersonName = '';
        } catch (err) {
            console.error('Error creando persona:', err);
            // podríamos mostrar un toast aquí
        } finally {
            creatingPerson = false;
        }
    }

    function startEdit(p: Persona) {
        editingId = p.id;
        editName = p.nombre;
    }

    function cancelEdit() {
        editingId = null;
        editName = '';
    }

    async function saveEdit(p: Persona) {
        if (!editName || editName.trim().length === 0) return;
        try {
            const updated = await updatePersona(p.id, { nombre: editName.trim() });
            // replace in people
            people = people.map(pp => pp.id === p.id ? { ...pp, ...updated } : pp);
            editingId = null;
            editName = '';
        } catch (err) {
            console.error('Error actualizando persona:', err);
        }
    }

    async function confirmDelete(p: Persona) {
        const ok = window.confirm(`Eliminar persona "${p.nombre}"? Esta acción no se puede deshacer.`);
        if (!ok) return;
        deletingId = p.id;
        try {
            await deletePersona(p.id);
            // remove locally
            people = people.filter(pp => pp.id !== p.id);
            delete projectsCount[p.id];
        } catch (err) {
            console.error('Error eliminando persona:', err);
        } finally {
            deletingId = null;
        }
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="relative overflow-x-auto bg-white rounded-lg shadow col-span-2">
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

        <!-- Personas panel -->
        <aside class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-semibold mb-3">Personas</h2>

            <div class="relative mb-3">
                <form class="flex gap-2">
                    <div class="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="Buscar o crear persona..." 
                            bind:value={newPersonName} 
                            class="w-full px-3 py-2 pl-9 border rounded-md"
                        />
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <button 
                        on:click={onCreatePerson} 
                        type="submit"
                        class="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50" 
                        disabled={creatingPerson || !newPersonName.trim() || filteredPeople.some(p => p.nombre.toLowerCase() === newPersonName.trim().toLowerCase())}
                    >
                        {#if creatingPerson}
                            Creando...
                        {:else if filteredPeople.some(p => p.nombre.toLowerCase() === newPersonName.trim().toLowerCase())}
                            Existe
                        {:else}
                            Crear
                        {/if}
                    </button>
                </form>
            </div>

            <div class="max-h-96 overflow-auto">
                {#if people.length === 0}
                    <p class="text-sm text-gray-500">No hay personas aún</p>
                {:else if filteredPeople.length === 0}
                    <p class="text-sm text-gray-500">No se encontraron personas que coincidan con la búsqueda</p>
                {:else}
                    <ul class="space-y-2">
                        {#each filteredPeople as p}
                            <li class="flex items-center justify-between p-2 border rounded">
                                <div class="flex-1">
                                    {#if editingId === p.id}
                                        <div class="flex gap-2">
                                            <input class="px-2 py-1 border rounded flex-1" bind:value={editName} />
                                            <button on:click={() => saveEdit(p)} class="px-2 py-1 bg-blue-600 text-white rounded">Guardar</button>
                                            <button on:click={cancelEdit} class="px-2 py-1 border rounded">Cancelar</button>
                                        </div>
                                    {:else}
                                        <div class="font-medium">{p.nombre}</div>
                                        <div class="text-xs text-gray-500">{p.id}</div>
                                    {/if}
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="text-sm text-gray-600">{projectsCount[p.id] ?? 0} obras</div>
                                    {#if editingId !== p.id}
                                        <button on:click={() => startEdit(p)} class="px-2 py-1 bg-yellow-400 rounded text-sm">Editar</button>
                                        <button on:click={() => confirmDelete(p)} class="px-2 py-1 bg-red-500 text-white rounded text-sm" disabled={deletingId === p.id}>
                                            {#if deletingId === p.id}Eliminando...{:else}Eliminar{/if}
                                        </button>
                                    {/if}
                                </div>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        </aside>
    </div>
</div>
