// 1. Crear un servicio para generar miniaturas
// ThumbnailService.ts

import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

export class ThumbnailService {
    private thumbnailCache = new Map<string, string>();

    async generateThumbnail(url: string, maxHeight: number = 320): Promise<string> {
        // Verificar cache primero
        const cacheKey = `${url}_${maxHeight}`;
        if (this.thumbnailCache.has(cacheKey)) {
            return this.thumbnailCache.get(cacheKey)!;
        }

        try {
            const loadingTask = pdfjs.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Solo la primera página

            // Calcular escala
            const viewport = page.getViewport({ scale: 1 });
            const scale = maxHeight / viewport.height;
            const scaledViewport = page.getViewport({ scale });

            // Crear canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            // Renderizar
            await page.render({
                canvasContext: context,
                viewport: scaledViewport,
            }).promise;

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
        const ctx = canvas.getContext('2d')!;
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
}