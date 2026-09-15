import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAccountAuth } from "../lib/auth-config";
import { sendAccountEmail } from "../lib/auth-email";
import * as schema from "../lib/auth-schema";

const database = new PGlite();
const sent: Array<{ to: string; url: string; kind: string }> = [];
const origin = "http://localhost:3000";
const auth = createAccountAuth({
  database: drizzleAdapter(drizzle(database, { schema }), { provider: "pg", schema, transaction: false }),
  baseURL: origin,
  secret: randomBytes(32).toString("hex"),
  sendEmail: async (message) => { sent.push(message); },
});

before(async () => { await database.exec(await readFile(new URL("../database/schema.sql", import.meta.url), "utf8")); });
after(async () => { await database.close(); });

function request(path: string, body?: object, cookie?: string, ip = "192.0.2.10", requestOrigin = origin) {
  return auth.handler(new Request(`${origin}/api/auth${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Origin: requestOrigin, "x-forwarded-for": ip, ...(cookie ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
}

test("cadastro exige confirmação; login, sessão, recuperação e logout funcionam", async () => {
  const credentials = { email: "torcedor@example.com", password: "Senha-de-teste-123" };
  const signup = await request("/sign-up/email", { ...credentials, name: "Torcedor KITORA", callbackURL: "/conta/confirmacao" });
  assert.equal(signup.status, 200, await signup.text());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].kind, "verification");
  assert.equal(signup.headers.get("set-cookie"), null, "Cadastro não pode criar sessão");
  const passwordRows = await database.query<{ password: string }>("SELECT password FROM auth_accounts");
  assert.notEqual(passwordRows.rows[0].password, credentials.password);
  const blocked = await request("/sign-in/email", credentials);
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).code, "EMAIL_NOT_VERIFIED");

  const verification = await auth.handler(new Request(sent[0].url));
  assert.equal(verification.status, 302);
  assert.equal(verification.headers.get("location"), "/conta/confirmacao");
  assert.equal(verification.headers.get("set-cookie"), null, "Confirmar não deve autenticar automaticamente");
  const wrong = await request("/sign-in/email", { ...credentials, password: "Outra-senha-123" });
  assert.equal(wrong.status, 401);
  const login = await request("/sign-in/email", credentials);
  assert.equal(login.status, 200, await login.text());
  const cookieHeader = login.headers.get("set-cookie")!;
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Lax/i);
  const cookie = cookieHeader.split(";")[0];
  const session = await request("/get-session", undefined, cookie);
  assert.equal((await session.json()).user.emailVerified, true);

  const recovery = await request("/request-password-reset", { email: credentials.email, redirectTo: "/conta/nova-senha" });
  assert.equal(recovery.status, 200);
  const resetEmail = sent.find((message) => message.kind === "reset")!;
  const resetRedirect = await auth.handler(new Request(resetEmail.url));
  const token = new URL(resetRedirect.headers.get("location")!, origin).searchParams.get("token");
  assert.ok(token);
  const newPassword = "Uma-nova-senha-456";
  const reset = await request("/reset-password", { token, newPassword });
  assert.equal(reset.status, 200, await reset.text());
  assert.equal(await (await request("/get-session", undefined, cookie)).json(), null, "Redefinição revoga sessões anteriores");
  const replay = await request("/reset-password", { token, newPassword: "Senha-invasora-789" });
  assert.notEqual(replay.status, 200, "Token de recuperação não pode ser reutilizado");
  const oldPasswordLogin = await request("/sign-in/email", credentials);
  assert.equal(oldPasswordLogin.status, 401);
  const newLogin = await request("/sign-in/email", { email: credentials.email, password: newPassword });
  assert.equal(newLogin.status, 200, await newLogin.text());
  const newCookie = newLogin.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await request("/sign-out", {}, newCookie)).status, 200);
  assert.equal(await (await request("/get-session", undefined, newCookie)).json(), null);
});

test("valida dados, rejeita origem externa e limita reenvios", async () => {
  const invalid = await request("/sign-up/email", { name: "Teste", email: "invalido", password: "123" }, undefined, "192.0.2.20");
  assert.equal(invalid.status, 400);
  const external = await request("/sign-in/email", { email: "torcedor@example.com", password: "irrelevante" }, undefined, "192.0.2.20", "https://externo.example");
  assert.equal(external.status, 403);
  const first = await request("/send-verification-email", { email: "ausente@example.com", callbackURL: "/conta/confirmacao" }, undefined, "192.0.2.30");
  assert.equal(first.status, 200);
  const limited = await request("/send-verification-email", { email: "ausente@example.com" }, undefined, "192.0.2.30");
  assert.equal(limited.status, 429);
  const invalidToken = await request("/verify-email?token=invalido&callbackURL=%2Fconta%2Fconfirmacao");
  assert.equal(invalidToken.status, 302);
  assert.match(invalidToken.headers.get("location")!, /error=/);
});

test("e-mail usa remetente configurado, texto alternativo e trata falha do provedor", async (context) => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  process.env.RESEND_API_KEY = "test-key";
  process.env.EMAIL_FROM = "KITORA <conta@example.com>";
  context.after(() => {
    if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = originalFrom;
  });
  context.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "https://api.resend.com/emails");
    const body = JSON.parse(String(options.body));
    assert.equal(body.from, "KITORA <conta@example.com>");
    assert.match(body.text, /O link expira em 1 hora/);
    assert.match(body.html, /&amp;/);
    return new Response(JSON.stringify({ id: "test-email" }));
  });
  await sendAccountEmail({ to: "torcedor@example.com", kind: "verification", url: `${origin}/verify?token=test&callbackURL=/` });
  context.mock.restoreAll();
  context.mock.method(globalThis, "fetch", async () => new Response("", { status: 403 }));
  await assert.rejects(() => sendAccountEmail({ to: "torcedor@example.com", kind: "reset", url: origin }), /ACCOUNT_EMAIL_DELIVERY_FAILED/);
  delete process.env.RESEND_API_KEY;
  await assert.rejects(() => sendAccountEmail({ to: "torcedor@example.com", kind: "verification", url: origin }), /ACCOUNT_EMAIL_NOT_CONFIGURED/);
});
