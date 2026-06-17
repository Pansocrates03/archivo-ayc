import { serve } from "bun";
import { SQL, type BunRequest } from "bun";
import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";

/*
====================
  CONFIGURATION
====================
*/
const BUCKET_URL = process.env.S3_PUBLIC_URL
const BUCKET_NAME = process.env.S3_BUCKET
const DATABASE_URL = process.env.DATABASE_URL
const S3_ENDPOINT = process.env.S3_ENDPOINT || ""
const S3_REGION = process.env.S3_REGION || ""
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ""
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ""

const pg = new SQL(process.env.DATABASE_URL || "");
const IS_LOCAL = process.env.NODE_ENV !== "production";
const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
  forcePathStyle: IS_LOCAL,
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json"
};


/* 
====================
  UTILS
====================
*/

const isAdmin = (req: BunRequest): boolean => {
  return true;
}

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
    // Actualización: Ya no se va a comprimir los pdfs, se suben tal cual. La función de compresión se mantiene para el thumbnail nomás.

    // Extraer la página 1 como PNG desde el PDF
    const extractedPngPath = await extractFirstPageAsPng(tempPdfPath, tempPngPath);

    // Comprimir PNG a menos de 250KB
    const finalPngPath = await compressImage(extractedPngPath, compressedPngPath, 250);

    const thumbKey = `proyectos/${projectId}/thumbnail/portada.png`;
    const pngBuffer = await Bun.file(finalPngPath).arrayBuffer();
    await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: thumbKey, Body: pngBuffer, ContentType: "image/png" }));
    thumbnail_url = `/${thumbKey}`;
    console.log(`✓ Imagen comprimida: ${finalPngPath}`);

    // Subir el PDF (comprimido o original)
    const progKey = `proyectos/${projectId}/programa/programa_mano.pdf`;
    const pdfBuffer = await Bun.file(tempPdfPath).arrayBuffer();
    await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: progKey, Body: pdfBuffer, ContentType: "application/pdf" }));
    programa_url = `/${progKey}`;

    // Limpiar archivos temporales
    try {
      const filesToClean = [tempPdfPath, extractedPngPath, compressedPngPath];
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

async function extractFirstPageAsPng(pdfPath: string, outputPath: string): Promise<string> {
  try {
    const pdfData = await Bun.file(pdfPath).arrayBuffer();

    const doc = mupdf.Document.openDocument(
      new Uint8Array(pdfData),
      "application/pdf"
    );

    const page = doc.loadPage(0); // Página 1 (índice 0)

    const pixmap = page.toPixmap(
      mupdf.Matrix.scale(1.5, 1.5),       // Escala para buena resolución
      mupdf.ColorSpace.DeviceRGB,
      false,                               // Sin canal alpha
      true                                 // Anti-aliasing
    );

    const pngData = pixmap.asPNG();
    await Bun.write(outputPath, pngData);

    console.log(`✓ Página 1 extraída como PNG: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error("⚠ Error al extraer la primera página del PDF", error);
    throw error;
  }
}

const validateMatriculaRoute = {
  GET: async (req: Request) => {
    const url = new URL(req.url);
    const matricula = url.pathname.split("/").pop()?.toLowerCase() || "";

    const rows = await pg`
      SELECT *
      FROM personas 
      WHERE LOWER(matricula) = ${matricula}
      OR LOWER(nomina) = ${matricula}
      OR LOWER(id) = ${matricula}
      LIMIT 1
    `;

    const isValid = rows.length > 0;

    return new Response(JSON.stringify({ valid: isValid }), {
      headers: corsHeaders,
      status: 200
    });
  }
};

/*
====================
  ROUTES
====================
*/

const artistRoutes = {
  OPTIONS: async (req: BunRequest) => {
    return new Response(null, { headers: corsHeaders, status: 204 });
  },
  
  GET: async (req: BunRequest) => {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const search = url.searchParams.get('search') || '';
    const nolimits = url.searchParams.get('nolimits') || 'false';

    const limit = 50;
    const offset = (parseInt(page) - 1) * limit;

    if(nolimits === 'true'){
      const rows = await pg`SELECT id,nombre FROM personas ORDER BY nombre ASC`;
      return new Response(JSON.stringify(rows), {
        headers: corsHeaders,
        status: 200
      });
    }

    if(search){
      const rows = await pg`
        SELECT * FROM personas
        WHERE LOWER(unaccent("nombre")) LIKE LOWER('%' || ${search} || '%')
        ORDER BY "nombre" ASC
        LIMIT ${limit} OFFSET ${offset}`;

      return new Response(JSON.stringify(rows), {
        headers: corsHeaders,
        status: 200
      });
    }

    const rows = await pg`SELECT * FROM personas ORDER BY nombre ASC LIMIT 50 OFFSET ${offset}`;
    return new Response(JSON.stringify(rows), {
      headers: corsHeaders,
      status: 200
    });
  },
  
  POST: async (req: BunRequest) => {
    console.log("Artist POST Received");
    if(!isAdmin(req)){
      return new Response(JSON.stringify({ error: "Falta de permisos" }), {
        headers: corsHeaders,
        status: 403
      });
    }
    console.log("Permissions check");
    const body:any = await req.json();
    const { nombre, matricula, creditos } : {nombre:String, matricula:String, creditos:String} = body;

    console.log("Received data to create artist:", body);

    if (!nombre) {
      return new Response(JSON.stringify({ error: "El nombre es requerido" }), {
        headers: corsHeaders,
        status: 400
      });
    }

    const matriculaValue = matricula === "" ? null : matricula;

    const result = await pg`
      INSERT INTO personas (nombre, matricula)
      VALUES (${nombre}, ${matriculaValue})
      RETURNING id, nombre, matricula, updated_at
    `;

    const newArtist = result[0];

    if (Array.isArray(creditos) && creditos.length > 0) {
      for (const [index, c] of creditos.entries()) {
        await pg`INSERT INTO creditos (proyecto_id, rol_id, persona_id, orden) VALUES (${c.proyecto_id}, ${c.rol_id}, ${newArtist.id}, ${index + 1})`;
      }
    }

    return new Response(JSON.stringify(newArtist), {
      headers: corsHeaders,
      status: 201
    });
  }
};

const companiesRoute = {
  GET: async (req: BunRequest) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    const rows: {id: string, tag: string, nombre: string, sede:string, disciplina:string, banner_url:string, created:string, updated:string }[] = await pg`
      SELECT * FROM grupos
      WHERE LOWER(unaccent("nombre")) LIKE LOWER('%' || ${search} || '%')
      ORDER BY "nombre" ASC`;
    
    // Transformamos la URL del banner a absoluta para el frontend
    const rowsConUrls = rows.map(c => ({
        ...c,
        banner_url: c.banner_url ? `${BUCKET_URL}${c.banner_url}` : null
    }));
    
    return new Response(JSON.stringify(rowsConUrls), {
      headers: corsHeaders,
      status: 200
    });
  },

  POST: async (req: BunRequest) => {
    if(!isAdmin(req)){
          return new Response(JSON.stringify({ error: "Falta de permisos" }), {
            headers: corsHeaders,
            status: 403
          });
        }
        
    try {
        // 1. Ahora leemos formData en lugar de JSON
        const formData = await req.formData();
        const nombre = formData.get('nombre') as string;
        const tag = formData.get('tag') as string;
        const disciplina = formData.get('disciplina') as string;
        const sede = formData.get('sede') as string;
        const descripcion = formData.get('descripcion') as string;
        const bannerFile = formData.get('banner') as File | null;

        if (!nombre || !disciplina || !tag) {
            return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), { status: 400 });
        }

        // 2. Insertamos primero para obtener el ID de la base de datos
        const result = await pg`
            INSERT INTO grupos (nombre, tag, disciplina, sede, descripcion)
            VALUES (${nombre}, ${tag}, ${disciplina}, ${sede}, ${descripcion})
            RETURNING id
        `;
        const newCompanyId = result[0].id;

        // 3. Si subieron un banner, lo guardamos en S3
        let bannerKey = null;
        if (bannerFile) {
            // Limpiamos el nombre y armamos la ruta: companias/{id}/banner_xxx.jpg
            const safeName = bannerFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
            bannerKey = `companias/${newCompanyId}/banner_${Date.now()}_${safeName}`;
            
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: bannerKey,
                Body: await bannerFile.arrayBuffer(),
                ContentType: bannerFile.type,
                ACL: "public-read" // Hacemos público el archivo automáticamente
            }));

            // Actualizamos el registro con la ruta relativa del banner
            await pg`UPDATE grupos SET banner_url = ${`/${bannerKey}`} WHERE id = ${newCompanyId}`;
        }

        return new Response(JSON.stringify({ success: true, id: newCompanyId }), { status: 201 });
    } catch (error) {
        console.error("Error creating company:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), { status: 500 });
    }
  }
};

const projectsRoute = {
  GET: async (req: BunRequest) => {
    const url = new URL(req.url);
    const page = url.searchParams.get('page') || '1';
    const search = url.searchParams.get('search') || '';
    const limit = 20; // Debe coincidir con el PAGE_SIZE del frontend
    const offset = (parseInt(page) - 1) * limit;

    let rows: {id: string, nombre: string, estreno: string, grupo_id: string, programa_url: string, thumbnail_url: string, youtube_url: string, company_name: string}[] = [];
    if(page == '-1'){
        rows = await pg`SELECT * FROM proyectos ORDER BY estreno DESC, id DESC`; // Sin paginación ni búsqueda
    } else if (search) {
      rows = await pg`
        SELECT p.id, p.nombre, p.estreno, p.grupo_id, p.programa_url, p.thumbnail_url, p.youtube_url, p.galeria_urls, 
               g.nombre AS company_name, g.disciplina
        FROM proyectos p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        WHERE LOWER(unaccent(p.nombre)) LIKE LOWER('%' || ${search} || '%')
        ORDER BY p.estreno DESC, p.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await pg`
        SELECT p.id, p.nombre, p.estreno, p.grupo_id, p.programa_url, p.thumbnail_url, p.youtube_url, p.galeria_urls, 
               g.nombre AS company_name, g.disciplina
        FROM proyectos p
        LEFT JOIN grupos g ON p.grupo_id = g.id
        ORDER BY p.estreno DESC, p.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const proyectosConUrls = rows.map(proyecto => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
      programa_url: proyecto.programa_url ? `${BUCKET_URL}${proyecto.programa_url}` : null,
    }));

    return new Response(
      JSON.stringify(proyectosConUrls),
      {
        headers: corsHeaders,
        status: 200
      });
  },

  POST: async (req: BunRequest) => {
    /*
    if(!isAdmin(req)){
          return new Response(JSON.stringify({ error: "Falta de permisos" }), {
            headers: corsHeaders,
            status: 403
          });
        }
        */
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

      return new Response(JSON.stringify({ success: true, id: newProjectId }), { headers: corsHeaders, status: 201 });
    } catch (error) {
      console.error("Error creating project:", error);
      return new Response(JSON.stringify({ error: "Error interno" }), { headers: corsHeaders, status: 500 });
    }
  }
};

// Detail routes

const artistDetailRoute = {
  OPTIONS: async (req: BunRequest) => {
    return new Response(null, { headers: corsHeaders, status: 204 });
  },
  
  GET: async (req: BunRequest) => {
    const { id } = req.params as { id: string };
    const rows = await pg`
      SELECT 
        pe.id AS id,
        pe.nombre AS nombre,
        pe.matricula,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'rol_id', r.id,
                'rol_nombre', r.nombre,
                'categoria_rol', r.categoria,
                'orden', c.orden,
                'proyecto', jsonb_build_object(
                  'id', p.id,
                  'nombre', p.nombre,
                  'estreno', p.estreno,
                  'thumbnail_url', p.thumbnail_url,
                  'company_name', g.nombre,
                  'disciplina', g.disciplina,
                  'company_tag', g.tag
                )
              ) ORDER BY p.estreno DESC
            )
            FROM creditos c
            JOIN proyectos p ON c.proyecto_id = p.id
            JOIN roles r ON c.rol_id = r.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE c.persona_id = pe.id
          ),
          '[]'::jsonb
        ) AS creditos
      FROM personas pe
      WHERE pe.id = ${id};
    `;

    // Transformamos las thumbnail_url a absolutas dentro de cada crédito
    rows[0].creditos = rows[0].creditos.map((credito: any) => ({
      ...credito,
      proyecto: {
        ...credito.proyecto,
        thumbnail_url: credito.proyecto.thumbnail_url 
          ? `${BUCKET_URL}${credito.proyecto.thumbnail_url}` 
          : null,
      }
    }));

    return new Response(JSON.stringify(rows[0]), {
      headers: corsHeaders,
      status: 200
    });
  },

  PUT: async (req: BunRequest) => {

    if(!isAdmin(req)){
      return new Response(JSON.stringify({ error: "Falta de permisos" }), {
        headers: corsHeaders,
        status: 403
      });
    }

    const { id } = req.params as { id: string };
    const body : any = await req.json();
    const { nombre, matricula, creditos } = body;

    console.log("Received data to update artist:", body);

    if (!nombre) {
      return new Response(JSON.stringify({ error: "El nombre es requerido" }), {
        headers: corsHeaders,
        status: 400
      });
    }

    const matriculaValue = matricula === "" ? null : matricula;

    await pg.begin(async (sql) => {
      await sql`
        UPDATE personas
        SET nombre = ${nombre}, matricula = ${matriculaValue}
        WHERE id = ${id}
      `;

      await sql`DELETE FROM creditos WHERE persona_id = ${id}`;

      if (Array.isArray(creditos) && creditos.length > 0) {
        for (const [index, c] of creditos.entries()) {
          await sql`INSERT INTO creditos (proyecto_id, rol_id, persona_id, orden) VALUES (${c.proyecto_id}, ${c.rol_id}, ${id}, ${index + 1})`;
        }
      }
    });

    const updatedArtist = await pg`
      SELECT id, nombre, matricula, updated_at FROM personas WHERE id = ${id}
    `;

    return new Response(JSON.stringify(updatedArtist[0]), {
      headers: corsHeaders,
      status: 200
    });
  },

  DELETE: async (req: BunRequest) => {
    
    if(!isAdmin(req)){
      return new Response(JSON.stringify({ error: "Falta de permisos" }), {
        headers: corsHeaders,
        status: 403
      });
    }

    const { id } = req.params as { id: string };
    console.log(`Iniciando eliminación del artista con ID ${id}...`);

    try {
      await pg.begin(async (sql) => {
        const result = await sql`DELETE FROM personas WHERE id = ${id} RETURNING id`;
      });

      return new Response(
        JSON.stringify({ success: true, message: "Artista eliminado correctamente" }),
        { status: 200, headers: corsHeaders }
      )
    } catch(error) {
      console.error(`❌ Error al eliminar el artista ${id}:`, error);
      return new Response(
        JSON.stringify({ error: "Error interno al eliminar el artista." }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

const companyDetailRoute = {
  OPTIONS: async (req: BunRequest) => {
    return new Response(null, { headers: corsHeaders, status: 204 });
  },
  
  GET: async (req: BunRequest) => {
    // Usamos 'id' como parámetro genérico, puede ser el ID real o el TAG
    const { id } = req.params as { id: string }; 
    
    const rows = await pg`
      SELECT g.*,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'nombre', p.nombre,
                'estreno', p.estreno,
                'programa_url', p.programa_url,
                'thumbnail_url', p.thumbnail_url
              ) ORDER BY p.estreno DESC
            )
            FROM proyectos p WHERE p.grupo_id = g.id
          ), '[]'::jsonb
        ) AS proyectos
      FROM grupos g
      WHERE g.tag = ${id} OR g.id = ${id}
      LIMIT 1;
    `;

    if (rows.length === 0) return new Response(JSON.stringify({ error: "Compañía no encontrada" }), { status: 404 });

    const company = rows[0];
    
    // Armar URLs absolutas
    company.banner_url = company.banner_url ? `${BUCKET_URL}${company.banner_url}` : null;
    company.proyectos = company.proyectos.map((proyecto: any) => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
      programa_url: proyecto.programa_url ? `${BUCKET_URL}${proyecto.programa_url}` : null,
    }));
    
    return new Response(JSON.stringify(company), { headers: corsHeaders, status: 200 });
  },

  PUT: async (req: BunRequest) => {
    const { id } = req.params as { id: string };
    
    try {
        // Obtenemos el ID real en caso de que el frontend nos haya mandado el 'tag' en la URL
        const companyCheck = await pg`SELECT id, banner_url FROM grupos WHERE id = ${id} OR tag = ${id} LIMIT 1`;
        if (companyCheck.length === 0) return new Response("Not found", { status: 404 });
        
        const dbId = companyCheck[0].id;
        const currentBanner = companyCheck[0].banner_url;

        const formData = await req.formData();
        const nombre = formData.get('nombre') as string;
        const tag = formData.get('tag') as string;
        const disciplina = formData.get('disciplina') as string;
        const sede = formData.get('sede') as string;
        const descripcion = formData.get('descripcion') as string;
        const bannerFile = formData.get('banner') as File | null;

        let newBannerUrl = currentBanner; // Mantenemos el viejo por defecto

        if (bannerFile) {
            const safeName = bannerFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const bannerKey = `companias/${dbId}/banner_${Date.now()}_${safeName}`;
            
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: bannerKey,
                Body: await bannerFile.arrayBuffer(),
                ContentType: bannerFile.type,
                ACL: "public-read"
            }));
            
            newBannerUrl = `/${bannerKey}`;
        }

        await pg`
            UPDATE grupos
            SET nombre = ${nombre},
                tag = ${tag},
                disciplina = ${disciplina},
                sede = ${sede},
                descripcion = ${descripcion},
                banner_url = ${newBannerUrl},
                updated_at = NOW()
            WHERE id = ${dbId}
        `;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error(`Error updating company ${id}:`, error);
        return new Response(JSON.stringify({ error: "Error interno" }), { status: 500 });
    }
  },

  DELETE: async (req: BunRequest) => {
    /*
    if(process.env.TRUST_CLIENT !== "true"){
      return new Response(JSON.stringify({ error: "Eliminación de compañías deshabilitada en producción" }), {
        headers: corsHeaders,
        status: 403
      });
    }
    */
    const { id } = req.params as { id: string };
    
    try {
      // 1. Verificar existencia y obtener ID real
      const companyCheck = await pg`SELECT id FROM grupos WHERE id = ${id} OR tag = ${id} LIMIT 1`;
      if (companyCheck.length === 0) return new Response("Not found", { status: 404 });
      const dbId = companyCheck[0].id;

      console.log(`Iniciando eliminación de la compañía ${dbId}...`);

      // 2. ELIMINAR ARCHIVOS EN S3 (TIGRIS / MINIO)
      // Buscamos cualquier foto/banner que esté dentro de la carpeta de esta compañía
      const prefix = `companias/${dbId}/`;
      
      const listedObjects = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix
      }));

      // Si hay archivos, los borramos en lote
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        await s3.send(new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
        }));
        console.log(`✅ Se eliminaron ${listedObjects.Contents.length} archivos de la compañía.`);
      }

      // 3. ELIMINAR DE LA BASE DE DATOS
      // Nota: Si tus proyectos tienen "ON DELETE CASCADE" en la base de datos, 
      // esto borrará también los proyectos. Si no lo tienen, Postgres bloqueará el borrado 
      // si la compañía aún tiene obras asignadas.
      await pg`DELETE FROM grupos WHERE id = ${dbId}`;

      return new Response(JSON.stringify({ success: true, message: "Compañía eliminada" }), { status: 200 });

    } catch (error) {
      console.error(`❌ Error al eliminar compañía ${id}:`, error);
      return new Response(JSON.stringify({ error: "No se pudo eliminar la compañía (Verifica que no tenga proyectos activos)" }), { status: 500 });
    }
  }
};

const projectDetailRoute = {
  OPTIONS: async (req: BunRequest) => {
    return new Response(null, { headers: corsHeaders, status: 204 });
  },
  
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
        status: 200,
        headers: corsHeaders
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
      console.log("A")

      // 2. Procesamos y subimos nuevos archivos (Si los hay)
      const { programa_url, thumbnail_url, galeria_urls } = await uploadProjectFiles(id, formData);
      console.log("B")

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
            const conId = creditos
                .filter((c: any) => c.id)
                .map((c: any, index: number) => ({
                    id: c.id,
                    proyecto_id: id,
                    rol_id: c.rol_id,
                    persona_id: c.persona_id,
                    orden: index + 1
                }));
        
            const sinId = creditos
                .filter((c: any) => !c.id)
                .map((c: any, index: number) => ({
                    proyecto_id: id,
                    rol_id: c.rol_id,
                    persona_id: c.persona_id,
                    orden: conId.length + index + 1
                }));
        
            if (conId.length > 0) {
                await sql`INSERT INTO creditos ${sql(conId)}`;
            }
            if (sinId.length > 0) {
                await sql`INSERT INTO creditos ${sql(sinId)}`;
            }
        }
      });

      return new Response(
        JSON.stringify({ success: true, message: "Actualizado correctamente." }),
        {
          headers: corsHeaders,
          status: 200
        }
      );

    } catch (error) {
      console.error(`Error al actualizar el proyecto ${id}:`, error);
      return new Response(JSON.stringify({ error: "Error interno al actualizar." }), { status: 500 });
    }
  },

  DELETE: async (req: BunRequest) => {
    /*
    if(process.env.TRUST_CLIENT !== "true"){
      return new Response(JSON.stringify({ error: "Eliminación de proyectos deshabilitada en producción" }), {
        headers: corsHeaders,
        status: 403
      });
    }
    */
    
    const { id } = req.params as { id: string };
    console.log(`Iniciando eliminación del proyecto ${id}...`);

    try {
      // 1. ELIMINAR ARCHIVOS EN S3 (TIGRIS / MINIO) PRIMERO
      // Buscamos todos los archivos que estén dentro de la "carpeta" del proyecto
      const prefix = `proyectos/${id}/`;
      
      const listedObjects = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix
      }));

      // Si encontramos archivos, los borramos en lote (Bulk Delete)
      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        const deleteParams = {
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
          }
        };

        await s3.send(new DeleteObjectsCommand(deleteParams));
        console.log(`✅ Se eliminaron ${listedObjects.Contents.length} archivos multimedia del bucket.`);
      } else {
        console.log(`ℹ️ No se encontraron archivos en el bucket para el proyecto ${id}.`);
      }

      // 2. ELIMINAR DATOS DE LA BASE DE DATOS
      // Usamos una transacción para borrar las dependencias primero
      await pg.begin(async (sql) => {
        // Borramos primero los créditos para evitar errores de llave foránea (Foreign Key Constraints)
        await sql`DELETE FROM creditos WHERE proyecto_id = ${id}`;
        
        // Finalmente, borramos el registro maestro del proyecto
        const result = await sql`DELETE FROM proyectos WHERE id = ${id} RETURNING id`;
        
        if (result.length === 0) {
          throw new Error("El proyecto no existía en la base de datos.");
        }
      });

      console.log(`✅ Proyecto ${id} eliminado completamente.`);
      
      return new Response(
        JSON.stringify({ success: true, message: "Proyecto y archivos eliminados correctamente." }), 
        { status: 200, headers: corsHeaders }
      );

    } catch (error) {
      console.error(`❌ Error al eliminar el proyecto ${id}:`, error);
      return new Response(
        JSON.stringify({ error: "Error interno al eliminar el proyecto." }), 
        { status: 500, headers: corsHeaders }
      );
    }
  }
};

// Utils routes

const rolesRoute = {
  GET: async (req: Request) => {
    const rows = await pg`SELECT * FROM roles ORDER BY categoria, nombre`;
    return new Response(JSON.stringify(rows), {
      headers: corsHeaders,
      status: 200
    });
  }
};

const healthRoute = async (req:BunRequest) => {
  return new Response(undefined, {
        status: 200,
        headers: corsHeaders
      });
}

const server = serve({
  routes: {
    // Open routes
    "/api/artists": artistRoutes,
    "/api/companies": companiesRoute,
    "/api/proyectos": projectsRoute,

    // Auth routes
    "/api/artists/:id": artistDetailRoute,
    "/api/companies/:id": companyDetailRoute,
    "/api/proyectos/:id": projectDetailRoute,

    // Util routes
    "/api/roles": rolesRoute,
    "/api/validate-matricula/:matricula": validateMatriculaRoute,
    "/api/health": healthRoute
  }
})

console.log(`🚀 Server running at ${server.url}`);