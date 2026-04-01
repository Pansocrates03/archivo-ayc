import { pg } from "./services";

export const artistRoutes = {
  GET: async (req: Request) => {
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
  
  POST: async (req: Request) => {
    const body = await req.json();
    const { nombre, matricula } = body;

    console.log("Received data to create artist:", body);

    if (!nombre) {
      return new Response(JSON.stringify({ error: "El nombre es requerido" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    const result = await pg`
      INSERT INTO personas (nombre, matricula)
      VALUES (${nombre}, ${matricula})
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
  GET: async (req: Request) => {
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
    return new Response(JSON.stringify(rows[0]), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  }
};
