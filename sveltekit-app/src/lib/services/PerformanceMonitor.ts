/**
 * Utilidad para monitorear el performance de carga de imágenes
 * Agregar este código temporalmente para diagnosticar velocidad
 */

export class PerformanceMonitor {
    private imageLoadTimes: Map<string, number> = new Map();
    private imageStartTimes: Map<string, number> = new Map();

    startImageLoad(imageName: string): void {
        this.imageStartTimes.set(imageName, performance.now());
    }

    endImageLoad(imageName: string): void {
        const startTime = this.imageStartTimes.get(imageName);
        if (startTime) {
            const loadTime = performance.now() - startTime;
            this.imageLoadTimes.set(imageName, loadTime);
            console.log(`📸 ${imageName}: ${(loadTime / 1000).toFixed(2)}s`);
            this.imageStartTimes.delete(imageName);
        }
    }

    getStats(): { 
        avgTime: number; 
        minTime: number; 
        maxTime: number; 
        totalImages: number;
    } {
        const times = Array.from(this.imageLoadTimes.values());
        
        if (times.length === 0) {
            return { avgTime: 0, minTime: 0, maxTime: 0, totalImages: 0 };
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        return {
            avgTime: avgTime / 1000,
            minTime: minTime / 1000,
            maxTime: maxTime / 1000,
            totalImages: times.length
        };
    }

    printStats(): void {
        const stats = this.getStats();
        console.log('\n📊 ESTADÍSTICAS DE CARGA DE IMÁGENES:');
        console.log(`   Total imágenes: ${stats.totalImages}`);
        console.log(`   Promedio: ${stats.avgTime.toFixed(2)}s`);
        console.log(`   Más rápida: ${stats.minTime.toFixed(2)}s`);
        console.log(`   Más lenta: ${stats.maxTime.toFixed(2)}s\n`);
    }

    reset(): void {
        this.imageLoadTimes.clear();
        this.imageStartTimes.clear();
    }
}

// Singleton para usar en toda la app
export const perfMonitor = new PerformanceMonitor();