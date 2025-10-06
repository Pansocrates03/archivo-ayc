// ThumbnailService.ts

export class ThumbnailService {
    private thumbnailCache = new Map<string, string>();
    private pdfjs: any | null = null;
    private pdfjsInitialized = false;

    async generateThumbnail(url: string, maxHeight: number = 320): Promise<string> {
        // Verificar cache primero
        const cacheKey = `${url}_${maxHeight}`;
        if (this.thumbnailCache.has(cacheKey)) {
            return this.thumbnailCache.get(cacheKey)!;
        }

        try {
            if (typeof window === 'undefined' || typeof document === 'undefined') {
                // Not running in a browser environment
                return this.createPlaceholder(320, maxHeight);
            }

            // Inicializar PDF.js solo una vez
            if (!this.pdfjsInitialized) {
                this.pdfjs = await import('pdfjs-dist');
                
                // Configurar el worker - CORREGIDO
                this.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${this.pdfjs.version}/build/pdf.worker.min.mjs`;
                
                this.pdfjsInitialized = true;
            }

            const loadingTask = this.pdfjs.getDocument({
                url: url,
                // Añadir opciones para mejor compatibilidad
                isEvalSupported: false,
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
            });
            
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Solo la primera página

            // Calcular escala
            const viewport = page.getViewport({ scale: 1 });
            const scale = maxHeight / viewport.height;
            const scaledViewport = page.getViewport({ scale });

            // Crear canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) {
                throw new Error('No se pudo obtener el contexto 2D del canvas');
            }
            
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            // Renderizar
            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;

            // Limpiar recursos
            await page.cleanup();

            // Convertir a PNG data URL
            const dataUrl = canvas.toDataURL('image/png', 0.8);
            
            // Guardar en cache
            this.thumbnailCache.set(cacheKey, dataUrl);
            
            return dataUrl;
        } catch (error) {
            console.error('Error generando miniatura:', error);
            // Retornar placeholder
            return this.createPlaceholder(320, maxHeight);
        }
    }

    private createPlaceholder(width: number, height: number): string {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            // Fallback si no hay canvas disponible
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Fondo gris
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, width, height);
        
        // Texto
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Vista previa no disponible', width/2, height/2);
        
        return canvas.toDataURL('image/png');
    }

    // Método para limpiar la caché si es necesario
    clearCache(): void {
        this.thumbnailCache.clear();
    }
}