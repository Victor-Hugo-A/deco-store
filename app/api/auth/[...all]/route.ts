import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const path = new URL(request.url).pathname;

  const sendsEmail = [
    "/sign-up/email",
    "/send-verification-email",
    "/request-password-reset",
  ].some((suffix) => path.endsWith(suffix));

  // Rotas que enviam e-mail precisam dessas duas variáveis.
  if (
      request.method === "POST" &&
      sendsEmail &&
      (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
  ) {
    return Response.json(
        {
          code: "EMAIL_UNAVAILABLE",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        }
    );
  }

  try {
    const response = await getAuth().handler(request);

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("account_auth_request_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message:
          error instanceof Error
              ? error.message
              : "Unknown authentication error",
    });

    return Response.json(
        {
          code: "AUTH_UNAVAILABLE",
        },
        {
          status: 503,
          headers: {
            "Cache-Control": "no-store",
          },
        }
    );
  }
}

export const GET = handler;
export const POST = handler;