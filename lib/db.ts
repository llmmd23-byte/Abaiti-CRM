import "server-only";

import mysql, { type Pool } from "mysql2/promise";

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const globalForDb = globalThis as typeof globalThis & { middarDbPool?: Pool };

export const db =
  globalForDb.middarDbPool ??
  mysql.createPool({
    host: requiredEnv("DB_HOST"),
    port: Number(process.env.DB_PORT ?? 3306),
    database: requiredEnv("DB_NAME"),
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    charset: "utf8mb4_unicode_ci",
    timezone: "Z",
    connectionLimit: 1,
    maxIdle: 0,
    idleTimeout: 1000,
    enableKeepAlive: false,
    waitForConnections: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb.middarDbPool = db;
