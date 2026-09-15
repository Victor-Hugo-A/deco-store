import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(request: Request) {
  const path = new URL(request.url).pathname;
  const sendsEmail = ["/sign-up/email", "/send-verification-email", "/request-password-reset"].some((suffix) => path.endsWith(suffix));
  if (request.method === "POST" && sendsEmail && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
    return Response.json({ code: "EMAIL_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    console.error("account_auth_request_failed");
    return Response.json({ code: "AUTH_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = handler;
export const POST = handler;
