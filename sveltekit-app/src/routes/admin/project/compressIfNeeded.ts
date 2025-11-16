export async function compressIfNeeded(file: File, maxSize = 5 * 1024 * 1024): Promise<File> {
    if (file.size <= maxSize) return file;

    // create image bitmap for efficient decoding
    let imgBitmap: ImageBitmap | null = null;
    try {
        if ('createImageBitmap' in window) {
            imgBitmap = await createImageBitmap(file as Blob);
        }
    } catch (err) {
        imgBitmap = null;
    }

    // fallback to HTMLImageElement
    if (!imgBitmap) {
        await new Promise<void>((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                try {
                    // create bitmap from image element
                    // @ts-ignore
                    imgBitmap = (createImageBitmap) ? createImageBitmap(img) as unknown as ImageBitmap : null;
                    resolve();
                } catch (e) {
                    // if createImageBitmap not available, we'll draw the image element directly later
                    imgBitmap = null;
                    resolve();
                } finally {
                    URL.revokeObjectURL(url);
                }
            };
            img.onerror = (e) => { URL.revokeObjectURL(url); resolve(); };
            img.src = url;
        });
    }

    // helper to convert canvas to blob
    function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
        return new Promise((res) => canvas.toBlob((b) => res(b as Blob), 'image/jpeg', quality));
    }

    // draw image to canvas with scaling
    let width = imgBitmap ? imgBitmap.width : 0;
    let height = imgBitmap ? imgBitmap.height : 0;

    if (!width || !height) {
        // fallback: try to get size from file via Image element
        const url = URL.createObjectURL(file);
        const img = await new Promise<HTMLImageElement>((resolve) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => resolve(i);
            i.src = url;
        });
        width = img.naturalWidth || 1600;
        height = img.naturalHeight || 900;
        URL.revokeObjectURL(url);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return file; // can't compress without canvas

    // iterative approach: reduce quality first, then scale down if needed
    let quality = 0.9;
    let blob: Blob | null = null;
    let attempt = 0;
    let scale = 1.0;

    while (attempt < 10) {
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        // draw source
        if (imgBitmap) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
        } else {
            // draw via Image element
            const url = URL.createObjectURL(file);
            // eslint-disable-next-line @typescript-eslint/no-shadow
            await new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // if image has transparency we draw white background to avoid black background when converting to jpeg
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
                img.src = url;
            });
        }

        blob = await canvasToBlob(canvas, quality);
        if (!blob) break;

        if (blob.size <= maxSize) break;

        // reduce quality; if quality low already, reduce scale
        if (quality > 0.4) {
            quality = Math.max(0.2, quality - 0.15);
        } else {
            scale = scale * 0.85; // reduce dimensions
        }
        attempt++;
    }

    if (!blob) return file;

    // create File from blob, preserve original name but ensure .jpg extension
    const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
    const newFile = new File([blob], newName, { type: blob.type });
    return newFile;
}