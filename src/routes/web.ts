import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createBaseViewModel } from "../services/app-context.js";

type UserQuery = {
  user?: string;
};

const queryValue = (request: FastifyRequest): string | undefined => {
  const query = request.query as UserQuery;
  return query.user;
};

const renderPage = async (
  request: FastifyRequest,
  reply: FastifyReply,
  section: "workspace" | "templates" | "workflows" | "documents" | "admin",
  page: string,
  title: string,
) => {
  return reply.view(`pages/${page}.ejs`, {
    title,
    ...createBaseViewModel(section, queryValue(request)),
  });
};

export const registerWebRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/", async (request, reply) => {
    const user = queryValue(request);
    const suffix = user ? `?user=${encodeURIComponent(user)}` : "";
    return reply.redirect(`/workspace${suffix}`);
  });

  app.get("/health", async () => ({
    ok: true,
  }));

  app.get("/workspace", async (request, reply) => {
    return renderPage(request, reply, "workspace", "workspace", "My Workspace");
  });

  app.get("/templates", async (request, reply) => {
    return renderPage(request, reply, "templates", "templates", "Templates");
  });

  app.get("/workflows", async (request, reply) => {
    return renderPage(request, reply, "workflows", "workflows", "Workflows");
  });

  app.get("/documents", async (request, reply) => {
    return renderPage(request, reply, "documents", "documents", "Documents");
  });

  app.get("/admin", async (request, reply) => {
    return renderPage(request, reply, "admin", "admin", "Admin");
  });
};

