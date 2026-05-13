/**
 * Aplica um arquivo SQL em supabase/migrations/ no Postgres do Supabase.
 * Mesmas credenciais que scripts/run-initial-migration.cjs (DATABASE_URL ou URL + senha).
 *
 * Uso: node scripts/run-sql-migration.cjs 007_figurinha_tipo_selecao.sql
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

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
  const arg = process.argv[2];
  if (!arg?.trim()) {
    console.error(
      "Uso: node scripts/run-sql-migration.cjs <arquivo.sql em supabase/migrations/>",
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const sqlPath = path.resolve(cwd, "supabase", "migrations", path.basename(arg));
  if (!fs.existsSync(sqlPath)) {
    console.error(`Arquivo não encontrado: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, "utf8");

  const envPath = path.resolve(cwd, ".env.local");
  const baseEnvPath = path.resolve(cwd, ".env");
  const env = { ...loadDotEnvFile(baseEnvPath), ...loadDotEnvFile(envPath) };

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
    console.log(`OK: ${path.basename(sqlPath)} aplicado.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
