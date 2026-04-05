import type { BunRequest, S3File } from "bun"; // o Request, dependiendo de tu router
import { pg } from "./services";
import { s3, write } from "bun"

import { S3Client } from "bun";

const IS_LOCAL = process.env.STORAGE_ENV === "local";
const BUCKET_URL = process.env.S3_PUBLIC_URL || "http://localhost:9000/actec-bucket";
const BUCKET_NAME = process.env.S3_BUCKET || "actec-bucket";

const BASE_URL = IS_LOCAL
  ? `${process.env.S3_ENDPOINT}/${BUCKET_NAME}` // MinIO
  : process.env.S3_ENDPOINT; // Tigris

function buildFilePath(key:string) {
  return IS_LOCAL ? `/${BUCKET_NAME}/${key}` : `/${key}`;
}

const client = new S3Client({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  bucket: process.env.S3_BUCKET,
  endpoint: process.env.S3_ENDPOINT,
  acl: "public-read",
});

//import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";



export const companiesRoute = {
  GET: async (req: BunRequest) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    const rows = await pg`
      SELECT * FROM grupos
      WHERE LOWER(unaccent("nombre")) LIKE LOWER('%' || ${search} || '%')
      ORDER BY "nombre" ASC`;
    
    // Transformamos la URL del banner a absoluta para el frontend
    const rowsConUrls = rows.map(c => ({
        ...c,
        banner_url: c.banner_url ? `${BUCKET_URL}${c.banner_url}` : null
    }));
    
    return new Response(JSON.stringify(rowsConUrls), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  },

  POST: async (req: BunRequest) => {
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

export const companyDetailRoute = {
  GET: async (req: BunRequest) => {
    // Usamos 'id' como parámetro genérico, puede ser el ID real o el TAG
    const { id } = req.params as { id: string }; 
    
    const rows = await pg`
      SELECT
        g.id,
        g.nombre,
        g.tag,
        g.descripcion,
        g.disciplina,
        g.banner_url,
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
    
    return new Response(JSON.stringify(company), { status: 200 });
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
            
            const s3file = client.file(buildFilePath(bannerKey));
            const bannerBuffer = await bannerFile.arrayBuffer();
            await s3file.write(bannerBuffer);

            /*
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: bannerKey,
                Body: await bannerFile.arrayBuffer(),
                ContentType: bannerFile.type,
                ACL: "public-read"
            }));
            */
            
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