export interface LazyThumbnailParams {
    generate: () => Promise<string>;
    onStart?: () => void;
    onLoaded?: (dataUrl: string) => void;
    rootMargin?: string;
}

export function lazyThumbnail(node: HTMLElement, params: LazyThumbnailParams) {
    const rootMargin = params.rootMargin ?? '200px';

    const observer = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                // Detener observación para no recargar
                observer.unobserve(node);

                try {
                    params.onStart && params.onStart();
                    const dataUrl = await params.generate();
                    params.onLoaded && params.onLoaded(dataUrl);
                } catch (err) {
                    console.error('lazyThumbnail error:', err);
                }
            }
        }
    }, { root: null, rootMargin, threshold: 0.1 });

    observer.observe(node);

    return {
        destroy() {
            observer.disconnect();
        }
    };
}
