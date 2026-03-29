import "dotenv/config";
import { createDatabaseClient } from "@handbook/db/client";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://handbook:handbook@127.0.0.1:54329/handbook";

const { client, db } = createDatabaseClient(databaseUrl);

export { client, db, databaseUrl };
