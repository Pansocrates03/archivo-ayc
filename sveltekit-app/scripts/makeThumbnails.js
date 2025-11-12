// Script mejorado para generar thumbnails (PNG) de la primera página del 'programa' y
// subirlos al campo de archivos `thumbnail` en la colección `proyectos` de PocketBase.
//
// Requisitos:
//   npm i puppeteer pocketbase form-data
// Uso (PowerShell):
// 	 node scripts/makeThumbnails.js

import PocketBase from 'pocketbase';
import puppeteer from 'puppeteer';
// 1. ELIMINAR la importación de 'form-data'. No la necesitamos.
// import FormData from 'form-data';
// 2. AÑADIR la importación de 'Blob' de 'buffer'.
import { Blob } from 'buffer';

const PB_URL = 'https://pocketbase-cloudrun-244595609794.northamerica-south1.run.app';
const PB_ADMIN_EMAIL = 'e.s.baccio@gmail.com'; // <-- ¡IMPORTANTE!
const PB_ADMIN_PASSWORD = 'essibaPOCKETBASE03*'; // <-- ¡IMPORTANTE!

const pb = new PocketBase(PB_URL);

// Ajustes
const CONCURRENT = 1;
const TIMEOUT_MS = 60000;

// (createRendererPage sigue igual)
async function createRendererPage(browser, width = 800) {
	const page = await browser.newPage();
	await page.setViewport({ width: width, height: 1200 });

	const html = `
<!doctype html>
<html>
	<head>
		<meta charset="utf-t" />
		<style>body{margin:0;background:#fff}</style>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
	</head>
	<body>
		<canvas id="c"></canvas>
		<script>
			// Helper que replica la lógica de ThumbnailService.generateThumbnail (simplificada)
			window.generateThumbnail = async function(pdfUrl, maxHeight) {
				try {
					// pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
					const loadingTask = pdfjsLib.getDocument(pdfUrl);
					const pdf = await loadingTask.promise;
					const page = await pdf.getPage(1);
					const viewport = page.getViewport({ scale: 1 });
					const scale = maxHeight / viewport.height;
					const scaled = page.getViewport({ scale });

					const canvas = document.getElementById('c');
					canvas.width = Math.floor(scaled.width);
					canvas.height = Math.floor(scaled.height);
					const ctx = canvas.getContext('2d');
					await page.render({ canvasContext: ctx, viewport: scaled }).promise;
					await page.cleanup?.();
					return canvas.toDataURL('image/png', 0.8);
				} catch (e) {
					return { error: (e && e.message) ? e.message : String(e) };
				}
			};
		</script>
	</body>
</html>`;

	const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
	await page.goto(dataUrl, { waitUntil: 'networkidle2', timeout: TIMEOUT_MS });
	return page;
}

function dataUrlToBuffer(dataUrl) {
	const match = dataUrl.match(/^data:(image\/png);base64,(.+)$/);
	if (!match) throw new Error('Invalid data URL');
	return Buffer.from(match[2], 'base64');
}

async function processAll() {
	console.log('Autenticando como admin...');
	try {
		await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
		console.log('Autenticación exitosa.');
	} catch (authErr) {
		console.error('¡Error de autenticación! Verifica tus credenciales.', authErr.message);
		return; // Detener si la autenticación falla
	}

	console.log('Obteniendo lista completa de proyectos...');
	const projects = await pb.collection('proyectos').getFullList({
		expand: '',
		fields: 'id,nombre,programa,collectionId,collectionName,thumbnail'
	});

	console.log(`Encontrados ${projects.length} proyectos`);

	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
	try {
		const page = await createRendererPage(browser, 800);

		for (const proyecto of projects) {
			try {
				if (proyecto.thumbnail) {
					console.log(proyecto.id, '-> ya tiene thumbnail, saltando');
					continue;
				}

				if (!proyecto.programa) {
					console.log(proyecto.id, '-> sin programa, saltando');
					continue;
				}

				// IMPORTANTE: Esta URL debe ser públicamente accesible.
				// Verifica las Reglas de API del campo 'programa'.
				const pdfUrl = pb.files.getURL(proyecto, proyecto.programa);
				console.log(proyecto.id, '-> generando thumbnail desde', pdfUrl);

				const result = await page.evaluate(async (u, maxH) => {
					return await window.generateThumbnail(u, maxH);
				}, pdfUrl, 320);

				if (!result) {
					console.error(proyecto.id, '-> generación devolvió vacío');
					continue;
				}

				if (result.error) {
					console.error(proyecto.id, '-> error en página (¿PDF accesible?):', result.error);
					continue;
				}

				const pngDataUrl = result;
				const buffer = dataUrlToBuffer(pngDataUrl);

				// --- SECCIÓN DE CARGA CORREGIDA ---
				// No necesitamos guardar en disco. Usamos el buffer en memoria.
				
				// 3. Usar el 'FormData' NATIVO/GLOBAL (que viene con Node.js).
				// ¡Ya no es el que importamos de 'form-data'!
				const formData = new FormData();

				// 4. Envolver el 'buffer' en un 'Blob' para que FormData lo entienda.
				// El nombre es importante para que PocketBase lo reconozca.
				formData.append('thumbnail', new Blob([buffer]), `${proyecto.id}-thumb.png`);

				// Enviamos la actualización usando FormData
				await pb.collection('proyectos').update(proyecto.id, formData);
				console.log(proyecto.id, '-> thumbnail subido');
				// --- FIN DE LA SECCIÓN CORREGIDA ---

			} catch (err) {
				console.error('Error procesando proyecto', proyecto.id, err.message || err);
				if (err.response) {
					console.error('Respuesta de PocketBase:', JSON.stringify(err.response, null, 2));
				}
			}
		}

		console.log('Proceso completado');
	} finally {
		try { await browser.close(); } catch (e) {}
	}
}

(async () => {
	try {
		await processAll();
	} catch (e) {
		console.error('Error en proceso principal:', e);
		process.exit(1);
	}
})();