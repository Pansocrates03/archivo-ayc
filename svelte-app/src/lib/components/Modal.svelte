<script>
	let { showModal = $bindable(), header, children, onopen, onclose } = $props();

	let dialog = $state(); // HTMLDialogElement

	$effect(() => {
        if (showModal) {
            dialog?.showModal();
            onopen?.(); // Llamar al callback si existe
        } else {
            dialog?.close();
            onclose?.(); // Llamar al callback de cierre
        }
    });

	// Función para manejar el cierre del modal
	function handleClose() {
		showModal = false; // Esto triggereará el $effect que llamará onclose
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={handleClose}
	onclick={(e) => { if (e.target === dialog) handleClose(); }}
>
	<div>
		<div>
			<h2 class="text-2xl font-bold text-gray-800">
            {header}
        	</h2>
		</div>
		<hr />
		{@render children?.()}
		<hr />
		<!-- svelte-ignore a11y_autofocus -->
		<button
			autofocus
			onclick={handleClose}
			class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
		>close modal</button>
	</div>
</dialog>

<style>
	dialog {
		max-width: 80vw;
		/* width: 80vw; */
		border-radius: 0.2em;
		border: none;
		padding: 0;
		/* Centrado en pantalla */
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>