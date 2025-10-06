type LazyThumbParams = {
    generate: () => Promise<string>;
    onStart?: () => void;
    onLoaded?: (dataUrl: string) => void;
    rootMargin?: string;
};

export function lazyThumbnail(node: HTMLElement, params: LazyThumbParams) {
    let observer: IntersectionObserver | null = null;
    const start = () => {
        params.onStart?.();
        params.generate().then((dataUrl) => {
            params.onLoaded?.(dataUrl);
        }).catch(() => {
            // swallow
        });
    };

    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    observer?.disconnect();
                    start();
                    break;
                }
            }
        }, { rootMargin: params.rootMargin ?? '0px' });
        observer.observe(node);
    } else {
        // fallback: generate immediately
        start();
    }

    return {
        destroy() {
            observer?.disconnect();
        }
    };
}

