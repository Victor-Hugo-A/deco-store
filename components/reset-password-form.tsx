"use client";

import { useState, type FormEvent } from "react";
import { accountError, authClient } from "@/lib/auth-client";
import { AccountMenu } from "./account-menu";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== form.get("confirmPassword")) { setError("As senhas precisam ser iguais."); return; }
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.resetPassword({ token, newPassword });
      if (result.error) { setError(accountError(result.error)); return; }
      window.history.replaceState(null, "", window.location.pathname);
      setSuccess(true);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally { setBusy(false); }
  }

  if (success) return <div className="mt-6 space-y-6"><p role="status" className="text-emerald-700">Senha atualizada! Entre novamente na sua conta.</p><AccountMenu label="Entrar na minha conta" /></div>;
  if (!token) return <div className="mt-6 space-y-6"><p role="alert" className="text-sm text-black/60">Este link é inválido ou expirou. Solicite um novo e-mail.</p><AccountMenu initialMode="recover" label="Solicitar novo link" /></div>;
  return <form onSubmit={submit} className="mt-6 space-y-4">
    <label className="block text-sm font-semibold">Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="input" placeholder="Pelo menos 8 caracteres" /></label>
    <label className="block text-sm font-semibold">Confirme a nova senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="input" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="w-full rounded-full bg-[#ff4d00] py-3.5 font-bold text-white disabled:opacity-50">{busy ? "Salvando…" : "Salvar nova senha"}</button>
    <AccountMenu initialMode="recover" label="Solicitar outro link" />
  </form>;
}
