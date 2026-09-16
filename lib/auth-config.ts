import { betterAuth, type BetterAuthOptions } from "better-auth";
import type { sendAccountEmail } from "./auth-email";

type AccountAuthConfig = {
  database: BetterAuthOptions["database"];
  baseURL: string;
  secret: string;
  sendEmail: typeof sendAccountEmail;
};

export function createAccountAuth({ database, baseURL, secret, sendEmail }: AccountAuthConfig) {
  return betterAuth({
    appName: "DECO",
    database,
    baseURL,
    secret,
    trustedOrigins: [new URL(baseURL).origin],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 3600,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({ to: user.email, url, kind: "reset" });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      autoSignInAfterVerification: false,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({ to: user.email, url, kind: "verification" });
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      cookiePrefix: "deco",
      ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"] },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-up/email": { window: 60, max: 3 },
        "/sign-in/email": { window: 60, max: 5 },
        "/send-verification-email": { window: 60, max: 1 },
        "/request-password-reset": { window: 60, max: 1 },
        "/reset-password": { window: 60, max: 5 },
        "/get-session": false,
      },
    },
    onAPIError: { errorURL: "/conta/confirmacao" },
  });
}
