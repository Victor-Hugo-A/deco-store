"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImageIcon,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  Shirt,
  Sparkles,
} from "lucide-react";
import { Toaster } from "sonner";
import { AccountMenu } from "@/components/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { catalogCollections, catalogContact, type CatalogCollection } from "@/lib/catalog-data";

const sizes = ["P", "M", "G", "GG", "3G"];
const versions = ["Torcedor", "Jogador"];
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

function buildWhatsappUrl(collection: CatalogCollection, imageIndex: number, size: string, version: string) {
  const image = collection.images[imageIndex] ?? collection.images[0];
  const text = [
    "Olá! Quero fazer uma encomenda pelo catálogo DECO.",
    `Time: ${collection.team}`,
    `Liga: ${collection.league}`,
    `Referência/foto: ${image.label}`,
    `Arquivo de referência: ${image.originalFile}`,
    `Versão: ${version}`,
    `Tamanho: ${size}`,
    "Valor: consultar",
  ].join("\n");

  return `https://wa.me/${collection.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function CatalogStorefront() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogCollection | null>(null);
  const [imageIndexById, setImageIndexById] = useState<Record<string, number>>({});
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedVersion, setSelectedVersion] = useState("Torcedor");

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
    setSelected(collection);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[#151515]">
      <Toaster position="top-center" richColors />
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
                Valores aparecem como consulta quando não estão informados no material recebido.
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
              <div className="absolute left-[1%] top-[8%] h-[88%] w-[62%] rotate-[-7deg] overflow-hidden rounded-[1.5rem] shadow-2xl">
                <Image
                  src={featured.images[1]?.src ?? featured.images[0].src}
                  alt={featured.team}
                  fill
                  priority
                  sizes="(min-width: 1024px) 350px, 62vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute right-0 top-[2%] h-[78%] w-[55%] rotate-[6deg] overflow-hidden rounded-[1.5rem] shadow-2xl">
                <Image
                  src={secondary.images[0].src}
                  alt={secondary.team}
                  fill
                  priority
                  sizes="(min-width: 1024px) 310px, 55vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-4 right-3 inline-flex items-center gap-3 rounded-full border border-white/15 bg-[#111]/90 px-4 py-3 text-white shadow-xl backdrop-blur">
                <span className="grid size-9 place-items-center rounded-full bg-[#ff4d00] text-xs font-black">R$</span>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Valor</span>
                  <strong className="text-sm">Consultar no WhatsApp</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-pedir" className="border-b border-black/10 bg-white px-4 py-10 sm:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-[.85fr_1.15fr] md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#ff4d00]">Como fazer seu pedido</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.03em] sm:text-5xl">Escolha, envie e confirme.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {catalogContact.orderInstructions.map((step, index) => (
                <div key={step} className="rounded-2xl border border-black/10 bg-[#f5f4ef] p-4">
                  <span className="grid size-8 place-items-center rounded-full bg-[#151515] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="mt-3 text-sm font-semibold leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="catalogo" className="px-4 py-14 sm:px-8">
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
                    <article key={collection.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
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
                            className="object-cover"
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
                          <strong>{collection.priceLabel}</strong>
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

      <footer className="bg-[#111] px-4 py-12 text-white sm:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-3">
          <div>
            <div className="text-3xl font-black tracking-[-.04em]">
              <BrandLogo />
            </div>
            <p className="mt-3 max-w-sm text-sm text-white/55">
              Catálogo de camisas sob encomenda com fotos reais do material recebido.
            </p>
          </div>
          <div>
            <strong>ATENDIMENTO</strong>
            <p className="mt-3 text-sm text-white/55">
              WhatsApp: {catalogContact.phone}
              <br />
              Prazo informado: {catalogContact.leadTime}
            </p>
          </div>
          <div>
            <strong>VALORES</strong>
            <p className="mt-3 text-sm text-white/55">
              Quando o preço não consta no catálogo, o site mostra consulta via WhatsApp.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1440px] border-t border-white/10 pt-5 text-xs text-white/35">
          © 2026 DECO. Catálogo sob encomenda. Marcas pertencem aos seus respectivos proprietários.
        </div>
      </footer>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-0 p-0 sm:max-w-6xl">
          {selected && (
            <div className="grid md:grid-cols-[1.08fr_.92fr]">
              <div className="bg-[#deddd7] p-4">
                <div className="relative overflow-hidden rounded-2xl bg-white">
                  <div className="relative aspect-[4/4.8] w-full">
                    <Image
                      src={selected.images[selectedImageIndex]?.src}
                      alt={selected.images[selectedImageIndex]?.alt}
                      fill
                      sizes="(min-width: 768px) 52vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  {selected.images.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
                      <button
                        onClick={() => moveImage(selected, -1)}
                        className="grid size-11 place-items-center rounded-full bg-white/95 shadow"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => moveImage(selected, 1)}
                        className="grid size-11 place-items-center rounded-full bg-white/95 shadow"
                        aria-label="Próxima foto"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 grid max-h-40 grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-6">
                  {selected.images.map((image, index) => (
                    <button
                      key={image.src}
                      onClick={() => setImageIndexById((current) => ({ ...current, [selected.id]: index }))}
                      className={`overflow-hidden rounded-xl border-2 ${
                        selectedImageIndex === index ? "border-[#ff4d00]" : "border-transparent"
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
                      <strong className="block text-sm">Preço não informado no catálogo</strong>
                      <span className="text-xs text-black/55">O valor fica para confirmar pelo WhatsApp.</span>
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
                    <span className="text-black/45">Informe no pedido</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {versions.map((version) => (
                      <button
                        key={version}
                        onClick={() => setSelectedVersion(version)}
                        className={`rounded-xl border py-3 font-bold ${
                          selectedVersion === version ? "border-[#151515] bg-[#151515] text-white" : "border-black/15"
                        }`}
                      >
                        {version}
                      </button>
                    ))}
                  </div>
                </div>

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
                  href={buildWhatsappUrl(selected, selectedImageIndex, selectedSize, selectedVersion)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4d00] py-4 font-bold text-white hover:bg-[#e84600]"
                >
                  <MessageCircle size={19} /> Enviar pedido pelo WhatsApp
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
