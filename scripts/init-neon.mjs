import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

if(!process.env.DATABASE_URL){
  console.error("Defina DATABASE_URL antes de executar pnpm db:init");
  process.exit(1);
}

const sql=neon(process.env.DATABASE_URL);
const source=await readFile(new URL("../database/schema.sql",import.meta.url),"utf8");
try {
  for (const statement of source.split(";").map(value => value.trim()).filter(Boolean)) {
    await sql.query(statement, [], { fetchOptions: { signal: AbortSignal.timeout(15_000) } });
  }
  console.log("Banco Neon preparado com sucesso.");
} catch {
  console.error("Não foi possível preparar o banco. Confira DATABASE_URL e o acesso de rede ao Neon.");
  process.exitCode = 1;
}
