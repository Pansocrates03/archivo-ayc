<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { fetchProject, createProject, updateProject, fetchGroups, fetchPeople, getGalleryThumbUrl } from '$lib/services/DatabaseService';
    import type { ProjectExpanded, Grupo, Persona } from '$lib/types/alltypes';
    import MultiSelect from '$lib/components/MultiSelect.svelte';
    import { goto } from '$app/navigation';
    import { compressIfNeeded } from './compressIfNeeded';

    let projectId: string | null = null;
    let editing = false;
    let groups: Grupo[] = [];
    let people: Persona[] = [];

    // multi selects
    let selectedActores: string[] = [];
    let selectedBailarines: string[] = [];
    let selectedMusicos: string[] = [];
    let selectedCantantes: string[] = [];
    let selectedStaff: string[] = [];
    
    // single selects (kept as arrays internally for binding; we'll send as single values when required)
    let selectedDireccionGeneral: string[] = [];
    let selectedDireccionAsistente: string[] = [];
    let selectedDireccionCoreografico: string[] = [];
    let selectedProduccionEjecutiva: string[] = [];

    // form fields
    let titulo = '';
    let selectedAutor: string[] = [];
    let anio: number | null = null;
    let estreno: string | null = null;
    let grupo = '';
    let programaFile: File | null = null;
    let galeriaFiles: File[] = [];
    let project: ProjectExpanded | null = null;
    let existingGallery: string[] = [];
    let removedGallery: string[] = [];
    let isCompressing = false;

    $: projectId = $page.url.searchParams.get('id');
    $: editing = !!projectId;

    onMount(async () => {
        groups = await fetchGroups();
        people = await fetchPeople();
        if (editing && projectId) {
            const p = await fetchProject(projectId);
            if (p) {
                titulo = p.nombre ?? '';
                selectedAutor = (p as any).autor ? [(p as any).autor] : [];
                anio = p.anio ?? null;
                estreno = p.estreno ? new Date(p.estreno).toISOString().slice(0,10) : null;
                grupo = p.expand?.grupo_id?.id ?? '';
                // prefill multi-selects from expanded relations (may be objects or ids)
                selectedActores = (p.expand?.elenco ?? []).map((it: any) => it?.id ?? it);
                selectedBailarines = (p.expand?.bailarines ?? []).map((it: any) => it?.id ?? it);
                selectedMusicos = (p.expand?.musicos ?? []).map((it: any) => it?.id ?? it);
                selectedCantantes = (p.expand?.cantantes ?? []).map((it: any) => it?.id ?? it);
                selectedStaff = (p.expand?.staff ?? []).map((it: any) => it?.id ?? it);
                
                // Prefill single-select fields as arrays of ids (keep consistent with MultiSelect binding)
                selectedDireccionGeneral = (p.expand?.direccion_general ?? []).map((it: any) => it?.id ?? it);
                selectedDireccionAsistente = (p.expand?.direccion_asistente ?? []).map((it: any) => it?.id ?? it);
                selectedDireccionCoreografico = (p.expand?.direccion_coreografico ?? []).map((it: any) => it?.id ?? it);
                selectedProduccionEjecutiva = (p.expand?.produccion_ejecutiva ?? []).map((it: any) => it?.id ?? it);
                // keep reference to full project for building gallery URLs
                project = p as ProjectExpanded;
                existingGallery = Array.isArray(p.galeria) ? [...p.galeria] : [];
            }
        }
    });

    function onFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) programaFile = input.files[0];
    }

    function onGalleryChange(e: Event) {
        const input = e.target as HTMLInputElement;
        galeriaFiles = [];
        if (input.files && input.files.length > 0) {
            galeriaFiles = Array.from(input.files);
        }
    }  

    async function onSubmit(e: Event) {
        e.preventDefault();
        try {
            const form = new FormData();
            form.append('nombre', titulo);
            if (selectedAutor && selectedAutor.length > 0) form.append('autor', selectedAutor[0]);
            if (anio) form.append('anio', String(anio));
            if (estreno) form.append('estreno', estreno);
            if (grupo) form.append('grupo_id', grupo);
            if (programaFile) form.append('programa', programaFile);
            // Attach gallery image files (if any) — compress images > 5MB before appending
            if (galeriaFiles && galeriaFiles.length > 0) {
                const MAX = 5 * 1024 * 1024;
                const processed: File[] = [];
                isCompressing = true;
                try {
                    for (const f of galeriaFiles) {
                        if (f.size > MAX) {
                            console.log('Compressing large image before upload:', f.name, f.size);
                        }
                        try {
                            const out = await compressIfNeeded(f, MAX);
                            processed.push(out);
                        } catch (err) {
                            console.warn('Compression failed for', f.name, ', sending original file.', err);
                            processed.push(f);
                        }
                    }
                } finally {
                    isCompressing = false;
                }
                processed.forEach((f) => form.append('galeria', f));
            }

            // relations: send arrays of ids
            // relations: append arrays where backend expects arrays
            if (selectedActores && selectedActores.length > 0) {
                selectedActores.forEach(id => form.append('elenco', id));
            } else {
                // ensure empty relation is cleared
                form.append('elenco', '');
            }

            if (selectedBailarines && selectedBailarines.length > 0) {
                selectedBailarines.forEach(id => form.append('bailarines', id));
            } else {
                form.append('bailarines', '');
            }

            if (selectedMusicos && selectedMusicos.length > 0) {
                selectedMusicos.forEach(id => form.append('musicos', id));
            } else {
                form.append('musicos', '');
            }

            if (selectedCantantes && selectedCantantes.length > 0) {
                selectedCantantes.forEach(id => form.append('cantantes', id));
            } else {
                form.append('cantantes', '');
            }

            if (selectedStaff && selectedStaff.length > 0) {
                selectedStaff.forEach(id => form.append('staff', id));
            } else {
                form.append('staff', '');
            }

            // Single relations: send as plain string (first selected id) when present
            if (selectedDireccionGeneral && selectedDireccionGeneral.length > 0) {
                form.append('direccion_general', selectedDireccionGeneral[0]);
            } else {
                form.append('direccion_general', '');
            }
            if (selectedDireccionAsistente && selectedDireccionAsistente.length > 0) {
                form.append('direccion_asistente', selectedDireccionAsistente[0]);
            } else {
                form.append('direccion_asistente', '');
            }
            // direccion_coreografico is expected as an array per backend example
            if (selectedDireccionCoreografico && selectedDireccionCoreografico.length > 0) {
                selectedDireccionCoreografico.forEach(id => form.append('direccion_coreografico', id));
            } else {
                form.append('direccion_coreografico', '');
            }
            if (selectedProduccionEjecutiva && selectedProduccionEjecutiva.length > 0) {
                form.append('produccion_ejecutiva', selectedProduccionEjecutiva[0]);
            } else {
                form.append('produccion_ejecutiva', '');
            }
            // Include info about removed existing images so backend can delete them
            if (removedGallery && removedGallery.length > 0) {
                removedGallery.forEach(name => form.append('galeria_delete[]', name));
            }
            

            if (editing && projectId) {
                // Console log all form entries (helps debugging what's actually being sent)
                console.log('Submitting update for project ID:', projectId, 'form entries:', Array.from(form.entries()));

                await updateProject(projectId, form);
                alert('Proyecto actualizado');
            } else {
                console.log('Submitting create with form entries:', Array.from(form.entries()));
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
            <label for="nombre" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Título</label>
            <input bind:value={titulo} type="text" id="nombre" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="La Ratonera" required />
        </div>
        <div>
            <label for="autor" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Autor (Opcional)
                <MultiSelect items={people} maxItems={1} bind:selected={selectedAutor} placeholder="Buscar..." />
            </label>
            
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
            <label for="grupo_id" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Producción</label>
            <select bind:value={grupo} id="grupo_id" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required >
                <option value="">Selecciona un grupo</option>
                {#each groups as g}
                    <option value={g.id}>{g.nombre}</option>
                {/each}
            </select>
        </div>
        <div>
            <label for="programa" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Programa de mano</label>
            <input on:change={onFileChange} type="file" id="programa" class="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
        </div>
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Imágenes de galería
                <input on:change={onGalleryChange} type="file" id="galeria" accept="image/*" multiple class="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white mt-2" />
            </label>
            {#if galeriaFiles.length > 0}
                <div class="mt-2 text-sm text-gray-600">{galeriaFiles.length} archivo{galeriaFiles.length === 1 ? '' : 's'}</div>
            {/if}
        </div>

        {#if existingGallery && existingGallery.length > 0}
            <div class="mt-4">
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">Imágenes existentes</h3>
                <div class="grid grid-cols-3 gap-3 mt-2">
                    {#each existingGallery as filename}
                        <div class="relative border rounded overflow-hidden">
                            {#if project}
                                <img src={getGalleryThumbUrl(project, filename, 240, 160, 40)} alt={filename} class="w-full h-32 object-cover" />
                            {/if}
                            <button type="button" on:click={() => {
                                // remove from existingGallery and add to removedGallery
                                existingGallery = existingGallery.filter(f => f !== filename);
                                removedGallery = [...removedGallery, filename];
                            }} class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs">Eliminar</button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        {#if removedGallery && removedGallery.length > 0}
            <div class="mt-3">
                <h4 class="text-sm font-medium text-red-600">Imágenes marcadas para eliminar ({removedGallery.length})</h4>
                <div class="flex gap-2 mt-2 flex-wrap">
                    {#each removedGallery as name}
                        <div class="bg-red-50 text-red-800 px-2 py-1 rounded text-sm flex items-center gap-2">
                            <span class="truncate max-w-xs">{name}</span>
                            <button type="button" on:click={() => {
                                // undo: move back from removedGallery to existingGallery
                                removedGallery = removedGallery.filter(n => n !== name);
                                existingGallery = [name, ...existingGallery];
                            }} class="text-red-600 underline text-xs">Deshacer</button>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
    Créditos
    <div class="grid gap-6 mb-6 md:grid-cols-2">
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dirección General
                <MultiSelect 
                    items={people} 
                    bind:selected={selectedDireccionGeneral} 
                    placeholder="Buscar director general..."
                    maxItems={1} />
            </label>
        </div> 
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Asistente de Dirección
                <MultiSelect 
                    items={people} 
                    bind:selected={selectedDireccionAsistente} 
                    placeholder="Buscar asistente de dirección..."
                    maxItems={1} />
            </label>
        </div> 
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Dirección Coreográfica
                <MultiSelect 
                    items={people} 
                    bind:selected={selectedDireccionCoreografico} 
                    placeholder="Buscar director coreográfico..."
                    maxItems={1} />
            </label>
        </div> 
        <div>
            <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Producción Ejecutiva
                <MultiSelect 
                    items={people} 
                    bind:selected={selectedProduccionEjecutiva} 
                    placeholder="Buscar productor ejecutivo..."
                    maxItems={1} />
            </label>
        </div>
    </div>
    
     
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Actores
            <MultiSelect items={people} bind:selected={selectedActores} placeholder="Buscar actores..." />
        </label>
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Bailarines
            <MultiSelect items={people} bind:selected={selectedBailarines} placeholder="Buscar bailarines..." />
        </label>
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Músicos
            <MultiSelect items={people} bind:selected={selectedMusicos} placeholder="Buscar músicos..." />
        </label>
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Cantantes
            <MultiSelect items={people} bind:selected={selectedCantantes} placeholder="Buscar cantantes..." />
        </label>
    </div>
    <div class="mb-6">
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Staff
            <MultiSelect items={people} bind:selected={selectedStaff} placeholder="Buscar staff..." />
        </label>
    </div>
    
    <div class="flex gap-3 items-center">
        <button type="submit" disabled={isCompressing} class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-60 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">{editing ? 'Actualizar' : 'Crear'}</button>
        <button type="button" on:click={() => goto('/admin')} class="text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2">Volver</button>
        {#if isCompressing}
            <div class="ml-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                Comprimiendo imágenes...
            </div>
        {/if}
    </div>
</form>
