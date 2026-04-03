import path from "node:path";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import type { FastifyInstance } from "fastify";
import ejs from "ejs";

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, "src");

export const registerViewPlugins = async (app: FastifyInstance): Promise<void> => {
  await app.register(fastifyView, {
    engine: {
      ejs,
    },
    root: path.join(srcDir, "views"),
    layout: "layouts/main.ejs",
    includeViewExtension: true,
  });

  await app.register(fastifyStatic, {
    root: path.join(srcDir, "public"),
    prefix: "/public/",
  });

  await app.register(fastifyStatic, {
    root: path.join(projectRoot, "node_modules", "htmx.org", "dist"),
    prefix: "/public/vendor/htmx/",
    decorateReply: false,
  });
};
