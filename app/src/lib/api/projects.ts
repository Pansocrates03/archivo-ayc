import { pg, s3, ilovepdf } from "./services";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { unlink } from "node:fs/promises";
import sharp from "sharp";
import type { BunRequest } from "bun";

// --- CONFIGURACIÓN MINIO ---
const BUCKET_NAME = process.env.S3_BUCKET || "actec-bucket";
const BUCKET_URL = process.env.S3_PUBLIC_URL || "http://localhost:9000/actec-bucket";

// --- FUNCIONES AUXILIARES DE COMPRESIÓN ---

/**
 * Comprime una imagen PNG hasta que pese menos de 250KiB usando Sharp
 */
async function compressImage(inputPath: string, outputPath: string, maxSizeKB: number = 250) {
  try {
    const maxBytes = maxSizeKB * 1024;
    let quality = 85;
    let width = 1024;

    while (quality >= 40 && width >= 300) {
      const buffer = await sharp(inputPath)
        .resize(width, Math.round(width * 1.5), { withoutEnlargement: true })
        .png({ quality })
        .toBuffer();

      if (buffer.length < maxBytes) {
        await Bun.write(outputPath, buffer);
        console.log(`✓ Imagen comprimida: ${(buffer.length / 1024).toFixed(2)}KB (w:${width}, q:${quality})`);
        return outputPath;
      }

      quality -= 10;
      if (quality < 40) {
        width -= 200;
        quality = 85;
      }
    }

    // Si aún es muy grande, usar la versión más comprimida
    const finalBuffer = await sharp(inputPath)
      .resize(300, 450, { withoutEnlargement: true })
      .png({ quality: 40 })
      .toBuffer();

    await Bun.write(outputPath, finalBuffer);
    console.log(`✓ Imagen comprimida (forzado): ${(finalBuffer.length / 1024).toFixed(2)}KB`);
    return outputPath;
  } catch (error) {
    console.warn("⚠ Error al comprimir imagen, usando original");
    await Bun.write(outputPath, await Bun.file(inputPath).arrayBuffer());
    return outputPath;
  }
}

// --- FUNCIÓN AUXILIAR PARA PROCESAR ARCHIVOS ---
async function uploadProjectFiles(projectId: string, formData: FormData) {
  console.log(`Iniciando proceso de archivos para proyecto ${projectId}`);
  const programaFile = formData.get('programa') as File | null;
  const galeriaFiles = formData.getAll('galeria') as File[];

  let programa_url = null;
  let thumbnail_url = null;
  let galeria_urls: string[] = [];

  // 1. Procesar el PDF, comprimirlo con iLovePDF y generar el Thumbnail
  if (programaFile) {
    const tempPdfPath = `/tmp/${crypto.randomUUID()}.pdf`;
    const tempPngPath = `/tmp/${crypto.randomUUID()}.png`;
    const compressedPngPath = `/tmp/${crypto.randomUUID()}_compressed.png`;
    
    await Bun.write(tempPdfPath, programaFile);

    // Comprimir PDF con iLovePDF

    // Extraer la página 1 como PNG desde el PDF
    const { stdout } = Bun.spawnSync([
      "pdftoppm", "-png", "-f", "1", "-l", "1", "-r", "100", "-singlefile", tempPdfPath, tempPngPath.replace('.png', '')
    ]);

    if (stdout && stdout.length > 0) {
      // Comprimir PNG a menos de 250KB
      const finalPngPath = await compressImage(tempPngPath, compressedPngPath, 250);

      const thumbKey = `proyectos/${projectId}/thumbnail/portada.png`;
      const pngBuffer = await Bun.file(finalPngPath).arrayBuffer();
      await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: thumbKey, Body: pngBuffer, ContentType: "image/png" }));
      thumbnail_url = `/${thumbKey}`;
    }

    // Subir el PDF (comprimido o original)
    const progKey = `proyectos/${projectId}/programa/programa_mano.pdf`;
    const pdfBuffer = await Bun.file(tempPdfPath).arrayBuffer();
    await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: progKey, Body: pdfBuffer, ContentType: "application/pdf" }));
    programa_url = `/${progKey}`;

    // Limpiar archivos temporales
    try {
      const filesToClean = [tempPdfPath, tempPngPath, compressedPngPath];
      await Promise.all(filesToClean.map(f => unlink(f).catch(() => {})));
    } catch (err) {
      console.error(`Advertencia: Error al limpiar archivos temporales`, err);
    }
  }

  // 2. Procesar las imágenes de la Galería
  if (galeriaFiles && galeriaFiles.length > 0) {
    for (const file of galeriaFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const galKey = `proyectos/${projectId}/galeria/${crypto.randomUUID()}_${safeName}`;
      
      await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: galKey, Body: await file.arrayBuffer(), ContentType: file.type }));
      galeria_urls.push(`/${galKey}`);
    }
  }

  return { programa_url, thumbnail_url, galeria_urls };
}

// --- RUTAS DE LA API ---

export const projectsRoute = {
  GET: async (req: Request) => {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const search = url.searchParams.get('search') || '';
    const limit = 50;
    const offset = (parseInt(page) - 1) * limit;

    let rows;
    if (search) {
      rows = await pg`
        SELECT p.id, p.nombre, p.estreno, p.grupo_id, p.programa_url, p.thumbnail_url, p.youtube_url,
               g.nombre AS company_name
        FROM proyectos p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        WHERE LOWER(unaccent(p.nombre)) LIKE LOWER('%' || ${search} || '%')
        ORDER BY p.estreno DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await pg`
        SELECT p.id, p.nombre, p.estreno, p.grupo_id, p.programa_url, p.thumbnail_url, p.youtube_url,
               g.nombre AS company_name
        FROM proyectos p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        ORDER BY p.estreno DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const proyectosConUrls = rows.map(proyecto => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
      programa_url: proyecto.programa_url ? `${BUCKET_URL}${proyecto.programa_url}` : null,
    }));

    return new Response(JSON.stringify(proyectosConUrls), { headers: { "Content-Type": "application/json" }, status: 200 });
  },

  POST: async (req: Request) => {
    try {
      // 1. Extraer FormData (Ya no usamos req.json)
      const formData = await req.formData();
      const nombre = formData.get('nombre') as string;
      const grupo_id = formData.get('grupo_id') as string;
      const estreno = formData.get('estreno') as string;
      const youtube_url = (formData.get('youtube_url') as string) || null;
      const creditos = JSON.parse((formData.get('creditos') as string) || '[]');

      if (!nombre || !estreno || !grupo_id) {
        return new Response(JSON.stringify({ error: "El nombre, estreno y grupo_id son requeridos" }), { status: 400 });
      }

      // 2. Insertamos el proyecto base para que Postgres nos genere el ID
      const result = await pg`
        INSERT INTO proyectos (nombre, estreno, grupo_id, youtube_url)
        VALUES (${nombre}, ${estreno}, ${grupo_id}, ${youtube_url})
        RETURNING id
      `;
      const newProjectId = result[0].id;

      // 3. Procesamos los archivos (ahora que tenemos el ID)
      const { programa_url, thumbnail_url, galeria_urls } = await uploadProjectFiles(newProjectId, formData);

      // 4. Actualizamos el proyecto con las URLs finales e insertamos los créditos en una Transacción
      await pg.begin(async (sql) => {
        // Actualizar URLs
        if (programa_url || thumbnail_url || galeria_urls.length > 0) {
          const galeriaJson = JSON.stringify(galeria_urls); // Convertimos nativamente
            
          await sql`
            UPDATE proyectos 
            SET programa_url = ${programa_url}, 
                thumbnail_url = ${thumbnail_url}, 
                galeria_urls = ${galeriaJson}::jsonb 
            WHERE id = ${newProjectId}
          `;
        }

        // Insertar créditos (Bulk Insert)
        if (creditos.length > 0) {
          const nuevosCreditos = creditos.map((c: any, index: number) => ({
            proyecto_id: newProjectId,
            rol_id: c.rol_id,
            persona_id: c.persona_id,
            orden: index + 1
          }));
          await sql`INSERT INTO creditos ${sql(nuevosCreditos)}`;
        }
      });

      return new Response(JSON.stringify({ success: true, id: newProjectId }), { status: 201 });
    } catch (error) {
      console.error("Error creating project:", error);
      return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
    }
  }
};

export const projectDetailRoute = {
  GET: async (req: BunRequest ) => {
    const { id } = req.params as { id: string };
    
    const rows = await pg`
      SELECT 
          p.id, p.nombre AS proyecto_nombre, p.estreno, p.programa_url, p.thumbnail_url, p.galeria_urls, p.youtube_url,
          g.id AS grupo_id, g.nombre AS grupo_nombre, g.tag AS grupo_tag,
          COALESCE(
            (SELECT jsonb_agg(
              jsonb_build_object(
                  'credito_id', c.id, 'rol_nombre', r.nombre, 'rol_id', r.id,
                  'categoria', r.categoria, 'persona_id', pe.id, 'persona_nombre', pe.nombre
              ) ORDER BY r.categoria, c.orden
            ) FROM creditos c JOIN roles r ON c.rol_id = r.id JOIN personas pe ON c.persona_id = pe.id WHERE c.proyecto_id = p.id), 
            '[]'::jsonb
          ) AS creditos
      FROM proyectos p
      LEFT JOIN grupos g ON p.grupo_id = g.id
      WHERE p.id = ${id}
    `;

    // Interceptamos los datos y armamos la URL absoluta
    const proyectosConUrls = rows.map(proyecto => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
      programa_url: proyecto.programa_url ? `${BUCKET_URL}${proyecto.programa_url}` : null,
    }));
    
    return new Response(JSON.stringify(proyectosConUrls[0]), {
        headers: { "Content-Type": "application/json" },
        status: 200
    });
  },

  PUT: async (req: BunRequest) => {
    const { id } = req.params as { id: string };

    try {
      // 1. Extraer FormData (Ya no usamos req.json)
      const formData = await req.formData();
      const nombre = formData.get('nombre') as string;
      const grupo_id = formData.get('grupo_id') as string;
      const estreno = formData.get('estreno') as string;
      const youtube_url = (formData.get('youtube_url') as string) || null;
      const creditos = JSON.parse((formData.get('creditos') as string) || '[]');

      // 2. Procesamos y subimos nuevos archivos (Si los hay)
      const { programa_url, thumbnail_url, galeria_urls } = await uploadProjectFiles(id, formData);

      // 3. Transacción SQL para actualizar todo
      await pg.begin(async (sql) => {
        // Actualizamos los datos (Usamos COALESCE para no borrar URLs previas si no se subieron archivos nuevos)
        const galeriaJson = JSON.stringify(galeria_urls);

        await sql`
            UPDATE proyectos
            SET nombre = ${nombre},
                estreno = ${estreno},
                grupo_id = ${grupo_id},
                youtube_url = ${youtube_url},
                programa_url = COALESCE(${programa_url}, programa_url),
                thumbnail_url = COALESCE(${thumbnail_url}, thumbnail_url),
                galeria_urls = CASE WHEN ${galeria_urls.length > 0} THEN ${galeriaJson}::jsonb ELSE galeria_urls END,
                updated_at = NOW()
            WHERE id = ${id}
        `;

        // Borramos los créditos viejos
        await sql`DELETE FROM creditos WHERE proyecto_id = ${id}`;

        // Insertamos la nueva lista
        if (creditos.length > 0) {
            const nuevosCreditos = creditos.map((c: any, index: number) => ({
                id: c.credito_id || undefined, // Mantenemos ID si existe, sino Postgres lo crea
                proyecto_id: id,
                rol_id: c.rol_id,
                persona_id: c.persona_id,
                orden: index + 1
            }));
            await sql`INSERT INTO creditos ${sql(nuevosCreditos)}`;
        }
      });

      return new Response(JSON.stringify({ success: true, message: "Actualizado correctamente." }), { status: 200 });

    } catch (error) {
      console.error(`Error al actualizar el proyecto ${id}:`, error);
      return new Response(JSON.stringify({ error: "Error interno al actualizar." }), { status: 500 });
    }
  }
};