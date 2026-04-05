import { serve } from "bun";
import index from "./index.html";
import { artistRoutes, artistDetailRoute } from "./lib/api/artists";
import { companiesRoute, companyDetailRoute } from "./lib/api/companies";
import { projectsRoute, projectDetailRoute } from "./lib/api/projects";
import { rolesRoute } from "./lib/api/roles";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/artists": artistRoutes,
    "/api/artists/:id": artistDetailRoute,
    "/api/companies": companiesRoute,
    "/api/companies/:id": companyDetailRoute,
    "/api/proyectos": projectsRoute,
    "/api/proyectos/:id": projectDetailRoute,
    "/api/roles": rolesRoute,

    '/api/*': (req: Request) => {
      console.warn(`No API route matched for ${req.url}`);
      return new Response("Not found", { status: 404 });
    }
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
