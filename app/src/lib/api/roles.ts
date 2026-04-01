import { pg } from "./services";

export const rolesRoute = {
  GET: async (req: Request) => {
    const rows = await pg`SELECT * FROM roles ORDER BY categoria, nombre`;
    return new Response(JSON.stringify(rows), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  }
};
