"use client";

import Image from "next/image";
import type { FormEvent, MouseEvent, PointerEvent } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageIcon,
  Maximize2,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  Shirt,
  Sparkles,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AccountMenu } from "@/components/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { catalogCollections, catalogContact, type CatalogCollection } from "@/lib/catalog-data";

const sizes = ["P", "M", "G", "GG", "3G"];
const versions = [
  { id: "torcedor", label: "Torcedor", price: 160, description: "Versão padrão" },
  { id: "jogador", label: "Jogador", price: 200, description: "Versão jogador" },
  { id: "personalizada", label: "Personalizada", price: 220, description: "Nome atrás e todos os patrocinadores" },
];
const sizeGuide = [
  { size: "P", chest: "50 cm", length: "69 cm", height: "1,60 a 1,70 m" },
  { size: "M", chest: "52 cm", length: "71 cm", height: "1,68 a 1,78 m" },
  { size: "G", chest: "55 cm", length: "74 cm", height: "1,75 a 1,85 m" },
  { size: "GG", chest: "58 cm", length: "77 cm", height: "1,82 a 1,92 m" },
  { size: "3G", chest: "61 cm", length: "80 cm", height: "1,88 a 2,00 m" },
];

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function currentImage(collection: CatalogCollection, indexById: Record<string, number>) {
  return collection.images[indexById[collection.id] ?? 0] ?? collection.images[0];
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function versionById(id: string) {
  return versions.find((version) => version.id === id) ?? versions[0];
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.03 3.2A12.75 12.75 0 0 0 5.14 22.6L3.7 28.8l6.33-1.43A12.75 12.75 0 1 0 16.03 3.2Zm0 2.35a10.4 10.4 0 0 1 8.78 15.96 10.33 10.33 0 0 1-12.7 3.7l-.42-.2-3.75.85.86-3.65-.23-.43A10.4 10.4 0 0 1 16.03 5.55Zm-4.5 4.98c-.23 0-.6.08-.92.43-.31.35-1.2 1.17-1.2 2.86 0 1.68 1.24 3.3 1.4 3.53.17.23 2.39 3.82 5.92 5.2 2.93 1.16 3.54.93 4.18.87.64-.06 2.07-.85 2.36-1.66.29-.81.29-1.51.2-1.66-.08-.14-.31-.23-.66-.4-.35-.18-2.07-1.02-2.39-1.14-.32-.12-.55-.17-.78.18-.23.35-.9 1.13-1.1 1.36-.2.23-.4.26-.75.09-.35-.18-1.48-.55-2.82-1.74-1.04-.93-1.75-2.08-1.95-2.43-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.18-.78-1.88-1.07-2.57-.28-.68-.57-.59-.78-.6h-.6Z" />
    </svg>
  );
}

function buildWhatsappUrl(collection: CatalogCollection, imageIndex: number, size: string, versionId: string, customName: string) {
  const image = collection.images[imageIndex] ?? collection.images[0];
  const version = versionById(versionId);
  const text = [
    "Olá! Quero fazer uma encomenda pelo catálogo DECO.",
    `Time: ${collection.team}`,
    `Liga: ${collection.league}`,
    `Referência/foto: ${image.label}`,
    `Arquivo de referência: ${image.originalFile}`,
    `Versão: ${version.label}`,
    version.id === "personalizada" ? "Detalhe: nome atrás com todos os patrocinadores" : null,
    version.id === "personalizada" ? `Nome atrás: ${customName.trim() || "informar"}` : null,
    `Tamanho: ${size}`,
    `Valor: ${money(version.price)}`,
  ].filter(Boolean).join("\n");

  return `https://wa.me/${collection.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function CatalogStorefront() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogCollection | null>(null);
  const [imageIndexById, setImageIndexById] = useState<Record<string, number>>({});
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedVersion, setSelectedVersion] = useState("torcedor");
  const [customName, setCustomName] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(catalogCollections.map((item) => item.category)))],
    [],
  );

  const filtered = useMemo(() => {
    const term = normalizeSearch(query.trim());
    return catalogCollections.filter((item) => {
      const matchesCategory = category === "Todos" || item.category === category;
      const matchesQuery = !term || normalizeSearch(`${item.team} ${item.league}`).includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const totalImages = catalogCollections.reduce((sum, item) => sum + item.images.length, 0);
  const featured = catalogCollections.find((item) => item.team === "Flamengo") ?? catalogCollections[0];
  const secondary = catalogCollections.find((item) => item.team === "Real Madrid") ?? catalogCollections[1] ?? featured;
  const selectedImageIndex = selected ? imageIndexById[selected.id] ?? 0 : 0;
  const selectedVersionOption = versionById(selectedVersion);
  const orderStepVisuals = [
    { icon: Search, tone: "bg-orange-50 text-[#ff4d00] ring-orange-100" },
    { icon: MessageCircle, tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
    { icon: Shirt, tone: "bg-sky-50 text-sky-700 ring-sky-100" },
    { icon: CheckCircle2, tone: "bg-violet-50 text-violet-700 ring-violet-100" },
    { icon: PackageCheck, tone: "bg-stone-100 text-stone-700 ring-stone-200" },
  ];

  function moveImage(collection: CatalogCollection, direction: 1 | -1) {
    setImageIndexById((current) => {
      const active = current[collection.id] ?? 0;
      const next = (active + direction + collection.images.length) % collection.images.length;
      return { ...current, [collection.id]: next };
    });
  }

  function selectCollection(collection: CatalogCollection, index?: number) {
    if (typeof index === "number") {
      setImageIndexById((current) => ({ ...current, [collection.id]: index }));
    }
    setZoomed(false);
    setZoomOrigin("50% 50%");
    setSelected(collection);
  }

  function updateZoomOrigin(event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const safeX = Math.min(100, Math.max(0, x));
    const safeY = Math.min(100, Math.max(0, y));

    setZoomOrigin(`${safeX}% ${safeY}%`);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleOrderClick(event: MouseEvent<HTMLAnchorElement>) {
    if (session && !sessionPending) {
      return;
    }

    event.preventDefault();
    toast.warning("Entre na sua conta para fazer o pedido.", {
      description: sessionPending ? "Estamos confirmando sua sessão. Tente novamente em instantes." : "Depois do login, o WhatsApp do pedido será liberado.",
      duration: 4000,
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#151515]">
      <Toaster position="top-right" richColors duration={4000} />
      <div className="bg-[#141414] px-4 py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        SOMENTE POR ENCOMENDA · PRAZO INFORMADO NO CATÁLOGO: {catalogContact.leadTime}
      </div>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f5f4ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-5 px-4 sm:px-8">
          <button className="lg:hidden" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu />
          </button>
          <a href="#inicio" className="mr-3 flex items-center gap-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
            <BrandLogo />
          </a>
          <nav
            className={`${menuOpen ? "flex" : "hidden"} absolute left-0 top-full w-full flex-col gap-5 border-b bg-[#f5f4ef] p-5 font-semibold lg:static lg:flex lg:w-auto lg:flex-row lg:border-0 lg:bg-transparent lg:p-0`}
          >
            <a href="#catalogo">Catálogo</a>
            <a href="#como-pedir">Como pedir</a>
            <a href={`https://wa.me/${catalogContact.whatsapp}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </nav>
          <form
            onSubmit={submitSearch}
            className="ml-auto hidden min-w-52 max-w-sm flex-1 items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2.5 md:flex"
          >
            <button type="submit" aria-label="Buscar no catálogo" className="text-black/70 hover:text-[#ff4d00]">
              <Search size={18} />
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              enterKeyHint="search"
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Busque por time ou liga"
              aria-label="Buscar no catálogo"
            />
          </form>
          <a
            href={`https://wa.me/${catalogContact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 text-sm font-semibold sm:flex"
          >
            <MessageCircle size={20} /> {catalogContact.phone}
          </a>
          <AccountMenu />
        </div>
      </header>

      <main id="inicio">
        <section className="relative overflow-hidden bg-[#181818] text-white">
          <div className="mx-auto grid min-h-[540px] max-w-[1440px] items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,0.78fr)]">
            <div className="relative z-10 max-w-[700px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm">
                <Sparkles size={15} className="text-[#ff6b2c]" /> Catálogo real de encomendas
              </div>
              <h1 className="max-w-[700px] text-[clamp(3rem,5.8vw,6.25rem)] font-black leading-[.88] tracking-[-.03em]">
                CAMISAS
                <br />
                <span className="block max-w-[620px] text-[#ff4d00]">SOB ENCOMENDA</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70">
                Escolha a camisa pelo catálogo, selecione tamanho e versão, e envie o pedido direto pelo WhatsApp.
                Valores padrão por versão: torcedor, jogador ou personalizada.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#catalogo"
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff4d00] px-6 py-3.5 font-bold hover:bg-[#ff6324]"
                >
                  Ver catálogo <ArrowRight size={18} />
                </a>
                <a
                  href={`https://wa.me/${catalogContact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 font-bold hover:bg-white/10"
                >
                  <MessageCircle size={18} /> Chamar no WhatsApp
                </a>
              </div>
              <div className="mt-8 grid max-w-xl gap-3 text-sm text-white/65 sm:grid-cols-3">
                <span className="inline-flex items-center gap-2">
                  <Shirt size={17} /> {totalImages} fotos reais
                </span>
                <span className="inline-flex items-center gap-2">
                  <PackageCheck size={17} /> {catalogCollections.length} clubes
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={17} /> {catalogContact.leadTime}
                </span>
              </div>
            </div>
            <div className="relative mx-auto h-[390px] w-full max-w-[560px] sm:h-[470px]">
              <div className="group absolute left-[1%] top-[8%] h-[88%] w-[62%] rotate-[-7deg] overflow-hidden rounded-[1.5rem] shadow-2xl transition duration-300 hover:z-20 hover:-translate-y-3 hover:scale-[1.04] hover:shadow-[0_28px_70px_rgba(0,0,0,.48)]">
                <Image
                  src={featured.images[1]?.src ?? featured.images[0].src}
                  alt={featured.team}
                  fill
                  priority
                  sizes="(min-width: 1024px) 350px, 62vw"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <div className="group absolute right-0 top-[2%] h-[78%] w-[55%] rotate-[6deg] overflow-hidden rounded-[1.5rem] shadow-2xl transition duration-300 hover:z-20 hover:-translate-y-3 hover:scale-[1.04] hover:shadow-[0_28px_70px_rgba(0,0,0,.48)]">
                <Image
                  src={secondary.images[0].src}
                  alt={secondary.team}
                  fill
                  priority
                  sizes="(min-width: 1024px) 310px, 55vw"
                  className="object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute bottom-4 right-3 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#111]/90 px-4 py-3 text-white shadow-xl backdrop-blur">
                <span className="grid size-9 place-items-center rounded-full bg-[#ff4d00] text-xs font-black">R$</span>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Valor</span>
                  <strong className="text-sm">A partir de {money(160)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-pedir" className="scroll-mt-24 border-b border-black/10 bg-[#f1f0eb] px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-4 rounded-[1.75rem] border border-black/10 bg-white/90 p-4 shadow-sm sm:p-5 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
              <div className="rounded-[1.35rem] bg-[#faf7f1] p-5">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff4d00]">Como fazer seu pedido</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em] sm:text-4xl">Pedido simples, do catálogo ao WhatsApp.</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/60">
                  Abra a camisa, escolha tamanho e versão. O site monta a mensagem com as informações do pedido para você enviar e confirmar pelo atendimento.
                </p>
                <div className="mt-4 grid gap-2 text-xs font-bold text-black/70 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                    <Clock size={16} className="text-[#ff4d00]" /> Prazo: {catalogContact.leadTime}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
                    <MessageCircle size={16} className="text-[#ff4d00]" /> {catalogContact.phone}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {catalogContact.orderInstructions.map((step, index) => {
                  const visual = orderStepVisuals[index] ?? orderStepVisuals[0];
                  const Icon = visual.icon;

                  return (
                    <div key={step} className="relative rounded-[1.15rem] border border-black/10 bg-white p-3.5 shadow-sm">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`grid size-9 place-items-center rounded-xl ring-1 ${visual.tone}`}>
                          <Icon size={18} />
                        </span>
                        <span className="rounded-full bg-[#151515] px-2 py-0.5 text-[11px] font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-[13px] font-bold leading-snug text-[#151515]">{step}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="catalogo" className="scroll-mt-24 px-4 py-14 sm:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.18em] text-[#ff4d00]">Catálogo</p>
                <h2 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-6xl">Escolha pelas fotos reais.</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                      category === item ? "border-[#151515] bg-[#151515] text-white" : "border-black/15 bg-white hover:border-black"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submitSearch} className="mb-7 flex items-center rounded-xl border border-black/10 bg-white px-4 py-3 md:hidden">
              <button type="submit" aria-label="Buscar no catálogo" className="text-black/70 hover:text-[#ff4d00]">
                <Search size={18} />
              </button>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                enterKeyHint="search"
                className="ml-2 w-full bg-transparent outline-none"
                placeholder="Busque por time ou liga"
              />
            </form>

            {filtered.length ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((collection, collectionIndex) => {
                  const image = currentImage(collection, imageIndexById);
                  const activeIndex = imageIndexById[collection.id] ?? 0;

                  return (
                    <article
                      key={collection.id}
                      className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                      <div className="relative aspect-[4/3] bg-[#deddd7]">
                        <button
                          onClick={() => selectCollection(collection)}
                          className="relative block h-full w-full"
                          aria-label={`Abrir catálogo ${collection.team}`}
                        >
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            priority={collectionIndex < 3}
                            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition duration-500 group-hover:scale-110"
                          />
                        </button>
                        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide">
                          {collection.images.length} fotos
                        </span>
                        {collection.images.length > 1 && (
                          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
                            <button
                              onClick={() => moveImage(collection, -1)}
                              className="grid size-10 place-items-center rounded-full bg-white/95 shadow"
                              aria-label="Foto anterior"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold shadow">
                              {activeIndex + 1}/{collection.images.length}
                            </span>
                            <button
                              onClick={() => moveImage(collection, 1)}
                              className="grid size-10 place-items-center rounded-full bg-white/95 shadow"
                              aria-label="Próxima foto"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/45">{collection.league}</p>
                        <div className="mt-1 flex items-start justify-between gap-4">
                          <button onClick={() => selectCollection(collection)} className="text-left text-2xl font-black tracking-[-.03em]">
                            {collection.team}
                          </button>
                          <span className="rounded-full bg-[#fff1e9] px-3 py-1 text-xs font-bold text-[#d33f00]">
                            Encomenda
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-black/60">
                          <span className="flex items-center gap-2">
                            <ImageIcon size={16} /> Referência atual: {image.label}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock size={16} /> Prazo: {collection.leadTime}
                          </span>
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-3">
                          <strong>A partir de {money(160)}</strong>
                          <button
                            onClick={() => selectCollection(collection)}
                            className="rounded-full bg-[#151515] px-4 py-2 text-sm font-bold text-white"
                          >
                            Ver detalhes
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-black/20 bg-white p-12 text-center">
                <Search className="mx-auto mb-3 text-black/30" />
                <h3 className="text-xl font-bold">Nenhuma camisa encontrada</h3>
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("Todos");
                  }}
                  className="mt-3 text-sm font-bold text-[#ff4d00]"
                >
                  Limpar busca
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-[#1d1a17] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-[1.1fr_.95fr_.95fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
            <div className="text-2xl font-black tracking-[-.04em]">
              <BrandLogo />
            </div>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">
              Catálogo de camisas sob encomenda com fotos reais, escolha por referência e pedido enviado direto para o atendimento.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-white/70">
              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1">Fotos reais</span>
              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1">Sob encomenda</span>
              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1">DECO Store</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#ff8a55]">Atendimento</p>
            <h3 className="mt-1.5 text-lg font-black tracking-[-.02em]">Fale com o responsável</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Tire dúvidas, confirme a referência da camisa e finalize o pedido pelo WhatsApp.
            </p>
            <a
              href={`https://wa.me/${catalogContact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Chamar o responsável no WhatsApp"
              className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-[#25d366] px-4 py-2.5 text-sm font-black text-[#062b15] transition hover:-translate-y-0.5 hover:bg-[#38e178] hover:shadow-lg"
            >
              <WhatsappIcon className="size-5" />
              Chamar no WhatsApp
            </a>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5">
            <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#ff8a55]">Pedido</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-white/[.06] px-3 py-2.5">
                <Clock size={17} className="text-[#ff8a55]" />
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-[.12em] text-white/35">Prazo</span>
                  <strong className="text-sm">{catalogContact.leadTime}</strong>
                </div>
              </div>
              <div className="rounded-xl bg-white/[.06] px-3 py-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-[.12em] text-white/35">Valores</span>
                <div className="mt-1.5 grid gap-1 text-sm text-white/70">
                  {versions.map((version) => (
                    <span key={version.id} className="flex items-center justify-between gap-3">
                      <span>{version.label}</span>
                      <strong className="text-white">{money(version.price)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 flex max-w-[1440px] flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 DECO. Catálogo sob encomenda.</span>
          <span>Marcas pertencem aos seus respectivos proprietários.</span>
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(open) => {
        if (!open) {
          setZoomed(false);
          setZoomOrigin("50% 50%");
          setSelected(null);
        }
      }}>
        <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto border-0 p-0 sm:max-w-6xl">
          {selected && (
            <div className="grid md:grid-cols-[1.08fr_.92fr]">
              <div className="bg-[#deddd7] p-4">
                <div className="relative overflow-hidden rounded-2xl bg-white">
                  <button
                    type="button"
                    onClick={(event) => {
                      updateZoomOrigin(event);
                      setZoomed((value) => !value);
                    }}
                    onPointerMove={(event) => {
                      if (zoomed) {
                        updateZoomOrigin(event);
                      }
                    }}
                    className={`relative block aspect-[4/4.8] w-full overflow-hidden text-left ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                    style={{ touchAction: zoomed ? "none" : "manipulation" }}
                    aria-label={zoomed ? "Reduzir imagem" : "Ampliar imagem"}
                  >
                    <Image
                      src={selected.images[selectedImageIndex]?.src}
                      alt={selected.images[selectedImageIndex]?.alt}
                      fill
                      sizes="(min-width: 768px) 52vw, 100vw"
                      className={`object-cover transition duration-300 ${zoomed ? "scale-[2.15]" : "scale-100"}`}
                      style={{ transformOrigin: zoomOrigin }}
                    />
                    <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-[#151515] shadow">
                      <Maximize2 size={15} /> {zoomed ? "Reduzir" : "Zoom"}
                    </span>
                  </button>
                  {selected.images.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
                      <button
                        onClick={() => {
                          setZoomed(false);
                          setZoomOrigin("50% 50%");
                          moveImage(selected, -1);
                        }}
                        className="grid size-11 place-items-center rounded-full bg-white/95 shadow"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setZoomed(false);
                          setZoomOrigin("50% 50%");
                          moveImage(selected, 1);
                        }}
                        className="grid size-11 place-items-center rounded-full bg-white/95 shadow"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[.14em] text-black/45">Fotos da coleção</p>
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-black/60">
                      {selectedImageIndex + 1}/{selected.images.length}
                    </span>
                  </div>
                  <div className="thumb-grid-scroll grid max-h-[268px] grid-cols-5 gap-2 overflow-y-auto pr-2 sm:grid-cols-6">
                    {selected.images.map((image, index) => (
                      <button
                        key={image.src}
                        onClick={() => {
                          setZoomed(false);
                          setZoomOrigin("50% 50%");
                          setImageIndexById((current) => ({ ...current, [selected.id]: index }));
                        }}
                        className={`relative overflow-hidden rounded-xl border-2 bg-[#deddd7] ${
                          selectedImageIndex === index
                            ? "border-[#ff4d00]"
                            : "border-transparent hover:z-10 hover:-translate-y-1 hover:scale-110 hover:border-black/20 hover:shadow-xl"
                        }`}
                        aria-label={`Selecionar foto ${index + 1}`}
                      >
                        <span className="relative block aspect-square w-full">
                          <Image src={image.src} alt="" fill sizes="96px" className="object-cover" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-9">
                <DialogHeader>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#ff4d00]">{selected.league}</p>
                  <DialogTitle className="text-3xl font-black tracking-tight">{selected.team}</DialogTitle>
                  <DialogDescription className="text-base">
                    {selected.orderType}. Selecione a foto, tamanho e versão para enviar a referência correta.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-5 rounded-2xl bg-[#f1f0eb] p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#ff4d00]" />
                    <div>
                      <strong className="block text-sm">Valor: {money(selectedVersionOption.price)}</strong>
                      <span className="text-xs text-black/55">Preço padrão conforme a versão selecionada.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-sm font-bold">Referência selecionada</p>
                  <div className="rounded-xl border border-black/10 bg-white p-3 text-sm text-black/65">
                    {selected.images[selectedImageIndex]?.label}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span>Versão</span>
                    <span className="text-black/45">Valor padrão</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => setSelectedVersion(version.id)}
                        className={`rounded-xl border p-3 text-left ${
                          selectedVersion === version.id ? "border-[#151515] bg-[#151515] text-white" : "border-black/15 bg-white"
                        }`}
                      >
                        <span className="block text-sm font-black">{version.label}</span>
                        <span className={`mt-1 block text-xs ${selectedVersion === version.id ? "text-white/65" : "text-black/50"}`}>
                          {version.description}
                        </span>
                        <strong className="mt-2 block text-sm">{money(version.price)}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedVersion === "personalizada" && (
                  <label className="mt-4 block text-sm font-semibold">
                    Nome atrás
                    <input
                      value={customName}
                      onChange={(event) => setCustomName(event.target.value)}
                      className="input"
                      maxLength={24}
                      placeholder="Ex.: VICTOR"
                    />
                  </label>
                )}

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm font-bold">
                    <span>Tamanho</span>
                    <span className="text-black/45">P ao 3G</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-xl border py-3 font-bold ${
                          selectedSize === size ? "border-[#151515] bg-[#151515] text-white" : "border-black/15"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black">Guia de medidas</p>
                      <p className="mt-1 text-xs leading-relaxed text-black/55">
                        Medidas aproximadas da camisa aberta. Compare com uma camisa que veste bem antes de pedir.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff1e9] px-3 py-1 text-[11px] font-bold text-[#d33f00]">
                      Base
                    </span>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-black/45">
                        <tr className="border-b border-black/10">
                          <th className="py-2 font-bold">Tam.</th>
                          <th className="font-bold">Peito</th>
                          <th className="font-bold">Comp.</th>
                          <th className="font-bold">Altura</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeGuide.map((item) => (
                          <tr key={item.size} className="border-b border-black/10 last:border-0">
                            <td className="py-2 font-black">{item.size}</td>
                            <td>{item.chest}</td>
                            <td>{item.length}</td>
                            <td>{item.height}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <a
                  href={buildWhatsappUrl(selected, selectedImageIndex, selectedSize, selectedVersion, customName)}
                  onClick={handleOrderClick}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!session || sessionPending}
                  className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold text-white transition ${
                    session && !sessionPending
                      ? "bg-[#ff4d00] hover:bg-[#e84600]"
                      : "bg-[#151515] hover:bg-[#252525]"
                  }`}
                >
                  <MessageCircle size={19} /> {session && !sessionPending ? "Enviar pedido pelo WhatsApp" : "Entrar para enviar pedido"}
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
