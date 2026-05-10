/**
 * Aplica `supabase/migrations/001_initial.sql` no Postgres do projeto Supabase.
 *
 * Requer no `.env.local`:
 * - NEXT_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co)
 * e uma das opções:
 * - DATABASE_URL (URI postgres direta), ou
 * - SUPABASE_DB_PASSWORD (senha em Database Settings → Database password)
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

/** Carrega chaves simples de um arquivo .env (sem expandir variáveis). */
function loadDotEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function projectRefFromSupabaseUrl(supabaseUrl) {
  try {
    const host = new URL(supabaseUrl).hostname;
    const match = host.match(/^([^.]+)\.supabase\.co$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function main() {
  const cwd = process.cwd();
  const envPath = path.resolve(cwd, ".env.local");
  const baseEnvPath = path.resolve(cwd, ".env");
  const env = { ...loadDotEnvFile(baseEnvPath), ...loadDotEnvFile(envPath) };

  const sqlPath = path.resolve(
    process.cwd(),
    "supabase/migrations/001_initial.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  const databaseUrl = env.DATABASE_URL?.trim();
  let client;

  if (databaseUrl) {
    client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    });
  } else {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const password = env.SUPABASE_DB_PASSWORD?.trim();

    if (!supabaseUrl || !password) {
      console.error(
        "Configure DATABASE_URL ou (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_DB_PASSWORD) em .env.local.",
      );
      process.exit(1);
    }

    const ref = projectRefFromSupabaseUrl(supabaseUrl);
    if (!ref) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL inválida (esperado host <ref>.supabase.co).",
      );
      process.exit(1);
    }

    client = new Client({
      host: `db.${ref}.supabase.co`,
      port: 5432,
      user: "postgres",
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
    });
  }

  await client.connect();

  try {
    await client.query(sql);
    console.log("Migration 001_initial.sql aplicada com sucesso.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
