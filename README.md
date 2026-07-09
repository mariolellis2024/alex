# Alex — Automação de WhatsApp (Next.js + Prisma + Evolution API)

App de tracking, funis e disparo de mensagens via WhatsApp (Evolution API), com rastreamento de cliques e envio de eventos para o Meta CAPI.

**Stack:** Next.js 16 · Prisma 7 (PostgreSQL) · BullMQ (Redis) · Evolution API v2

---

## Rodando localmente (desenvolvimento)

Pré-requisitos: **Node.js 22+** e **Docker Desktop** (ou OrbStack) para subir Postgres e Redis.

```bash
# 1. Instalar dependências
npm install

# 2. Subir Postgres e Redis
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example .env   # os valores padrão já funcionam com o docker-compose

# 4. Criar as tabelas no banco
npx prisma db push

# 5. Rodar o app
npm run dev
```

Abra [http://localhost:3000/admin](http://localhost:3000/admin) — no primeiro acesso o wizard de setup cria o usuário administrador.

> Sem Docker na máquina? Aponte `DATABASE_URL` e `REDIS_URL` no `.env` para um Postgres/Redis remoto (pode ser o do próprio EasyPanel, expondo as portas temporariamente).

## Deploy no EasyPanel

A imagem Docker é buildada automaticamente pelo GitHub Actions a cada push na `main` e publicada em `ghcr.io/mariolellis2024/alex:main`.

1. Crie um projeto no EasyPanel (ex.: `alex`).
2. Use **Create from Schema** com o conteúdo de [easypanel-schema.json](easypanel-schema.json). Antes de colar, ajuste:
   - `api.SEUDOMINIO.com.br` → domínio real da Evolution API;
   - `alex.mariolellis.com` → domínio real do app;
   - `NEXTAUTH_SECRET` → uma chave aleatória longa (ex.: `openssl rand -hex 32`).
3. **Importante — hostnames internos:** dentro do EasyPanel, os serviços se enxergam pelo nome `<projeto>_<serviço>` (ex.: projeto `alex` → host `alex_app-postgres`). O schema usa a variável `$(PROJECT_NAME)` para isso. Se o EasyPanel **não** substituir `$(PROJECT_NAME)` ao colar o schema, troque manualmente pelo nome do projeto nas envs (`DATABASE_URL`, `REDIS_URL`, `EVOLUTION_URL`, `DATABASE_CONNECTION_URI`, `CACHE_REDIS_URI`).
   - Na dúvida, abra o serviço Postgres no EasyPanel → aba **Credentials** → copie a **Internal Connection URL** e use como `DATABASE_URL` (acrescente `?schema=public` no final).
4. O banco padrão criado pelo EasyPanel tem o **nome do projeto** (não `app_db`). A URL do schema já reflete isso.
5. Ao subir, o container roda `prisma db push` automaticamente (com até 12 tentativas enquanto o Postgres inicia) e depois inicia o Next.js. Acompanhe em **Logs** do serviço `app`.

### Checklist quando o deploy falhar

- **Logs do serviço `app`** mostram `Can't reach database server`? → `DATABASE_URL` com host errado (veja item 3 acima).
- **502 no domínio**? → confira se o domínio aponta para a porta `3000` do serviço `app`.
- **Imagem não atualiza**? → confira o build em GitHub Actions e clique em **Deploy** no EasyPanel para puxar a imagem nova (`ghcr.io/mariolellis2024/alex:main`).

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Postgres do app (`postgres://postgres:SENHA@HOST:5432/DB?schema=public`) |
| `REDIS_URL` | Redis das filas BullMQ (`redis://default:SENHA@HOST:6379`) |
| `EVOLUTION_URL` | URL interna da Evolution API (`http://<projeto>_evolution:8080`) |
| `EVOLUTION_API_KEY` | `AUTHENTICATION_API_KEY` configurada na Evolution API |
| `APP_URL` | URL pública do app (usada nos webhooks e links de rastreamento) |
| `NEXTAUTH_SECRET` | Chave de assinatura dos cookies de sessão — obrigatória em produção |

## Estrutura

- `src/app/admin` — painel administrativo (setup, login, dashboard)
- `src/app/actions` — server actions (conexões, proxies, pixels, funis, links)
- `src/app/api/webhooks` — webhooks da Evolution API e Kiwify
- `src/app/r/[codigo]` — redirecionador de links rastreáveis
- `src/workers` — workers BullMQ (motor de funis, health-check de proxies), carregados via `src/instrumentation.ts`
- `prisma/schema.prisma` — modelo de dados
