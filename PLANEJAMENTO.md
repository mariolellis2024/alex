# Planejamento — Sistema de Vendas via WhatsApp (Evolution API)

> Versão 1.0 — 09/07/2026
> Escopo deste documento: planejamento de arquitetura, instalação, módulos e roadmap.
> Os **tipos de nós do funil** serão detalhados em documento próprio após a implementação da base (conforme combinado).

---

## 1. Visão geral

Sistema self-hosted de vendas pelo WhatsApp (API não-oficial, via **Evolution API**), instalado pelo cliente no **EasyPanel** através de um JSON de schema. O cliente conecta até **20–30 números de WhatsApp**, cadastra **Pixel + token da API de Conversões da Meta**, recebe **vendas da Kiwify via webhook** e monta **funis de mensagens visuais com React Flow**.

Fluxo de negócio principal:

```
Anúncio → Página de captura → Clique no botão (wa.me com código de rastreio)
       → Lead cai no WhatsApp → Funil dispara (cards/nós)
       → Kiwify notifica venda via webhook
       → Sistema envia evento Purchase para a Meta (Pixel + CAPI)
```

---

## 2. Decisões de arquitetura

| Decisão | Escolha | Motivo |
|---|---|---|
| Gateway WhatsApp | Evolution API v2 (Baileys) | Multi-instância, webhook nativo, suporte a proxy por instância |
| App principal | **Next.js (App Router) full-stack** em um único container | 1 serviço só no EasyPanel = instalação mais simples pro cliente |
| ORM | Prisma + PostgreSQL | Migrations automáticas no boot (`prisma migrate deploy`) |
| Filas / agendamento | **BullMQ + Redis** | Delays entre mensagens, retries, rate-limit por número |
| Builder de funil | React Flow (`@xyflow/react`) | Requisito do projeto |
| Deploy | Imagem Docker publicada no GHCR via GitHub Actions | O JSON do EasyPanel só referencia a imagem |
| Autenticação | Login simples (e-mail/senha, single-tenant por instalação) | Cada cliente tem a própria instalação |

### Diagrama de serviços

```
┌─────────────────────────── EasyPanel (1 projeto) ───────────────────────────┐
│                                                                              │
│  ┌────────────┐   ┌──────────────┐   ┌───────────┐                          │
│  │  APP        │──▶│ app-postgres │   │ app-redis │◀─ BullMQ (filas)         │
│  │ (Next.js)   │   └──────────────┘   └───────────┘                          │
│  │  UI + API   │                                                             │
│  │  + Workers  │──────────────┐                                              │
│  └─────▲───────┘              ▼                                              │
│        │ webhooks      ┌──────────────┐   ┌──────────────┐  ┌────────────┐  │
│        └───────────────│ Evolution API│──▶│ evo-postgres │  │ evo-redis  │  │
│                        └──────┬───────┘   └──────────────┘  └────────────┘  │
│                               │ proxy por instância                          │
└───────────────────────────────┼──────────────────────────────────────────────┘
                                ▼
                     Proxies (1 por número) ──▶ WhatsApp
Entradas externas: Kiwify (webhook de vendas) → APP
Saídas externas:   Meta CAPI (Purchase/Lead) ← APP
```

**6 serviços no schema:** `app`, `app-postgres`, `app-redis`, `evolution`, `evo-postgres`, `evo-redis`.

---

## 3. Instalação (GitHub → Docker → EasyPanel)

### 3.1 Pipeline de entrega

1. Repositório no GitHub (monorepo simples).
2. GitHub Actions builda a imagem e publica em `ghcr.io/<org>/<app>:latest` (+ tags de versão).
3. Entregamos ao cliente **um único JSON** ("Create from Schema" no EasyPanel).
4. No primeiro boot, o app roda migrations, cria o usuário admin e configura a Evolution API (webhook global apontando pra si mesmo).

### 3.2 Esqueleto do JSON do EasyPanel

```json
{
  "services": [
    {
      "type": "postgres",
      "data": { "serviceName": "app-postgres", "image": "postgres:16", "password": "$(password)" }
    },
    {
      "type": "redis",
      "data": { "serviceName": "app-redis", "image": "redis:7", "password": "$(password)" }
    },
    {
      "type": "postgres",
      "data": { "serviceName": "evo-postgres", "image": "postgres:16", "password": "$(password)" }
    },
    {
      "type": "redis",
      "data": { "serviceName": "evo-redis", "image": "redis:7", "password": "$(password)" }
    },
    {
      "type": "app",
      "data": {
        "serviceName": "evolution",
        "source": { "type": "image", "image": "atendai/evolution-api:latest" },
        "env": "AUTHENTICATION_API_KEY=$(password)\nDATABASE_ENABLED=true\nDATABASE_PROVIDER=postgresql\nDATABASE_CONNECTION_URI=postgres://postgres:...@evo-postgres:5432/evolution\nCACHE_REDIS_ENABLED=true\nCACHE_REDIS_URI=redis://default:...@evo-redis:6379",
        "domains": [{ "host": "$(EASYPANEL_DOMAIN)", "port": 8080 }]
      }
    },
    {
      "type": "app",
      "data": {
        "serviceName": "app",
        "source": { "type": "image", "image": "ghcr.io/SUA_ORG/SEU_APP:latest" },
        "env": "DATABASE_URL=...\nREDIS_URL=...\nEVOLUTION_URL=http://evolution:8080\nEVOLUTION_API_KEY=...\nAPP_URL=https://$(EASYPANEL_DOMAIN)",
        "domains": [{ "host": "$(EASYPANEL_DOMAIN)", "port": 3000 }]
      }
    }
  ]
}
```

> Nota de implementação: validar no EasyPanel real a sintaxe de variáveis geradas (`$(password)`) e a referência cruzada de senhas entre serviços — isso será o primeiro teste da Fase 1. Comunicação interna entre serviços usa o nome do serviço como hostname (`http://evolution:8080`), sem sair pra internet.

### 3.3 Setup wizard (primeiro acesso)

Tela de onboarding que valida em sequência: conexão com Evolution API → cria usuário admin → pede domínio público (para webhooks da Kiwify e links de rastreio) → pronto.

---

## 4. Módulos do sistema

### 4.1 Conexões (números de WhatsApp)

- CRUD de conexões; cada conexão = 1 instância na Evolution API.
- Pareamento por **QR Code** (streaming do QR via polling/SSE) ou código de pareamento.
- Status em tempo real (conectado, desconectado, banido) via webhook `CONNECTION_UPDATE`.
- Campos por conexão: nome interno, número, **proxy atribuído**, limites diários, estado de aquecimento.
- Suporte a 20–30 conexões simultâneas por instalação.

### 4.2 Proxies (requisito fundamental) — leitura realista

A Evolution API suporta proxy **por instância** (endpoint `/proxy/set/{instance}`, HTTP/SOCKS5 com autenticação). A arquitetura terá um **pool de proxies**: o cliente cadastra N proxies e o sistema atribui 1 proxy fixo por número (proxy "grudado" no chip — trocar proxy de um número conectado aumenta risco de ban).

**Sobre proxy gratuito, sendo direto:** proxies gratuitos são o pior cenário possível para WhatsApp não-oficial. São IPs de datacenter compartilhados por milhares de bots, com reputação queimada — usar eles **aumenta** a chance de banimento em vez de diminuir, além de caírem o tempo todo (derrubando a sessão do WhatsApp, o que também sinaliza comportamento suspeito). Recomendação em ordem:

1. **Proxy móvel/residencial pago barato** (~US$ 1–4/número/mês em provedores como Proxy-Cheap, IPRoyal, Soax, DataImpulse) — é o padrão do mercado de disparo. Para 20–30 números o custo é pequeno perto do faturamento que o funil gera.
2. **Sem proxy** para operações pequenas com números aquecidos — muitas operações rodam assim; o IP do servidor é um risco só quando há volume alto saindo de muitos números do mesmo IP.
3. Proxy gratuito: **não recomendado**; o sistema aceitará cadastrar (campo é livre), mas a UI exibirá aviso de risco.

O produto então entrega: pool de proxies (CRUD), teste de saúde do proxy (latência/conectividade), atribuição automática 1:1, alerta quando proxy cai.

### 4.3 Pixel + API de Conversões (Meta CAPI)

- Cadastro de **Pixel ID + Access Token** (múltiplos pixels permitidos, 1 por produto/funil).
- Envio server-side de eventos via Graph API (`/{pixel_id}/events`):
  - `Lead` / `Contact` — quando o lead chega no WhatsApp pelo link rastreado;
  - `InitiateCheckout` — quando o funil envia o link de checkout;
  - `Purchase` — quando a Kiwify confirma a venda (com `value` e `currency`).
- **Rastreio de atribuição:** o botão da página aponta para `https://app-do-cliente/r/{codigo}` → nosso redirect captura `fbclid`, `fbp/fbc`, UTMs e IP/user-agent → redireciona pra `wa.me/{numero}?text={msg com código}` → quando a mensagem chega com o código, casamos o lead com o clique. Isso dá qualidade de correspondência alta no CAPI.
- Deduplicação com o pixel do navegador via `event_id`.
- Log de eventos enviados + erros (tela de diagnóstico).

### 4.4 Webhooks Kiwify

- URL única por instalação: `https://app-do-cliente/api/webhooks/kiwify/{token}`.
- Validação de assinatura (query `signature`, HMAC-SHA1 com o token da Kiwify).
- Eventos tratados: **compra aprovada**, **pix gerado**, **boleto gerado**, **carrinho abandonado**, **compra recusada**, **reembolso/chargeback**, **assinatura cancelada/atrasada**.
- Cada evento pode: (a) disparar/mover o lead em um funil (ex.: funil de recuperação de pix), (b) disparar evento CAPI, (c) marcar o lead como cliente.
- **Casamento lead ↔ venda:** por telefone normalizado (E.164, tratando o 9º dígito BR) com fallback por e-mail.
- Tabela de logs de webhook com payload bruto e status de processamento (reprocessável).

### 4.5 Funis (React Flow)

- CRUD de funis; canvas React Flow com nós (cards) e arestas.
- Estrutura persistida: `nodes[]` + `edges[]` (JSONB no Postgres) + versão publicada vs. rascunho.
- **Gatilhos de entrada** do funil (o "primeiro item"):
  1. Clique no botão da página (link rastreado → primeira mensagem do lead com código);
  2. Evento Kiwify (ex.: pix gerado → funil de recuperação);
  3. Entrada manual / palavra-chave recebida.
- **Engine de execução** (separada do editor): cada lead ativo em um funil tem um "cursor" apontando pro nó atual; workers BullMQ processam os passos (enviar mensagem, esperar X tempo, esperar resposta, ramificar). O estado sobrevive a restart (persistido no Postgres, jobs atrasados no Redis).
- Distribuição de leads entre os 20–30 números: **round-robin ponderado** respeitando limite diário e estado de aquecimento de cada número; lead fica grudado no número que o atendeu (conversa contínua).
- *Tipos de nós: documento separado, próxima etapa — mas a engine já nasce genérica (nó = `{type, config}`), então adicionar tipos novos não muda a arquitetura.*

### 4.6 Anti-ban (transversal, tão importante quanto o proxy)

- **Aquecimento:** número novo começa com limite baixo (ex.: 20 msgs/dia) subindo automaticamente ao longo de 2–4 semanas.
- Delays randomizados entre mensagens (ex.: 30–120s) + simulação de "digitando…" (presence) antes de enviar.
- Limite global por número/hora e por número/dia, configurável.
- Nunca enviar mensagem idêntica em massa: suporte a **spintax** (`{Oi|Olá|Opa}`) nos nós de texto.
- Pausa automática do número ao detectar desconexão/ban + realocação dos leads pendentes.

### 4.7 Caixa de entrada (mínima, fase posterior)

Visualização das conversas por lead (histórico já fica salvo via webhook `MESSAGES_UPSERT`), com opção de pausar o funil e responder manualmente. Não é o foco do MVP, mas o dado já é capturado desde o dia 1.

---

## 5. Modelo de dados (principais tabelas)

```
users            (admin da instalação)
settings         (domínio público, chaves, flags)
connections      (instância evolution, número, status, proxy_id, limites, aquecimento)
proxies          (host, porta, protocolo, usuário/senha, status de saúde)
pixels           (pixel_id, capi_token, test_event_code)
tracking_links   (código, funil_id, connection_strategy, pixel_id, msg inicial)
clicks           (tracking_link_id, fbclid, fbp, fbc, utms, ip, ua, criado_em)
leads            (telefone E.164, nome, e-mail, click_id, tags, is_customer)
funnels          (nome, status, versão publicada)
funnel_versions  (funil_id, nodes JSONB, edges JSONB)
funnel_runs      (lead_id, funnel_version_id, nó atual, estado, connection_id)
messages         (lead_id, connection_id, direção, conteúdo, status de entrega)
kiwify_webhooks  (payload bruto, evento, status de processamento)
orders           (lead_id, produto, valor, status, kiwify_order_id)
capi_events      (pixel_id, event_name, event_id, payload, resposta da Meta)
```

---

## 6. Roadmap de implementação

### Fase 0 — Fundação (repo + deploy) ✅ critério: instalação 1-click funcionando
- Monorepo, Dockerfile, GitHub Actions → GHCR.
- Schema JSON do EasyPanel testado de ponta a ponta (os 6 serviços sobem e conversam).
- Migrations automáticas + setup wizard + login.

### Fase 1 — Conexões + Proxies
- CRUD de conexões, QR code, status em tempo real.
- Pool de proxies, teste de saúde, atribuição 1:1, set na Evolution.
- Recepção de webhooks da Evolution (mensagens e status) gravando em `messages`/`leads`.

### Fase 2 — Rastreio + Pixel/CAPI + Kiwify
- Links rastreados `/r/{codigo}` com captura de fbclid/fbp/UTMs.
- Cadastro de pixels e envio de eventos CAPI com deduplicação e log.
- Endpoint de webhook Kiwify com validação de assinatura, casamento lead↔venda, Purchase no CAPI.

### Fase 3 — Funis (editor + engine)
- Editor React Flow (rascunho/publicado) com 3 nós mínimos pra validar a engine: **mensagem de texto**, **atraso**, **fim**.
- Engine BullMQ: cursor por lead, delays, distribuição round-robin entre números, anti-ban básico (limites + delays randomizados + spintax).
- Gatilho de entrada por link rastreado e por evento Kiwify.

### Fase 4 — Tipos de nós (documento e sprint dedicados — próxima conversa)
- Catálogo completo: mídia (áudio/imagem/vídeo), botões/lista, espera por resposta, condição/ramificação, atribuir tag, chamar webhook, transferir pra humano, etc.

### Fase 5 — Polimento operacional
- Caixa de entrada mínima, dashboard (leads, vendas, conversão por funil/anúncio), aquecimento automático completo, alertas (proxy caiu, número banido).

---

## 7. Riscos e pontos de atenção

1. **Banimento de números** é o risco nº 1 do produto — mitigação: aquecimento, limites, spintax, proxies pagos, presença "digitando". Deixar claro ao cliente que API não-oficial nunca é 100% segura.
2. **Proxy gratuito piora o problema que quer resolver** (detalhado em 4.2) — o plano assume proxies pagos baratos como recomendação oficial.
3. **9º dígito brasileiro** no casamento telefone↔venda Kiwify — normalizar sempre nas duas formas.
4. **Sintaxe do schema do EasyPanel** muda entre versões — validar cedo (Fase 0).
5. **Evolution API v2**: fixar versão da imagem no schema (não usar `latest` em produção) para o cliente não quebrar num update automático.
6. LGPD: dados de leads ficam no servidor do próprio cliente (ponto a favor do modelo self-hosted) — documentar isso no material de venda.
