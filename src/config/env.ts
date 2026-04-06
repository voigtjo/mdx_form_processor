import { config } from "dotenv";

const envFile = process.env.ENV_FILE?.trim() || ".env";

config({
  path: envFile,
});

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  envFile,
  appName: process.env.APP_NAME ?? "Handwerker Service und Nachweise",
  host: process.env.HOST ?? "127.0.0.1",
  port: toNumber(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  erpSimBaseUrl: process.env.ERP_SIM_BASE_URL ?? "http://localhost:3001",
} as const;
