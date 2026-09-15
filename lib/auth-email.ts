type AccountEmail = {
  to: string;
  url: string;
  kind: "verification" | "reset";
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export async function sendAccountEmail({ to, url, kind }: AccountEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("ACCOUNT_EMAIL_NOT_CONFIGURED");

  const verification = kind === "verification";
  const title = verification ? "Confirme seu e-mail na KITORA" : "Redefina sua senha na KITORA";
  const action = verification ? "Confirmar meu e-mail" : "Criar nova senha";
  const description = verification
    ? "Falta só confirmar seu e-mail para acessar sua conta."
    : "Recebemos uma solicitação para alterar a senha da sua conta.";
  const safeUrl = escapeHtml(url);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      from, to: [to], subject: title,
      text: `KITORA — Vista o jogo.\n\n${description}\n\n${action}: ${url}\n\nO link expira em 1 hora. Se você não fez essa solicitação, ignore este e-mail.`,
      html: `<div style="background:#f5f4ef;padding:32px 16px;font-family:Arial,sans-serif;color:#151515"><div style="max-width:480px;margin:auto;background:#fff;border-radius:20px;padding:32px"><p style="font-size:26px;font-weight:900;margin:0">KITORA<span style="color:#ff4d00">.</span></p><p style="color:#777;font-size:12px">VISTA O JOGO.</p><h1 style="font-size:24px;margin-top:32px">${title}</h1><p style="line-height:1.6">${description}</p><p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;background:#ff4d00;color:#fff;padding:15px 24px;border-radius:30px;text-decoration:none;font-weight:bold">${action}</a></p><p style="font-size:13px;color:#666;line-height:1.6">O link expira em 1 hora. Se você não fez essa solicitação, ignore este e-mail.</p><p style="font-size:12px;word-break:break-all;color:#777">Se o botão não abrir, copie este endereço:<br>${safeUrl}</p></div></div>`,
    }),
  });
  if (!response.ok) {
    // Do not expose recipient addresses, tokens or provider credentials in logs.
    console.error("account_email_failed", { status: response.status });
    throw new Error("ACCOUNT_EMAIL_DELIVERY_FAILED");
  }
}
