# KITORA — Vercel + Neon

Loja responsiva de camisas de futebol feita com Next.js, TypeScript e Tailwind CSS. Inclui 18 produtos, busca, filtros, detalhes, guia de medidas, carrinho, checkout e rastreio persistente no Neon PostgreSQL.

## Rodar na IDE

Requisitos: Node.js 22 e pnpm.

1. Extraia o ZIP e abra a pasta no VS Code.
2. Copie `.env.example` para `.env.local`.
3. Crie um projeto no Neon e cole a string de conexão em `DATABASE_URL`.
4. Execute:

```bash
pnpm install
pnpm db:init
pnpm dev
```

Abra `http://localhost:3000`.

## Variável na Vercel

Em **Project > Settings > Environment Variables**, adicione:

| Chave | Valor |
|---|---|
| `DATABASE_URL` | A string de conexão PostgreSQL copiada do Neon. Exemplo: `postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require` |

Marque `Production`, `Preview` e `Development`, depois faça um novo deploy.

Não use prefixo `NEXT_PUBLIC_` na conexão do banco. Ela é secreta e somente as rotas do servidor devem acessá-la.

## Criar a tabela no Neon

Há duas opções:

- Rodar `pnpm db:init` com `DATABASE_URL` definida localmente; ou
- Abrir o SQL Editor do Neon e executar `database/schema.sql`.

## Publicar na Vercel

1. Envie esta pasta para um repositório GitHub.
2. Na Vercel, clique em **Add New > Project** e importe o repositório.
3. O framework será reconhecido como Next.js.
4. Cadastre `DATABASE_URL`.
5. Clique em **Deploy**.

## Onde editar

- Produtos, nomes e preços: `app/page.tsx`, constante `products`.
- Fotos: `public/products`.
- Banco: `database/schema.sql`.
- Checkout e rastreio: `app/api/orders/route.ts`.
- Cores e estilo global: `app/globals.css`.

## Antes de vender de verdade

O checkout atual registra pedidos, mas não cobra. Conecte um gateway como Mercado Pago, Stripe ou PagSeguro e valide o pagamento no servidor. O acompanhamento atual estima etapas por data e estado; para rastreio real, integre a API da transportadora ou do Melhor Envio.
