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

function createProjectsPreviewStore(perPageDefault = 15) {
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
		update(s => ({ ...s, error: null, loading: page === 1, loadingMore: page > 1 }));

		try {
			const snap = getSnapshot();
			const res = await fetchProjectsPreview(page, snap.search, snap.group || undefined);

			if (requestId !== lastRequestId) return; // ignore outdated responses

			update(s => {
				const items = page === 1 ? res.items : [...s.items, ...res.items];
				const totalItems = res.totalItems ?? items.length;
				const hasMore = items.length < totalItems;
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
			update(s => ({ ...s, loading: false, loadingMore: false, error: err?.message ?? 'Error desconocido' }));
		}
	}

	function loadNext() {
		const s = getSnapshot();
		if (!s.hasMore || s.loadingMore) return;
		loadPage(s.page + 1 || 1);
	}

	function reset() {
		lastRequestId++;
		set({ ...initial, perPage: initial.perPage });
	}

	function setSearch(search: string) {
		update(s => ({ ...s, search }));
		loadPage(1);
	}

	function setGroup(group?: string) {
		update(s => ({ ...s, group }));
		loadPage(1);
	}

	function refresh() {
		const s = getSnapshot();
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
		// for testing/debugging
		_getSnapshot: getSnapshot
	} as const;
}

export const projectsPreviewStore = createProjectsPreviewStore(15);