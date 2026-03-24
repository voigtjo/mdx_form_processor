import Fastify from "fastify";
import { registerViewPlugins } from "./plugins/view.js";
import { registerWebRoutes } from "./routes/web.js";

export const buildApp = async () => {
  const app = Fastify({
    logger: true,
  });

  await registerViewPlugins(app);
  await registerWebRoutes(app);

  return app;
};

