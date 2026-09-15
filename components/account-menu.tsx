"use client";

import {useEffect, useState, type FormEvent} from "react";
import {Check, CircleUserRound, LoaderCircle, LogOut, Mail, ShieldCheck} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {accountError, authClient} from "@/lib/auth-client";

type Mode = "login" | "signup" | "verify" | "recover";
const actionClass = "w-full rounded-full bg-[#ff4d00] px-5 py-3.5 font-bold text-white hover:bg-[#e84600] disabled:cursor-wait disabled:opacity-50";

export function AccountMenu({initialMode = "login", label}: { initialMode?: Mode; label?: string }) {
    const {data: session, isPending, error: sessionError, refetch} = authClient.useSession();
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>(initialMode);
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    function changeMode(next: Mode) {
        setMode(next);
        setError("");
        setNotice("");
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const normalizedEmail = email.trim().toLowerCase();
        const password = String(form.get("password") ?? "");
        const name = String(form.get("name") ?? "").trim();
        if (mode === "signup" && name.length < 2) {
            setError("Informe seu nome com pelo menos 2 caracteres.");
            return;
        }
        if (mode === "signup" && password !== form.get("confirmPassword")) {
            setError("As senhas precisam ser iguais.");
            return;
        }
        setBusy(true);
        setError("");
        setNotice("");
        try {
            if (mode === "login") {
                const result = await authClient.signIn.email({email: normalizedEmail, password});
                if (result.error) {
                    setError(accountError(result.error));
                    return;
                }
                await refetch();
            } else if (mode === "signup") {
                const result = await authClient.signUp.email({
                    name,
                    email: normalizedEmail,
                    password,
                    callbackURL: "/conta/confirmacao"
                });
                if (result.error) {
                    setError(accountError(result.error));
                    return;
                }
                setMode("verify");
                setCooldown(60);
                setNotice("Cadastro recebido! Confira sua caixa de entrada e o spam para confirmar seu e-mail. Se já tem uma conta, entre ou recupere sua senha.");
            } else if (mode === "verify") {
                const result = await authClient.sendVerificationEmail({
                    email: normalizedEmail,
                    callbackURL: "/conta/confirmacao"
                });
                if (result.error) {
                    setError(accountError(result.error));
                    return;
                }
                setCooldown(60);
                setNotice("Se houver uma conta aguardando confirmação, enviaremos um novo link. Confira também a pasta de spam.");
            } else {
                const result = await authClient.requestPasswordReset({
                    email: normalizedEmail,
                    redirectTo: "/conta/nova-senha"
                });
                if (result.error) {
                    setError(accountError(result.error));
                    return;
                }
                setCooldown(60);
                setNotice("Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha.");
            }
        } catch {
            setError("Não foi possível conectar. Confira sua conexão e tente novamente.");
        } finally {
            setBusy(false);
        }
    }

    async function signOut() {
        setBusy(true);
        setError("");
        try {
            const result = await authClient.signOut();
            if (result.error) {
                setError(accountError(result.error));
                return;
            }
            changeMode("login");
            await refetch();
        } catch {
            setError("Não foi possível sair. Tente novamente.");
        } finally {
            setBusy(false);
        }
    }

    const titles = {
        login: "BOM TER VOCÊ AQUI",
        signup: "FAÇA PARTE DO JOGO",
        verify: "CONFIRME SEU E-MAIL",
        recover: "RECUPERE SEU ACESSO"
    };
    const descriptions = {
        login: "Entre com o e-mail confirmado e a senha da sua conta.",
        signup: "Crie sua conta e confirme o e-mail para começar.",
        verify: "Abra o link enviado para seu e-mail. Ele é válido por 1 hora.",
        recover: "Enviaremos um link por e-mail para você criar uma nova senha.",
    };
    const submitLabel = {
        login: "Entrar",
        signup: "Criar minha conta",
        verify: "Reenviar confirmação",
        recover: "Enviar link de recuperação"
    };

    return <Dialog open={open} onOpenChange={(value) => {
        setOpen(value);
        if (value) {
            setError("");
            void refetch();
        }
    }}>
        <DialogTrigger asChild>
            <button type="button" aria-label={session ? `Minha conta: ${session.user.name}` : "Entrar ou criar conta"}
                    className="flex items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff4d00]">
                <CircleUserRound size={22} className={session ? "text-[#ff4d00]" : ""}/>
                {label ? <span className="font-bold">{label}</span> : session && <span
                    className="hidden max-w-24 truncate text-sm font-semibold lg:block">{session.user.name.split(" ")[0]}</span>}
            </button>
        </DialogTrigger>
        <DialogContent
            className="max-h-[92dvh] overflow-y-auto rounded-3xl border-0 bg-[#f5f4ef] p-6 sm:max-w-md sm:p-8">
            <div className="mb-1 grid size-12 place-items-center rounded-2xl bg-[#ff4d00]/10 text-[#ff4d00]">{session ?
                <ShieldCheck/> : <Mail/>}</div>
            <DialogHeader>
                <DialogTitle
                    className="text-2xl font-black tracking-tight">{session ? "SUA CONTA" : titles[mode]}</DialogTitle>
                <DialogDescription>{session ? "Seu espaço na KITORA. Futebol se veste." : descriptions[mode]}</DialogDescription>
            </DialogHeader>
            {isPending ? <div role="status" className="flex items-center gap-2 py-6 text-sm"><LoaderCircle
                className="animate-spin" size={18}/> Consultando sua conta…</div> : session ?
                <div className="space-y-5">
                    <div className="rounded-2xl bg-white p-5">
                        <p className="break-words text-xl font-bold">{session.user.name}</p>
                        <p className="mt-1 break-all text-sm text-black/60">{session.user.email}</p>
                        {session.user.emailVerified &&
                            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Check
                                size={16}/> E-mail confirmado</p>}
                    </div>
                    <button type="button" onClick={signOut} disabled={busy}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#151515] py-3.5 font-bold text-white disabled:opacity-50">
                        <LogOut size={18}/>{busy ? "Saindo…" : "Sair da conta"}</button>
                </div> : <>
                    {(mode === "login" || mode === "signup") &&
                        <div className="grid grid-cols-2 gap-1 rounded-full bg-black/5 p-1" aria-label="Acesso à conta">
                            {(["login", "signup"] as const).map((tab) => <button key={tab} type="button" disabled={busy}
                                                                                 aria-pressed={mode === tab}
                                                                                 onClick={() => changeMode(tab)}
                                                                                 className={`rounded-full px-4 py-2.5 text-sm font-bold ${mode === tab ? "bg-white shadow-sm" : "text-black/55"}`}>{tab === "login" ? "Entrar" : "Criar conta"}</button>)}
                        </div>}
                    {sessionError &&
                        <p role="status" className="text-sm text-black/60">Não foi possível consultar sua sessão. Você
                            pode tentar entrar novamente.</p>}
                    {notice && <div role="status"
                                    className="rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">{notice}</div>}
                    <form onSubmit={submit} className="space-y-4">
                        <fieldset disabled={busy} className="space-y-4">
                            {mode === "signup" &&
                                <label className="block text-sm font-semibold">Seu nome<input name="name"
                                                                                              autoComplete="name"
                                                                                              required minLength={2}
                                                                                              maxLength={150}
                                                                                              className="input"
                                                                                              placeholder="Como podemos chamar você?"/></label>}
                            <label className="block text-sm font-semibold">E-mail<input name="email" type="email"
                                                                                        autoComplete="email" required
                                                                                        maxLength={254} value={email}
                                                                                        onChange={(event) => setEmail(event.target.value)}
                                                                                        className="input"
                                                                                        placeholder="voce@email.com"/></label>
                            {(mode === "login" || mode === "signup") &&
                                <label className="block text-sm font-semibold">Senha<input name="password"
                                                                                           type="password"
                                                                                           autoComplete={mode === "signup" ? "new-password" : "current-password"}
                                                                                           required minLength={8}
                                                                                           maxLength={128}
                                                                                           className="input"
                                                                                           placeholder={mode === "signup" ? "Pelo menos 8 caracteres" : "Sua senha"}/></label>}
                            {mode === "signup" && <label className="block text-sm font-semibold">Confirme a senha<input
                                name="confirmPassword" type="password" autoComplete="new-password" required
                                minLength={8} maxLength={128} className="input" placeholder="Digite a senha novamente"/></label>}
                            <button type="submit"
                                    disabled={busy || ((mode === "verify" || mode === "recover") && cooldown > 0)}
                                    className={actionClass}>{busy ? "Aguarde…" : ((mode === "verify" || mode === "recover") && cooldown > 0) ? `Aguarde ${cooldown}s para reenviar` : submitLabel[mode]}</button>
                        </fieldset>
                    </form>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm font-semibold">
                        {mode === "login" &&
                            <button type="button" disabled={busy} onClick={() => changeMode("recover")}>Esqueci minha
                                senha</button>}
                        {(mode === "login" || mode === "signup") &&
                            <button type="button" disabled={busy} onClick={() => changeMode("verify")}
                                    className="text-[#c43b00]">Reenviar confirmação</button>}
                        {(mode === "verify" || mode === "recover") &&
                            <button type="button" disabled={busy} onClick={() => changeMode("login")}>Voltar para
                                entrar</button>}
                    </div>
                </>}
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </DialogContent>
    </Dialog>;
}
