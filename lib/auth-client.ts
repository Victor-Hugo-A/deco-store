"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export function accountError(error: { code?: string; status?: number }) {
  if (error.status === 429) return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  const messages: Record<string, string> = {
    EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar. Você pode reenviar a confirmação abaixo.",
    INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
    USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail. Entre ou recupere sua senha.",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail. Entre ou recupere sua senha.",
    PASSWORD_TOO_SHORT: "A senha deve ter pelo menos 8 caracteres.",
    PASSWORD_TOO_LONG: "A senha deve ter no máximo 128 caracteres.",
    INVALID_EMAIL: "Informe um e-mail válido.",
    INVALID_TOKEN: "Este link é inválido ou expirou. Solicite um novo e-mail.",
    TOKEN_EXPIRED: "Este link expirou. Solicite um novo e-mail.",
    AUTH_UNAVAILABLE: "O acesso à conta está indisponível no momento. Tente novamente mais tarde.",
    EMAIL_UNAVAILABLE: "Não foi possível enviar o e-mail agora. Tente novamente mais tarde.",
  };
  return messages[error.code ?? ""] ?? "Não foi possível concluir. Tente novamente; se já se cadastrou, use Reenviar confirmação.";
}
