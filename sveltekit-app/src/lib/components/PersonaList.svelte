<script lang="ts">
    export let personas: Array<{ id: string; nombre: string; }>;
    export let tipo: "big" | "small" = "small";
</script>

<p class={tipo === "big" ? "text-lg text-gray-900" : "text-gray-900 leading-relaxed"}>
    {#each personas as person, i}
        {#if person.id}
            <a href={`/persona/${person.id}`} class="hover:text-blue-600 hover:underline">{person.nombre}</a>
        {:else}
            <span>{person.nombre}</span>
        {/if}
        {#if i < personas.length - 1}
            <span>, </span>
        {/if}
    {/each}
</p>