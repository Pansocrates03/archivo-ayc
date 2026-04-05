import type { BunRequest } from "bun";
import { pg } from "./services";

export const artistRoutes = {
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    const rows = await pg`SELECT * FROM personas ORDER BY nombre ASC LIMIT 50 OFFSET ${offset}`;
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  },
  
  POST: async (req: BunRequest) => {
    const body = await req.json();
    const { nombre, matricula } = body;

    console.log("Received data to create artist:", body);

    if (!nombre) {
      return new Response(JSON.stringify({ error: "El nombre es requerido" }), {
        headers: { "Content-Type": "application/json" },
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
    return new Response(JSON.stringify(newArtist), {
      headers: { "Content-Type": "application/json" },
      status: 201
    });
  }
};

export const artistDetailRoute = {
  GET: async (req: BunRequest) => {
    const { id } = req.params as { id: string };
    console.log("Received request for artist with id:", id);
    const rows = await pg`
      SELECT 
        pe.id AS id,
        pe.nombre AS nombre,
        pe.matricula,
        COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'nombre', p.nombre,
                'estreno', p.estreno,
                'rol_desempeñado', r.nombre,
                'categoria_rol', r.categoria,
                'compania_nombre', g.nombre,
                'thumbnail_url', p.thumbnail_url
              ) ORDER BY p.estreno DESC
            )
            FROM creditos c
            JOIN proyectos p ON c.proyecto_id = p.id
            JOIN roles r ON c.rol_id = r.id
            LEFT JOIN grupos g ON p.grupo_id = g.id
            WHERE c.persona_id = pe.id
          ), 
          '[]'::jsonb
        ) AS trayectoria
      FROM personas pe
      WHERE pe.id = ${id};
    `;

    const BUCKET_URL = process.env.S3_PUBLIC_URL || "http://localhost:9000/actec-bucket";
    rows[0].trayectoria = rows[0].trayectoria.map((proyecto: any) => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
    }));

    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  },

  DELETE: async (req: BunRequest) => {
    const { id } = req.params as { id: string };
    console.log(`Iniciando eliminación del artista con ID ${id}...`);

    try {
      await pg.begin(async (sql) => {
        const result = await sql`DELETE FROM personas WHERE id = ${id} RETURNING id`;
      });

      return new Response(
        JSON.stringify({ success: true, message: "Artista eliminado correctamente" }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch(error) {
      console.error(`❌ Error al eliminar el artista ${id}:`, error);
      return new Response(
        JSON.stringify({ error: "Error interno al eliminar el artista." }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
