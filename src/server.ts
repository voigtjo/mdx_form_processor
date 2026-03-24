import { env } from "./config/env.js";
import { buildApp } from "./app.js";

const start = async (): Promise<void> => {
  const app = await buildApp();

  try {
    await app.listen({
      port: env.port,
      host: env.host,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

void start();

