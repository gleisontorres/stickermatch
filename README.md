<div align="center">

# **CollectHub**

**Plataforma de troca de figurinhas da Copa do Mundo FIFA 2026** 🏆

<br />

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deploy-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Resend](https://img.shields.io/badge/Resend-email-1B1B1D?style=flat-square&logo=resend&logoColor=white)](https://resend.com/)

<br />

<img src=".github/assets/line.png" width="100%" alt="" />

</div>

## Sobre o projeto

**CollectHub** (anteriormente *Stickermatch*) é uma aplicação web **privada** para organizar trocas de figurinhas do álbum oficial **Panini — Copa do Mundo FIFA 2026**, pensada para um **grupo fechado** de cerca de **20–30** colegas e amigos.

O acesso é feito com **conta Google**; novos cadastros ficam **pendentes** até um **administrador** aprovar manualmente no painel interno — assim só entra quem pertence ao grupo.

<img src=".github/assets/line.png" width="100%" alt="" />

## Funcionalidades

| | |
|---|---|
| 🎴 | **Catálogo completo** com **980 figurinhas** da Copa 2026 |
| 📦 | **Modo Pacote** para entrada rápida de figurinhas |
| 🤝 | **Matches automáticos** entre colecionadores (view derivada das coleções) |
| 🤖 | **Assistente IA** (*Albu-AI*) integrado ao chat (**OpenAI API**, modelo configurável) |
| 🌙 | **Dark mode** como base + alternância de tema claro |
| 📱 | **PWA** — instalável no celular |
| 🔐 | **Acesso controlado** com aprovação manual pelo admin |
| 📍 | **Distância** entre colecionadores (**geolocalização opcional**) |
| 📧 | **E-mail ao admin** quando um novo usuário entra na fila de aprovação |
| 🏆 | **Álbum** organizado por **grupos da Copa** (A–L) com bandeiras e barras de progresso |

<img src=".github/assets/line.png" width="100%" alt="" />

## Arquitetura / fluxo do sistema

### Diagrama 1 — Arquitetura geral

```mermaid
%%{init: {'theme':'dark','themeVariables': {'primaryColor':'#10b981','secondaryColor':'#f59e0b','lineColor':'#374151','primaryTextColor':'#f9fafb'}}}%%
graph TD
  U[Usuário / navegador] --> N[Next.js · Vercel]
  N --> SA[Supabase Auth · Google OAuth]
  N --> DB[(Supabase PostgreSQL)]
  DB --> VW[View matches · matching automático]
  DB --> WH[Database Webhook · INSERT perfis]
  WH --> EF[Edge Function notify-new-user]
  EF --> RS[Resend API]
  RS --> EM[E-mail ao administrador]
  N --> OAI[OpenAI API · chat assistente]

  classDef primary fill:#10b981,stroke:#047857,color:#052e16,font-weight:bold;
  classDef accent fill:#f59e0b,stroke:#d97706,color:#1c1917,font-weight:bold;
  classDef neutral fill:#1f2937,stroke:#374151,color:#e5e7eb;

  class N,SA,DB primary;
  class EF,RS,WH accent;
  class U,VW,EM,OAI neutral;
```

### Diagrama 2 — Fluxo de cadastro e aprovação

```mermaid
%%{init: {'theme':'dark','themeVariables': {'actorB':'#10b981','actorBorder':'#f59e0b'}}}%%
sequenceDiagram
  autonumber
  participant U as Usuário
  participant G as Google OAuth
  participant SA as Supabase Auth
  participant PG as PostgreSQL · perfis
  participant WH as Webhook
  participant EF as Edge Function
  participant R as Resend
  participant AD as Admin

  U->>G: Entrar com Google
  G->>SA: Credencial OAuth
  SA->>PG: Trigger handle_new_user
  Note over PG: status = pendente
  PG->>WH: INSERT perfis
  WH->>EF: Payload webhook
  EF->>R: Enviar e-mail
  R->>AD: Notificação novo usuário
  AD->>PG: Aprovar no painel · status = aprovado
  PG-->>U: Acesso liberado ao app
```

<img src=".github/assets/line.png" width="100%" alt="" />

## Stack técnica

| Categoria | Tecnologia | Uso |
|-----------|------------|-----|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | Interface web e PWA |
| Backend | Supabase (PostgreSQL) | Dados, Auth, RLS, webhooks |
| Auth | Google OAuth via Supabase | Login |
| IA | OpenAI API | Assistente de chat contextual (`/api/chat`) |
| E-mail | Resend · domínio collecthub.app | Notificações de novos usuários |
| Deploy | Vercel | CI/CD ao dar push no Git |
| Edge Functions | Supabase · runtime Deno | `notify-new-user` (e-mail via Resend) |

<img src=".github/assets/line.png" width="100%" alt="" />

## Modelo de dados (simplificado)

```mermaid
%%{init: {'theme':'dark'}}%%
erDiagram
  PERFIS ||--o{ COLECAO : possui
  FIGURINHAS ||--o{ COLECAO : referencia

  PERFIS {
    uuid id PK
    text nome
    text email
    text avatar_url
    text whatsapp
    text status
    boolean is_admin
    float latitude
    float longitude
    timestamptz created_at
  }

  FIGURINHAS {
    text id PK
    int numero
    text nome
    text selecao_codigo
    text grupo
    text tipo
    text imagem_url
  }

  COLECAO {
    bigint id PK
    uuid user_id FK
    text figurinha_id FK
    int quantidade
    timestamptz updated_at
  }

  MATCHES_VIEW {
    uuid user_oferta
    uuid user_precisa
    text figurinha_id
  }
```

*`matches` é uma **view** SQL derivada de `colecao` + `figurinhas`, não uma tabela física.*

<img src=".github/assets/line.png" width="100%" alt="" />

## Fluxo de negócio

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
  A[Cadastro Google] --> B[Status pendente]
  B --> C{Aprovação admin}
  C --> D[Status aprovado]
  D --> E[Cadastra figurinhas]
  E --> F[Sistema calcula matches]
  F --> G[Trocas com colegas]

  classDef primary fill:#10b981,stroke:#047857,color:#052e16,font-weight:bold;
  classDef accent fill:#f59e0b,stroke:#d97706,color:#1c1917,font-weight:bold;

  class A,D,F primary;
  class B,C,G accent;
```

<img src=".github/assets/line.png" width="100%" alt="" />

## Acesso e ambiente

| | |
|---|---|
| **URL** | [collecthub.app](https://collecthub.app) |
| **Login** | Conta Google do grupo autorizado |
| **Aprovação** | Manual pelo administrador após o primeiro acesso |
| **Depois da aprovação** | Uso completo (álbum, matches, chat, perfil, etc.) |

<img src=".github/assets/line.png" width="100%" alt="" />

## Variáveis de ambiente

Valores **não** devem ser commitados; use `.env.local` (local) e o painel da **Vercel** / secrets das **Edge Functions** em produção.

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | App Next.js | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App Next.js | Chave pública (anon) para o cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor apenas | Service role — **nunca** expor no browser |
| `OPENAI_API_KEY` | Servidor (`/api/chat`) | Chave da API OpenAI do assistente |
| `OPENAI_CHAT_MODEL` | Servidor (opcional) | Modelo de chat (ex.: override do padrão) |
| `RESEND_API_KEY` | Secret da Edge Function Supabase | Envio de e-mail via Resend |
| `NOTIFICATION_EMAIL` | Secret da Edge Function Supabase | Destino das notificações de novo usuário |
| `SUPABASE_DB_PASSWORD` / `DATABASE_URL` | Dev local (opcional) | Migrações ou scripts contra o Postgres |

Veja também `.env.example` na raiz do repositório.

<img src=".github/assets/line.png" width="100%" alt="" />

<div align="center">

Feito com 💚 para a Copa do Mundo 2026 🏆  
<br />
<a href="https://collecthub.app"><strong>collecthub.app</strong></a>

</div>
