import { writable } from 'svelte/store';
import type { ProjectPreview } from '$lib/types/alltypes';
import { fetchProjectsPreview } from '$lib/services/DatabaseService';

type State = {
	items: ProjectPreview[];
	page: number;
	perPage: number;
	totalItems: number;
	hasMore: boolean;
	loading: boolean;
	loadingMore: boolean;
	error: string | null;
	search: string;
	group?: string;
}

function createProjectsPreviewStore(perPageDefault = 10) {
	const initial: State = {
		items: [],
		page: 0,
		perPage: perPageDefault,
		totalItems: 0,
		hasMore: true,
		loading: false,
		loadingMore: false,
		error: null,
		search: '',
		group: undefined
	};

	const { subscribe, set, update } = writable<State>(initial);

	let lastRequestId = 0;

	function getSnapshot(): State {
		let snap: State = initial;
		const unsub = subscribe(s => snap = s);
		unsub();
		return snap;
	}

	async function loadPage(page = 1) {
		const requestId = ++lastRequestId;
		
		update(s => ({ 
			...s, 
			error: null, 
			loading: page === 1, 
			loadingMore: page > 1 
		}));

		try {
			const snap = getSnapshot();
			console.log('[store] Loading page', page, 'search:', snap.search, 'group:', snap.group);
			
			const res = await fetchProjectsPreview(page, snap.search, snap.group);

			// Ignore outdated responses
			if (requestId !== lastRequestId) {
				console.log('[store] Ignoring outdated response for page', page);
				return;
			}

			update(s => {
				const items = page === 1 ? res.items : [...s.items, ...res.items];
				const totalItems = res.totalItems ?? items.length;
				const hasMore = items.length < totalItems;
				
				console.log('[store] Page loaded:', {
					page,
					itemsCount: items.length,
					totalItems,
					hasMore,
					newItems: res.items.length
				});
				
				return {
					...s,
					items,
					page,
					perPage: res.perPage ?? s.perPage,
					totalItems,
					hasMore,
					loading: false,
					loadingMore: false,
					error: null
				};
			});
		} catch (err: any) {
			if (requestId !== lastRequestId) return;
			
			console.error('[store] Error loading page:', err);
			update(s => ({ 
				...s, 
				loading: false, 
				loadingMore: false, 
				error: err?.message ?? 'Error desconocido' 
			}));
		}
	}

	function loadNext() {
		const s = getSnapshot();
		console.log('[store] loadNext called:', {
			hasMore: s.hasMore,
			loadingMore: s.loadingMore,
			currentPage: s.page,
			itemsCount: s.items.length,
			totalItems: s.totalItems
		});
		
		if (!s.hasMore || s.loadingMore) {
			console.log('[store] Skipping loadNext - hasMore:', s.hasMore, 'loadingMore:', s.loadingMore);
			return;
		}
		
		const nextPage = s.page + 1;
		console.log('[store] Loading next page:', nextPage);
		loadPage(nextPage);
	}

	function reset() {
		console.log('[store] Resetting store');
		lastRequestId++;
		set({ ...initial, perPage: initial.perPage });
	}

	function setSearch(search: string) {
		console.log('[store] Setting search:', search);
		update(s => ({ ...s, search, page: 0, items: [], hasMore: true }));
		loadPage(1);
	}

	function setGroup(group?: string) {
		console.log('[store] Setting group:', group);
		update(s => ({ ...s, group, page: 0, items: [], hasMore: true }));
		loadPage(1);
	}

	function refresh() {
		const s = getSnapshot();
		console.log('[store] Refreshing page:', s.page || 1);
		loadPage(s.page || 1);
	}

	function patchItem(id: string, patch: Partial<ProjectPreview>) {
		update(s => {
			const items = s.items.map(item => item.id === id ? { ...item, ...patch } : item);
			return { ...s, items };
		});
	}

	return {
		subscribe,
		loadPage,
		loadNext,
		reset,
		setSearch,
		setGroup,
		refresh,
		patchItem,
		_getSnapshot: getSnapshot
	} as const;
}

export const projectsPreviewStore = createProjectsPreviewStore(10);// DatabaseService.ts - Versión Corregida