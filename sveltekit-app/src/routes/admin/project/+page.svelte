<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { fetchProject, createProject, updateProject, fetchGroups, fetchPeople } from '$lib/services/DatabaseService';
    import type { ProjectExpanded, Grupo, Persona } from '$lib/types/alltypes';
    import MultiSelect from '$lib/components/MultiSelect.svelte';
    import { goto } from '$app/navigation';

    let projectId: string | null = null;
    let editing = false;
    let groups: Grupo[] = [];
    let people: Persona[] = [];

    // multi selects
    let selectedActores: string[] = [];
    let selectedBailarines: string[] = [];
    let selectedMusicos: string[] = [];
    let selectedCantantes: string[] = [];

    // form fields
    let titulo = '';
    let autor = '';
    let anio: number | null = null;
    let estreno: string | null = null;
    let grupo = '';
    let programaFile: File | null = null;

    $: projectId = $page.url.searchParams.get('id');
    $: editing = !!projectId;

    onMount(async () => {
        groups = await fetchGroups();
        people = await fetchPeople();
        if (editing && projectId) {
            const p = await fetchProject(projectId);
            if (p) {
                titulo = p.nombre ?? '';
                autor = (p as any).autor ?? '';
                anio = p.anio ?? null;
                estreno = p.estreno ? new Date(p.estreno).toISOString().slice(0,10) : null;
                grupo = p.expand?.grupo_id?.id ?? p.grupo_id ?? '';
                // prefill multi-selects from expanded relations (may be objects or ids)
                selectedActores = (p.expand?.elenco ?? []).map((it: any) => it?.id ?? it);
                selectedBailarines = (p.expand?.bailarines ?? []).map((it: any) => it?.id ?? it);
                selectedMusicos = (p.expand?.musicos ?? []).map((it: any) => it?.id ?? it);
                selectedCantantes = (p.expand?.cantantes ?? []).map((it: any) => it?.id ?? it);
            }
        }
    });

    function onFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) programaFile = input.files[0];
    }

    async function onSubmit(e: Event) {
        e.preventDefault();
        try {
            const form = new FormData();
            form.append('nombre', titulo);
            if (autor) form.append('autor', autor);
            if (anio) form.append('anio', String(anio));
            if (estreno) form.append('estreno', estreno);
            if (grupo) form.append('grupo_id', grupo);
            if (programaFile) form.append('programa', programaFile);
            // relations: send as comma-separated list of ids (PocketBase accepts this for relation fields)
            if (selectedActores && selectedActores.length > 0) form.append('elenco', selectedActores.join(','));
            if (selectedBailarines && selectedBailarines.length > 0) form.append('bailarines', selectedBailarines.join(','));
            if (selectedMusicos && selectedMusicos.length > 0) form.append('musicos', selectedMusicos.join(','));
            if (selectedCantantes && selectedCantantes.length > 0) form.append('cantantes', selectedCantantes.join(','));

            if (editing && projectId) {
                await updateProject(projectId, form);
                alert('Proyecto actualizado');
            } else {
                await createProject(form);
                alert('Proyecto creado');
            }
            // go back to admin list
            goto('/admin');
        } catch (err: any) {
            console.error('Error saving project', err);
            alert('Error al guardar: ' + (err?.message ?? err));
        }
    }
</script>

<form on:submit|preventDefault={onSubmit} class="p-4 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 w-full max-w-2xl mx-auto">
    Datos generales
    <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div>
            <label for="titulo" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Título</label>
            <input bind:value={titulo} type="text" id="titulo" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="La Ratonera" required />
        </div>
        <div>
            <label for="autor" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Autor (Opcional)</label>
            <input bind:value={autor} type="text" id="autor" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Agatha Christie" />
        </div>
        <div>
            <label for="anio" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Año</label>
            <input bind:value={anio} type="number" id="anio" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="2001" required />
        </div>  
        <div>
            <label for="estreno" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Fecha de Estreno (opcional)</label>
            <input bind:value={estreno} type="date" id="estreno" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="123-45-678" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" />
        </div>
        <div>
            <label for="grupo" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Producción</label>
            <select bind:value={grupo} id="grupo" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required >
                <option value="">Selecciona un grupo</option>
                {#each groups as g}
                    <option value={g.id}>{g.nombre}</option>
                {/each}
            </select>
        </div>
        <div>
            <label for="pdm" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Programa de mano</label>
            <input on:change={onFileChange} type="file" id="pdm" class="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
        </div>
    </div>
    Créditos
    <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div>
            <label for="direccion_general" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dirección General</label>
            <input type="text" id="direccion_general" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Alberto Ontiveros" required />
        </div> 
        <div>
            <label for="direccion_asistente" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Asistente de Dirección</label>
            <input type="text" id="direccion_asistente" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Alberto Ontiveros" required />
        </div> 
        <div>
            <label for="direccion_coreo" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dirección Coreográfica</label>
            <input type="text" id="direccion_coreo" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Alberto Ontiveros" required />
        </div> 
        <div>
            <label for="produccion" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Producción Ejecutiva</label>
            <input type="text" id="produccion" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Patricio Garza" required />
        </div>
    </div>
    
     
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Actores</label>
        <MultiSelect items={people} bind:selected={selectedActores} placeholder="Buscar actores..." />
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Bailarines</label>
        <MultiSelect items={people} bind:selected={selectedBailarines} placeholder="Buscar bailarines..." />
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Músicos</label>
        <MultiSelect items={people} bind:selected={selectedMusicos} placeholder="Buscar músicos..." />
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Cantantes</label>
        <MultiSelect items={people} bind:selected={selectedCantantes} placeholder="Buscar cantantes..." />
    </div>
    
    <div class="flex gap-3">
        <button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{editing ? 'Actualizar' : 'Crear'}</button>
        <button type="button" on:click={() => goto('/admin')} class="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2">Volver</button>
    </div>
</form>
