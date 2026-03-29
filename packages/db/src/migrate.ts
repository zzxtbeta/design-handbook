import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseClient } from "./client";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://handbook:handbook@127.0.0.1:54329/handbook";

const { client, db } = createDatabaseClient(databaseUrl);

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

try {
  await migrate(db, {
    migrationsFolder: path.resolve(currentDir, "../drizzle"),
  });
  console.log("[db] migrations applied");
} finally {
  await client.end();
}
