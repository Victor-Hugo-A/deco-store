import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAccountAuth } from "./auth-config";
import { sendAccountEmail } from "./auth-email";
import * as schema from "./auth-schema";

let auth: ReturnType<typeof createAccountAuth> | undefined;

// Lazy initialization allows the catalog to render without authentication secrets.
export function getAuth() {
  if (auth) return auth;
  const { DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL } = process.env;
  if (!DATABASE_URL || !BETTER_AUTH_SECRET || BETTER_AUTH_SECRET.length < 32 || !BETTER_AUTH_URL) {
    throw new Error("ACCOUNT_AUTH_NOT_CONFIGURED");
  }
  const url = new URL(BETTER_AUTH_URL);
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("ACCOUNT_AUTH_URL_INVALID");
  }
  const db = drizzle(neon(DATABASE_URL), { schema });
  auth = createAccountAuth({
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: false }),
    secret: BETTER_AUTH_SECRET,
    baseURL: url.origin,
    sendEmail: sendAccountEmail,
  });
  return auth;
}
