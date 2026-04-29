import { pg } from "./services";

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
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  }
};

export { validateMatriculaRoute };