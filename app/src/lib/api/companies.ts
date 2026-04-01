import type { BunRequest } from "bun";
import { pg } from "./services";

const BUCKET_URL = process.env.S3_ENDPOINT + "/" + process.env.S3_BUCKET || "http://localhost:9000/actec-bucket";

export const companiesRoute = {
  GET: async (req: BunRequest) => {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';

    const rows = await pg`
      SELECT * FROM grupos
      WHERE LOWER(unaccent("nombre")) LIKE LOWER('%' || ${search} || '%')
      ORDER BY "nombre" ASC`;
    
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  },

  POST: async (req: BunRequest) => {
    const body = await req.json();
    const { nombre, descripcion, disciplina, banner_url } = body;
    console.log("Received data to create company:", body);

    if (!nombre || !disciplina) {
      return new Response(JSON.stringify({ error: "El nombre y la disciplina son requeridos" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    const result = await pg`
      INSERT INTO grupos (nombre, descripcion, disciplina, banner_url)
      VALUES (${nombre}, ${descripcion}, ${disciplina}, ${banner_url})
      RETURNING id, nombre, descripcion, disciplina, banner_url, created_at, updated_at
    `;

    const newCompany = result[0];

    return new Response(JSON.stringify(newCompany), {
      headers: { "Content-Type": "application/json" },
      status: 201
    });
  }
};

export const companyDetailRoute = {
  GET: async (req: BunRequest) => {
    const { tag } = req.params as { tag: string };
    console.log("Received request for company with tag:", tag);
    
    const rows = await pg`
      SELECT 
        g.id,
        g.nombre,
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
                'thumbnail_url', p.thumbnail_url,
                'youtube_url', p.youtube_url
              ) ORDER BY p.estreno DESC
            )
            FROM proyectos p
            WHERE p.grupo_id = g.id
          ), 
          '[]'::jsonb
        ) AS proyectos
      FROM grupos g
      WHERE g.tag = ${tag};
    `;

    rows[0].proyectos = rows[0].proyectos.map((proyecto: any) => ({
      ...proyecto,
      thumbnail_url: proyecto.thumbnail_url ? `${BUCKET_URL}${proyecto.thumbnail_url}` : null,
      programa_url: proyecto.programa_url ? `${BUCKET_URL}${proyecto.programa_url}` : null,
    }));
    
    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  }
};
