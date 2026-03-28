import fastifyFormbody from "@fastify/formbody";
import Fastify from "fastify";
import { registerViewPlugins } from "./plugins/view.js";
import { registerWebRoutes } from "./routes/web.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
    bodyLimit: 4 * 1024 * 1024,
  });

  app.addContentTypeParser(/^multipart\/form-data/i, { parseAs: "buffer" }, (_request, body, done) => {
    done(null, body);
  });

  await app.register(fastifyFormbody);
  await registerViewPlugins(app);
  await registerWebRoutes(app);

  return app;
};
