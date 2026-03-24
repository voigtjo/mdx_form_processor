import { config } from "dotenv";

config();

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  appName: process.env.APP_NAME ?? "Digitale Dokumentation und Nachweise",
  host: process.env.HOST ?? "127.0.0.1",
  port: toNumber(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL ?? "",
} as const;

