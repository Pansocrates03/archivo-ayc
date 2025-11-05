<script lang="ts">
    import { onMount } from 'svelte';
    import { pb } from '$lib/services/DatabaseService';
    import { goto } from '$app/navigation';

    let authenticated = false;
    let loading = true;
    let email = '';
    let password = '';
    let error: string | null = null;

    function updateAuth() {
        try {
            authenticated = !!(pb && pb.authStore && pb.authStore.isValid);
        } catch (e) {
            authenticated = false;
        }
    }

    onMount(() => {
        // Only run in browser
        updateAuth();
        // Subscribe to auth changes
        try {
            pb.authStore.onChange(() => {
                updateAuth();
            });
        } catch (e) {
            // some pb builds may not have onChange, fallback to polling
            const id = setInterval(() => updateAuth(), 1000);
            return () => clearInterval(id);
        }
        loading = false;
    });

    async function login() {
        error = null;
        try {
            // Try admin authentication endpoint
            if (!email || !password) {
                error = 'Ingresa correo y contraseña';
                return;
            }

            console.log('Attempting admin login for', email);
            console.log('PocketBase instance:', password);

            // pb.admins.authWithPassword may be available in the SDK
            // fallback to collection auth if not
            if ((pb as any).admins && typeof (pb as any).admins.authWithPassword === 'function') {
                await (pb as any).admins.authWithPassword(email, password);
            } else if (typeof (pb as any).collection === 'function') {
                // try authenticating as a regular user in 'usuarios' or 'users' collection if applicable
                try {
                    await pb.collection('users').authWithPassword(email, password);
                } catch (err) {
                    // try admins endpoint via REST as fallback
                    const res = await fetch(`${pb.baseUrl.replace(/\/$/, '')}/api/admins/auth-with-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ identity: email, password })
                    });
                    if (!res.ok) throw new Error('Login failed');
                    const data = await res.json();
                    if (data && data.token) {
                        pb.authStore.save(data.token, data.record);
                    }
                }
            }

            updateAuth();
            if (authenticated) {
                // navigate to admin root
                goto('/admin');
            } else {
                error = 'Credenciales inválidas';
            }
        } catch (err: any) {
            console.error('Login error', err);
            error = err?.message || 'Error durante autenticación';
        }
    }

    function logout() {
        try {
            pb.authStore.clear();
        } catch (e) {}
        authenticated = false;
        goto('/');
    }
</script>

{#if loading}
    <div class="p-6">Comprobando autenticación...</div>
{:else}
    {#if !authenticated}
        <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div class="w-full max-w-md bg-white p-6 rounded shadow">
                <h2 class="text-xl font-semibold mb-4">Admin Login</h2>
                {#if error}
                    <div class="mb-3 text-sm text-red-600">{error}</div>
                {/if}
                <div class="mb-3">
                    <label class="block text-sm text-gray-700 mb-1">Email</label>
                    <input class="w-full border px-3 py-2 rounded" bind:value={email} type="email" />
                </div>
                <div class="mb-4">
                    <label class="block text-sm text-gray-700 mb-1">Contraseña</label>
                    <input class="w-full border px-3 py-2 rounded" bind:value={password} type="password" />
                </div>
                <div class="flex items-center justify-between">
                    <button on:click={login} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ingresar</button>
                    <a href="/" class="text-sm text-gray-600">Volver al sitio</a>
                </div>
            </div>
        </div>
    {:else}
        <div class="min-h-screen bg-gray-50">
            <div class="bg-white p-3 shadow flex justify-between items-center">
                <div class="font-semibold">Admin</div>
                <div>
                    <button on:click={logout} class="px-3 py-1 rounded bg-red-600 text-white">Cerrar sesión</button>
                </div>
            </div>
            <slot />
        </div>
    {/if}
{/if}
