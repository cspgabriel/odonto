/**
 * CareNova – Data layer
 * All DB access goes through /lib/db/
 * Drizzle + Supabase PostgreSQL (DATABASE_URL = Supabase connection string)
 * Connection is created lazily so / and /login, /signup work without DATABASE_URL.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─── Connection validation ─────────────────────────────────────────────────

const rawConnectionString = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;

function normalizeConnectionString(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return url;
  }
}

const connectionString = normalizeConnectionString(rawConnectionString);

if (!connectionString && process.env.NODE_ENV === "production") {
  throw new Error("[CareNova DB] DATABASE_URL is not set in production");
}

// ─── Connection options ────────────────────────────────────────────────────
// CRITICAL: Use the transaction pooler URL (port 6543) in DATABASE_URL
// Direct connection (port 5432) exhausts Supabase free-tier limits fast
// Transaction pooler handles serverless/edge connection burstyness safely
//
// Example DATABASE_URL format:
// postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
//
// The `prepare: false` is REQUIRED when using pgBouncer/transaction pooler
// because prepared statements are not supported in transaction mode

const connectionOptions: postgres.Options<Record<string, never>> = {
  prepare: false,
  max: 15,
  idle_timeout: 20,
  connect_timeout: 15,
  onnotice: process.env.NODE_ENV === "development" ? undefined : () => {},
};

// ─── Singleton pattern (critical for Next.js dev HMR) ─────────────────────
// Without globalThis, each hot-reload creates a new postgres client
// and connection pool, rapidly exhausting the 20-connection Supabase limit
// causing queue timeouts on subsequent requests

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __carenova_db: DbInstance | undefined;
}

function createDb(): DbInstance {
  if (!connectionString) {
    return null as unknown as DbInstance;
  }
  const client = postgres(connectionString, connectionOptions);
  return drizzle(client, {
    schema,
    logger: process.env.CARENOVA_DEBUG === "1",
  });
}

// CRITICAL: globalThis singleton prevents connection exhaustion on HMR
// Without this: every file save = new connection pool = queue timeout = stuck
export const db = globalThis.__carenova_db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__carenova_db = db;
}

// Global unhandled rejection handler — development only
// Turns silent crashes into visible terminal errors
if (process.env.NODE_ENV === "development") {
  process.on("unhandledRejection", (reason, promise) => {
    console.error("\n🔴 [CareNova] UNHANDLED REJECTION");
    console.error("Promise:", promise);
    console.error("Reason:", reason);
    console.error("This means an async function threw without a .catch()");
    console.error("Find the fire-and-forget call causing this.\n");
  });

  process.on("uncaughtException", (error) => {
    console.error("\n🔴 [CareNova] UNCAUGHT EXCEPTION");
    console.error("Error:", error);
    console.error("This is a synchronous throw that was not caught.\n");
  });
}

export default db;
export * from "./schema";
