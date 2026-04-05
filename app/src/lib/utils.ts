// Convierte de timestamp a string "1 de marzo de 2021"
export function timestampToDate(ts: string) {
  const date = new Date(ts);
  date.setDate(date.getDate() + 1);
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-MX', options);
}

// Comprime una imagen 
export const compressImage = (file: File, maxSizeMB = 1): Promise<File> => {
  return new Promise((resolve) => {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB <= maxSizeMB) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) { if (width > 1920) { height *= 1920 / width; width = 1920; } } 
        else { if (height > 1080) { width *= 1080 / height; height = 1080; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }) : file), 'image/jpeg', 0.8);
      };
    };
  });
};