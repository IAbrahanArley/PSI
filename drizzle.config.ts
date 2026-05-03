import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env", quiet: true });
config({ path: ".env.local", quiet: true, override: true });

const databaseUrl = new URL(process.env.DATABASE_URL!);

if (
  databaseUrl.hostname.endsWith(".supabase.co") ||
  databaseUrl.hostname.endsWith(".supabase.com")
) {
  databaseUrl.searchParams.set("sslmode", "require");
  databaseUrl.searchParams.set("uselibpqcompat", "true");
}

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl.toString(),
  },
} satisfies Config;
