import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─── Singleton pattern ────────────────────────────────────────────────────────
//
// Em Next.js dev, o hot-reload reimporta módulos e criaria um novo pool a cada
// mudança de arquivo — esgotando as conexões do Supabase rapidamente.
// Guardamos a instância em `globalThis` para reutilizá-la entre reloads.
//
// Em produção (serverless / Vercel) `globalThis.__db` nunca persiste entre
// invocações diferentes, então sempre começa limpo — com `max: 2` por
// instância para não exceder o limite do plano.

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function createDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Verifique o arquivo .env.local");
  }

  const isPgBouncer =
    connectionString.includes("pgbouncer=true") ||
    connectionString.includes(":6543/");

  const client = postgres(connectionString, {
    prepare: !isPgBouncer, // PgBouncer não suporta prepared statements
    // Limita conexões por instância:
    // - dev: hot reload cria várias instâncias → 1 por módulo é o suficiente
    // - serverless: cada função tem sua própria instância → 2 é seguro e rápido
    max: isPgBouncer ? 10 : 2,
    idle_timeout: 20,   // fecha conexões ociosas depois de 20 s
    max_lifetime: 1800, // força reconexão após 30 min (evita conexões zumbis)
  });

  return drizzle(client, { schema });
}

// Em dev reutiliza o singleton; em prod sempre cria (globalThis não persiste)
export const db = globalThis.__db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
