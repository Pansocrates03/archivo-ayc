<script lang="ts">
    import { onMount } from 'svelte';
    import PdfPoster from './PdfPoster.svelte';

    export let url: string;
    export let showTopButton = false;
    export let showBorder = false;
    export let maxHeight = 320;
    export let scale = 1;

    let visible = false;
    let el: HTMLDivElement;

    onMount(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    visible = true;
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    });
</script>

<div bind:this={el} style="min-height: {maxHeight}px;">
    {#if visible}
        <PdfPoster
            {url}
            {showTopButton}
            {showBorder}
            {maxHeight}
            {scale}
        />
    {/if}
</div>