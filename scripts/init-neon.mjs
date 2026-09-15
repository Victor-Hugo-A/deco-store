import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

if(!process.env.DATABASE_URL){
  console.error("Defina DATABASE_URL antes de executar pnpm db:init");
  process.exit(1);
}

const sql=neon(process.env.DATABASE_URL);
const source=await readFile(new URL("../database/schema.sql",import.meta.url),"utf8");
for(const statement of source.split(";").map(value=>value.trim()).filter(Boolean))await sql.query(statement);
console.log("Banco Neon preparado com sucesso.");
