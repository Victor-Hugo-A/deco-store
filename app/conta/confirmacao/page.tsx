import type { Metadata } from "next";
import { Check, Mail } from "lucide-react";
import { AccountMenu } from "@/components/account-menu";

export const metadata: Metadata = { title: "Confirmação de e-mail | KITORA", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="grid min-h-screen place-items-center px-4 py-12">
    <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
      <a href="/" className="text-3xl font-black tracking-tight">KITORA<span className="text-[#ff4d00]">.</span></a>
      <div className={`mx-auto mt-8 grid size-16 place-items-center rounded-full ${error ? "bg-orange-50 text-[#ff4d00]" : "bg-emerald-50 text-emerald-700"}`}>{error ? <Mail size={30} /> : <Check size={30} />}</div>
      <h1 className="mt-5 text-2xl font-black">{error ? "Vamos confirmar seu e-mail?" : "E-mail confirmado!"}</h1>
      <p className="mt-3 text-sm leading-relaxed text-black/60">{error ? "Este link é inválido ou expirou. Solicite uma nova confirmação para acessar sua conta." : "Sua conta está pronta. Entre com seu e-mail e senha para continuar."}</p>
      <div className="mt-7 flex justify-center"><AccountMenu initialMode={error ? "verify" : "login"} label={error ? "Reenviar confirmação" : "Entrar na minha conta"} /></div>
      <a href="/" className="mt-6 inline-block text-sm text-black/55">Voltar para as camisas</a>
    </section>
  </main>;
}
