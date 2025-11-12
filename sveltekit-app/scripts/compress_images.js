import pocketbase from 'pocketbase';
// Note: this script requires the `sharp` and `form-data` packages. Install with:
// npm install sharp form-data
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
// Get environment variables for PocketBase
const PB_URL = PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new pocketbase(PB_URL);

// Config
const TARGET_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_QUALITY = 30; // minimum jpeg quality during compression
const QUALITY_STEP = 10; // reduce quality by this step each iteration
const RESIZE_STEP = 0.9; // multiply width by this factor when resizing

const args = process.argv.slice(2);
const APPLY = args.includes('--apply'); // when true, actually upload the thumbnail to PocketBase
const DRY = false // !APPLY; // dry-run mode (no upload)

console.log(`Starting compress_images.js (dry-run=${DRY})`);

// Fetch only records that have a full image but no thumbnail yet
const records = await pb.collection('galeria').getFullList({ filter: "imagen_full!='' && (imagen_thumb='' || imagen_thumb=null)" });

if (!records || records.length === 0) {
	console.log('No records to process.');
	process.exit(0);
}

// Lazy import heavy modules (sharp, form-data) only when needed
let sharp;
let FormData;
try {
	sharp = (await import('sharp')).default;
	FormData = (await import('form-data')).default;
} catch (err) {
	console.error('Missing dependency: please run `npm install sharp form-data` in the sveltekit-app folder');
	throw err;
}

async function fetchBuffer(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	const ab = await res.arrayBuffer();
	return Buffer.from(ab);
}

async function compressBuffer(buffer) {
	// Start trying to compress as JPEG with descending quality, then resize if needed
	let metadata;
	try {
		metadata = await sharp(buffer).metadata();
	} catch (err) {
		console.warn('sharp metadata failed, treating as generic image');
		metadata = {};
	}

	let quality = 80;
	let out = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();

	// Reduce quality first
	while (out.length > TARGET_BYTES && quality >= MIN_QUALITY) {
		quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
		out = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
	}

	// If still too large, progressively resize by RESIZE_STEP while keeping the current quality
	let width = metadata.width || null;
	if (out.length > TARGET_BYTES && width) {
		while (out.length > TARGET_BYTES && width > 200) {
			width = Math.floor(width * RESIZE_STEP);
			out = await sharp(buffer).resize({ width }).jpeg({ quality, mozjpeg: true }).toBuffer();
		}
	}

	// If still too large and we don't have width info, try a last-resort resize to 1000px wide
	if (out.length > TARGET_BYTES && !width) {
		out = await sharp(buffer).resize({ width: 1000 }).jpeg({ quality, mozjpeg: true }).toBuffer();
		// try reducing quality again if needed
		while (out.length > TARGET_BYTES && quality > MIN_QUALITY) {
			quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
			out = await sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
		}
	}

	return out;
}

async function uploadThumb(record, buffer) {
	// Build multipart/form-data using `form-data` and send directly to PocketBase REST API.
	const form = new FormData();
	const filename = `thumb_${record.id}.jpg`;
	form.append('imagen_thumb', buffer, { filename, contentType: 'image/jpeg' });

	// form.getHeaders() provides the required Content-Type multipart header
	const headers = form.getHeaders ? form.getHeaders() : {};

	// If the PocketBase client has an auth token, forward it (SDK stores tokens in authStore.token)
	try {
		const token = pb?.authStore?.token;
		if (token) {
			// PocketBase accepts 'X-Auth-Token' for auth; also include Authorization Bearer as fallback
			headers['X-Auth-Token'] = token;
			headers['Authorization'] = `Bearer ${token}`;
		}
	} catch (e) {
		// ignore if authStore not present
	}

	const base = (pb && pb.baseUrl) ? pb.baseUrl : 'https://pocketbase-production-f5d2.up.railway.app';
	const url = `${base.replace(/\/$/, '')}/api/collections/galeria/records/${record.id}`;

	// Some Node fetch implementations have trouble streaming form-data; convert to a single Buffer
	// so Content-Length is known and the server doesn't see truncated multipart boundaries.
	let body = form;
	if (typeof form.getBuffer === 'function') {
		body = form.getBuffer();
		headers['Content-Length'] = Buffer.byteLength(body);
	}

	const res = await fetch(url, { method: 'PATCH', headers, body });
	let json;
	try {
		json = await res.json();
	} catch (e) {
		const txt = await res.text().catch(() => '<no-body>');
		throw new Error(`Upload failed and response could not be parsed as JSON: ${res.status} ${res.statusText} - ${txt}`);
	}
	if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${JSON.stringify(json)}`);
	return json;
}

for (const rec of records) {
	try {
		if (!rec.imagen_full) {
			console.log(`Record ${rec.id} has no imagen_full, skipping`);
			continue;
		}

		const url = pb.files.getURL(rec, rec.imagen_full);
		console.log(`Processing record ${rec.id} - fetching ${url}`);

		const originalBuffer = await fetchBuffer(url);
		console.log(`Original size: ${(originalBuffer.length / (1024*1024)).toFixed(2)} MB`);

		const compressed = await compressBuffer(originalBuffer);
		console.log(`Compressed size: ${(compressed.length / (1024*1024)).toFixed(2)} MB`);

		if (DRY) {
			console.log(`[dry-run] Would upload thumb for record ${rec.id} (${compressed.length} bytes)`);
		} else {
			const res = await uploadThumb(rec, compressed);
			console.log(`Uploaded thumbnail for ${rec.id} -> ${res.id}`);
		}
	} catch (err) {
		console.error(`Error processing record ${rec.id}:`, err);
	}
}

console.log('Done.');