<script lang="ts">
    export let selectedPlay: any = null;
    export let openPrograma: () => void = () => {};
</script>

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