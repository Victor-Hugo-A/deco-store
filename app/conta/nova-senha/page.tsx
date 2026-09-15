import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Nova senha | KITORA", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <main className="grid min-h-screen place-items-center px-4 py-12">
    <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <a href="/" className="text-3xl font-black tracking-tight">KITORA<span className="text-[#ff4d00]">.</span></a>
      <h1 className="mt-8 text-2xl font-black">CRIE SUA NOVA SENHA</h1>
      <ResetPasswordForm token={!error && typeof token === "string" ? token : null} />
      <a href="/" className="mt-6 inline-block text-sm text-black/55">Voltar para as camisas</a>
    </section>
  </main>;
}
