# DECO

> ⚽ **Vista o jogo.** Camisas para quem carrega o futebol no peito.

A DECO é uma loja virtual de camisas de futebol para quem busca modelos atuais, retrôs e versões de torcedor ou jogador. O app permite explorar as peças, consultar detalhes e medidas, escolher tamanhos, montar um carrinho e registrar um pedido com os dados de entrega.

A interface se adapta a celulares, tablets e computadores, com preços em reais e navegação em português.

**18 modelos** · **8 categorias** · **Do catálogo ao acompanhamento do pedido**

## O que você encontra no app

### 👕 Encontre seu próximo manto

O catálogo reúne 18 modelos, organizados nas categorias Brasileirão, Europa, Seleções, Retrô, Américas, Infantil, Treino e Feminina.

- Busca por nome da camisa, time ou categoria.
- Filtros por categoria, que podem ser combinados com a busca.
- Fotos ilustrativas, temporada, preços e destaques de produtos.
- Exibição do preço anterior nas peças com desconto.

### 📏 Escolha com as medidas em mãos

Ao abrir uma camisa, você encontra sua descrição, cor e características de tecido, acabamento e modelagem. Uma tabela apresenta medidas aproximadas de peito e comprimento, além de uma faixa de altura sugerida para ajudar na escolha.

Antes de adicionar a peça ao carrinho, é possível selecionar um dos tamanhos disponíveis na interface: P, M, G, GG ou 3G.

### 🛍️ Seu carrinho, suas escolhas

O carrinho reúne as peças escolhidas com foto, nome, tamanho, quantidade e valor. Você pode aumentar ou diminuir as quantidades e remover uma peça reduzindo sua quantidade a zero. O subtotal é atualizado conforme as alterações.

Os itens são salvos no próprio navegador para permitir que você retome sua seleção ao voltar ao site.

### 📋 Registre seu pedido

Na finalização, você informa nome, e-mail, telefone e endereço de entrega, incluindo CEP, estado, cidade e bairro. O app registra o pedido e apresenta uma confirmação com o destino e um código de acompanhamento.

Guarde esse código: ele permite consultar o pedido depois, pela opção **Rastrear pedido**.

### 👤 Sua conta DECO

O ícone de pessoa no cabeçalho abre as opções **Entrar** e **Criar conta**. No cadastro, você informa nome, e-mail e uma senha de pelo menos 8 caracteres.

- Um e-mail com o botão **Confirmar meu e-mail** é enviado para validar o endereço.
- O login só é liberado depois da confirmação; o link vale por 1 hora.
- Você pode reenviar a confirmação e recuperar uma senha esquecida por e-mail.
- Ao entrar, o menu mostra seu nome, e-mail confirmado e a opção de sair.

A sessão dura até 7 dias e é renovada durante o uso. A conta ainda não reúne um histórico de compras: o acompanhamento dos pedidos continua disponível pelo código.

### 📦 Acompanhe pelo código

A consulta pelo código mostra a cidade e o estado de destino, uma previsão de entrega e uma barra de progresso com quatro etapas:

1. Pedido confirmado.
2. Preparando o manto.
3. Em trânsito.
4. Saiu para entrega.

Os pedidos ficam armazenados em banco de dados e podem ser consultados novamente com o código recebido.

## Do primeiro clique ao pedido

1. Explore o catálogo ou busque a camisa que deseja.
2. Abra os detalhes, consulte as medidas e escolha o tamanho.
3. Adicione a peça ao carrinho e revise os itens e as quantidades.
4. Selecione **Finalizar pedido**, preencha os dados de entrega e confirme.
5. Guarde o código apresentado e use **Rastrear pedido** para consultar o acompanhamento.

## Sobre a versão atual

O catálogo, a seleção de tamanhos, o carrinho e o registro e a consulta de pedidos estão implementados. Algumas partes da experiência ainda são demonstrativas:

- **Pagamento:** a finalização registra o pedido, mas não realiza cobranças. Pix, cartão e parcelamento ainda não têm processamento integrado.
- **Entrega:** a previsão é estimada a partir do estado de destino. As etapas avançam conforme o tempo desde o registro do pedido, sem consultar uma transportadora.
- **Frete:** embora a interface mencione cálculo no checkout, a versão atual apresenta apenas o total dos produtos, sem calcular ou cobrar frete.

Assim, é possível percorrer a experiência de escolha e registro de um pedido, com pagamento e logística ainda em caráter demonstrativo.

## ⚙️ Configuração da conta e dos e-mails

O cadastro usa Better Auth, com dados no Neon e envio de e-mails pelo Resend. As mesmas cinco variáveis devem existir no `.env` local e nas configurações do projeto na Vercel:

| Variável | No `.env` local | Na Vercel |
| --- | --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL do Neon. | Conexão do banco destinado ao ambiente publicado. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | URL completa e definitiva do site, como `https://sua-loja.vercel.app` ou seu domínio próprio. Sem caminhos adicionais. |
| `BETTER_AUTH_SECRET` | Segredo aleatório de pelo menos 32 caracteres. | Outro segredo aleatório, fixo para esse ambiente. |
| `RESEND_API_KEY` | Chave de API criada no Resend com permissão para enviar e-mails. | Chave de envio do Resend para o ambiente publicado. |
| `EMAIL_FROM` | `"DECO <conta@seu-dominio.com.br>"` | `DECO <conta@seu-dominio.com.br>` — sem as aspas externas no painel. |

O arquivo [`.env.example`](.env.example) contém o modelo sem credenciais. Nenhuma dessas variáveis usa o prefixo `NEXT_PUBLIC_`. O `.env` fica fora do Git.

### Preparar o envio

1. No Resend, adicione um domínio que você controla e configure os registros DNS solicitados até ele ficar verificado.
2. Crie uma chave de API com permissão de envio e preencha `RESEND_API_KEY`.
3. Em `EMAIL_FROM`, use um endereço desse domínio verificado. A URL do site pode continuar sendo da Vercel; o domínio do remetente é uma configuração separada.
4. Para testes restritos à sua própria conta Resend, é possível usar `DECO <onboarding@resend.dev>`. Para enviar aos clientes, configure o domínio verificado. Veja as [restrições de envio do Resend](https://resend.com/docs/api-reference/errors).

### Preparar o banco e os ambientes

- Aplique [database/schema.sql](database/schema.sql) no SQL Editor do Neon. O arquivo cria as tabelas de contas, sessões, credenciais, verificações e limites de tentativas, preservando os pedidos existentes. O script `db:init` também aplica esse arquivo e carrega o `.env` automaticamente.
- Na Vercel, acesse **Project → Settings → Environment Variables**, adicione as cinco variáveis em **Production** e faça um novo deploy.
- Se usar **Preview**, configure as variáveis também nesse ambiente, com a URL exata que será acessada. Prefira banco e segredo separados para os testes. URLs diferentes exigem uma configuração correspondente de `BETTER_AUTH_URL`.
- Localmente, reinicie o app pela IDE depois de editar o `.env`. Se já houver `.env.local`, confira se ele não sobrescreve essas variáveis.

O segredo deve ser gerado com um gerador criptográfico, como um gerenciador de senhas. Não use senha pessoal nem publique esse valor. Alterá-lo invalida sessões e links assinados anteriormente.

### Conferir o funcionamento

Crie uma conta com um e-mail que você pode acessar, abra a mensagem, confirme o endereço e entre com sua senha. Antes da confirmação, o login deve ser bloqueado. Confira também **Reenviar confirmação**, **Esqueci minha senha** e **Sair da conta**.

Se a mensagem não chegar, verifique o spam e o painel de envios do Resend. Erros de envio podem indicar chave inválida ou remetente não autorizado; links apontando para o endereço errado indicam que `BETTER_AUTH_URL` precisa ser corrigida. Depois de um erro no envio inicial, use **Reenviar confirmação**.
