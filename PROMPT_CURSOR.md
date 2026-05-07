# Projeto: Trocador de Figurinhas - Copa do Mundo 2026

## Contexto e objetivo

Crie uma aplicação web para um grupo fechado de amigos e colegas de empresa que estão colecionando o álbum oficial da Panini da Copa do Mundo FIFA 2026. O objetivo principal é **facilitar a troca de figurinhas repetidas**: cada pessoa cadastra suas figurinhas repetidas e suas faltas, e o sistema (com auxílio de uma IA conversacional) sugere matches automáticos entre os usuários.

O álbum oficial tem **980 figurinhas no total**: 864 jogadores (48 seleções × 18 jogadores) + 48 logos de seleção + 68 cromos especiais (legendas, estádios, troféu, etc).

A aplicação deve ser **simples, gratuita de hospedar e fácil de usar via celular**. Vou compartilhar o link do site com ~20-30 pessoas.

---

## Stack obrigatória

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Banco de dados:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth com Google OAuth
- **IA conversacional:** Anthropic Claude API (modelo `claude-haiku-4-5-20251001`) via API Routes do Next.js
- **Deploy:** Vercel (free tier)
- **Sem backend separado.** Use API Routes do Next.js para qualquer lógica server-side (chamadas à API da Anthropic, etc). Supabase resolve o resto via cliente JS direto + RLS.

### Variáveis de ambiente (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## Modelo de dados (Supabase / Postgres)

Crie um arquivo `supabase/migrations/001_initial.sql` com o schema abaixo. Use Row Level Security (RLS) em todas as tabelas de usuário.

```sql
-- Catálogo de figurinhas (seed estático, populado uma vez)
create table figurinhas (
  id text primary key,                -- ex: "BRA01", "ARG18", "FWC01"
  numero int,                         -- número de exibição/ordem
  nome text not null,                 -- "Vinícius Jr.", "Logo Brasil", "Troféu"
  selecao text,                       -- "Brasil", "Argentina", null se especial
  selecao_codigo text,                -- "BRA", "ARG", "ESP" (para especial)
  tipo text not null check (tipo in ('jogador','logo','especial')),
  posicao text,                       -- "Atacante", "Goleiro" (opcional)
  imagem_url text,                    -- url da imagem da figurinha (opcional)
  created_at timestamptz default now()
);

create index idx_figurinhas_selecao on figurinhas(selecao);
create index idx_figurinhas_tipo on figurinhas(tipo);

-- Perfil do usuário (estende auth.users do Supabase)
create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  avatar_url text,
  whatsapp text,                      -- opcional, pra contato direto
  created_at timestamptz default now()
);

-- Coleção do usuário: quantas cópias de cada figurinha ele tem
-- 0 = não tem (falta), 1 = tem colada, 2+ = tem repetidas
create table colecao (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  figurinha_id text not null references figurinhas(id) on delete cascade,
  quantidade int not null default 0 check (quantidade >= 0),
  updated_at timestamptz default now(),
  unique(user_id, figurinha_id)
);

create index idx_colecao_user on colecao(user_id);
create index idx_colecao_figurinha on colecao(figurinha_id);

-- Histórico de trocas (opcional - pra acompanhar)
create table trocas (
  id bigserial primary key,
  user_a uuid not null references auth.users(id),
  user_b uuid not null references auth.users(id),
  figurinhas_de_a text[] not null,    -- ids das figurinhas que A deu
  figurinhas_de_b text[] not null,    -- ids das figurinhas que B deu
  status text not null default 'proposta' check (status in ('proposta','aceita','recusada','concluida')),
  created_at timestamptz default now()
);

-- View materializada de matches: quem tem o que outro precisa
create view matches as
select
  repetida.user_id      as user_oferta,
  falta.user_id         as user_precisa,
  repetida.figurinha_id as figurinha_id
from colecao repetida
join colecao falta
  on repetida.figurinha_id = falta.figurinha_id
 and repetida.user_id != falta.user_id
where repetida.quantidade > 1
  and falta.quantidade = 0;

-- RLS
alter table figurinhas enable row level security;
alter table perfis enable row level security;
alter table colecao enable row level security;
alter table trocas enable row level security;

-- Catálogo: leitura pública, escrita só admin
create policy "figurinhas_select_all" on figurinhas for select using (true);

-- Perfis: cada um vê todos (pra trocar precisa ver os outros), mas só edita o próprio
create policy "perfis_select_all" on perfis for select using (true);
create policy "perfis_update_own" on perfis for update using (auth.uid() = id);
create policy "perfis_insert_own" on perfis for insert with check (auth.uid() = id);

-- Coleção: todos veem (pra fazer match), mas só edita a própria
create policy "colecao_select_all" on colecao for select using (true);
create policy "colecao_insert_own" on colecao for insert with check (auth.uid() = user_id);
create policy "colecao_update_own" on colecao for update using (auth.uid() = user_id);
create policy "colecao_delete_own" on colecao for delete using (auth.uid() = user_id);

-- Trocas: só os envolvidos veem
create policy "trocas_select_own" on trocas for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "trocas_insert_own" on trocas for insert with check (auth.uid() = user_a);
create policy "trocas_update_envolvidos" on trocas for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Trigger pra criar perfil automático no signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Seed do catálogo

Crie `supabase/seed.sql` com o catálogo de figurinhas. Para o MVP, comece com um arquivo `data/figurinhas.json` no formato:

```json
[
  { "id": "BRA01", "numero": 1, "nome": "Logo Brasil", "selecao": "Brasil", "selecao_codigo": "BRA", "tipo": "logo" },
  { "id": "BRA02", "numero": 2, "nome": "Alisson", "selecao": "Brasil", "selecao_codigo": "BRA", "tipo": "jogador", "posicao": "Goleiro" },
  ...
]
```

E um script `scripts/seed-figurinhas.ts` que lê o JSON e insere via Supabase Admin Client. **Crie um placeholder com Brasil + Argentina + 5 especiais como exemplo**, e deixe um TODO claro indicando que o usuário precisa popular o resto manualmente (não invente dados de jogadores que você não tem certeza — vou popular com a lista oficial da CNN/Exame depois).

---

## Estrutura de pastas (Next.js App Router)

```
app/
  layout.tsx                    # layout raiz com providers (Supabase, Theme)
  page.tsx                      # landing/home (CTA pra login)
  (auth)/
    login/page.tsx              # botão "Entrar com Google"
    callback/route.ts           # callback OAuth
  (app)/
    layout.tsx                  # layout autenticado com nav
    dashboard/page.tsx          # resumo: % completo, repetidas, faltas, matches sugeridos
    album/page.tsx              # grade visual de todas figurinhas, click pra marcar qty
    repetidas/page.tsx          # lista das que tenho qty > 1
    faltas/page.tsx             # lista das que tenho qty = 0
    matches/page.tsx            # lista de matches com outros usuários
    chat/page.tsx               # chat com a IA
    perfil/page.tsx             # editar perfil + whatsapp
  api/
    chat/route.ts               # endpoint que chama Anthropic API
components/
  figurinha-card.tsx
  qty-selector.tsx              # +/- pra ajustar quantidade
  match-list.tsx
  chat-message.tsx
  nav.tsx
lib/
  supabase/
    client.ts                   # browser client
    server.ts                   # server client (pra route handlers)
    middleware.ts               # middleware de sessão
  anthropic.ts                  # cliente da Anthropic
  types.ts
data/
  figurinhas.json               # catálogo seed
scripts/
  seed-figurinhas.ts
supabase/
  migrations/001_initial.sql
middleware.ts                   # protege rotas (app)
```

---

## Telas e funcionalidades

### 1. Landing / Login
Página simples explicando o projeto e botão grande "Entrar com Google". Após login, redireciona pra `/dashboard`.

### 2. Dashboard
- Card com % de conclusão do álbum (X de 980)
- Cards: total de repetidas, total de faltas, matches disponíveis
- Lista resumida dos 5 melhores matches (gente que tem o que falta pra mim e vice-versa)
- Acesso rápido pro chat da IA

### 3. Álbum (visualização completa)
- Grid responsivo agrupado por seleção (sanfonas/accordion por seleção)
- Cada figurinha mostra: número, nome, e um seletor de quantidade (`-` `0` `+`)
- Clicar em `+` ou `-` faz upsert na tabela `colecao` em tempo real (otimistic UI)
- Filtros: "só faltas", "só repetidas", "só tenho", busca por nome
- Cores: cinza (não tenho), verde (tenho 1), amarelo (repetida 2+)

### 4. Repetidas
Lista das figurinhas com quantidade > 1, com a contagem.

### 5. Faltas
Lista das figurinhas com quantidade = 0.

### 6. Matches
Lista agrupada por usuário:
> **João Silva** — vocês podem trocar 5 figurinhas:
> - Você dá: BRA02, ARG07, FRA12
> - João dá: BRA15, ARG03
> - [Ver perfil] [WhatsApp]

Use a view `matches` do Supabase. Priorize trocas mútuas (cada um tem o que o outro precisa) sobre trocas unidirecionais.

### 7. Chat com IA
Interface de chat (estilo ChatGPT). O usuário digita perguntas em linguagem natural como:
- "Quem tem a figurinha do Vinícius Jr repetida?"
- "Quantas figurinhas me faltam pra completar a Argentina?"
- "Qual a melhor troca que posso fazer com o João?"
- "Quem tem mais figurinhas em comum comigo?"

A rota `/api/chat` recebe o histórico de mensagens, busca contexto relevante no Supabase (coleção do usuário, faltas, repetidas, matches), monta um system prompt com esses dados e chama a API da Anthropic.

**System prompt da IA:**
```
Você é o assistente do "Trocador de Figurinhas Copa 2026". Ajuda o usuário a 
gerenciar sua coleção e encontrar as melhores trocas com outros colecionadores.

Você tem acesso aos dados em tempo real:
- Coleção completa do usuário (o que tem, falta e tem repetida)
- Catálogo das 980 figurinhas
- Coleção dos outros usuários do grupo (somente para sugerir matches)
- Lista de matches já calculada

Seja direto, amigável e use o nome do usuário. Quando sugerir trocas, mostre 
nome do outro usuário, figurinhas de cada lado e link de WhatsApp se disponível.
Não invente figurinhas que não existem no catálogo. Responda em português.
```

**Importante:** No backend (route handler), antes de chamar a API da Anthropic, busque os dados do usuário autenticado e os matches dele, e injete como contexto na primeira mensagem ou no system prompt. Não confie só no que o LLM "lembra".

### 8. Perfil
Editar nome, foto e WhatsApp.

---

## Fluxo de match (lógica de negócio)

A view `matches` do banco já entrega pares brutos. No frontend, agrupe assim:

```typescript
// Pra cada outro usuário, calcule:
// - figurinhas que EU tenho repetida E ELE precisa (eu_dou)
// - figurinhas que ELE tem repetida E EU preciso (eu_recebo)
// - score = min(eu_dou.length, eu_recebo.length)  // trocas balanceadas valem mais
// Ordene por score desc
```

Mostre primeiro as trocas mútuas (eu_dou > 0 E eu_recebo > 0). Depois as unidirecionais.

---

## Detalhes de UX importantes

- **Mobile first.** A maioria vai usar pelo celular.
- **Sem janela de cadastro chata.** Login Google é um clique.
- **Atualizar coleção tem que ser MUITO rápido.** Pensei em chegar com 50 figurinhas novas e marcar tudo em 2 minutos. Considere: digitar o número da figurinha em um input rápido e dar enter pra incrementar quantidade. Tipo um "modo pacote": abro pacote, digito BRA02, enter, BRA15, enter, etc.
- **Realtime opcional.** Se for fácil, use Supabase Realtime pra atualizar matches ao vivo. Senão, refresh manual está OK.
- **Tema claro e limpo.** Cores oficiais da Copa 2026 (vermelho/verde/azul ficam bem). Mas sem exagero; foco em legibilidade.

---

## Tarefas de implementação (ordem sugerida)

1. Inicializar projeto Next.js 14 com TS + Tailwind + shadcn/ui
2. Configurar Supabase (clientes browser/server + middleware de sessão)
3. Criar migration SQL inicial e rodar no Supabase
4. Implementar Google OAuth com Supabase
5. Criar trigger de criação de perfil automático
6. Criar `data/figurinhas.json` com placeholder (Brasil + Argentina + especiais) e script de seed
7. Tela de Álbum com grid + seletor de quantidade (write na tabela `colecao`)
8. Telas Repetidas e Faltas (filtros simples sobre `colecao`)
9. Tela Matches usando a view do Supabase
10. Tela Dashboard agregando os números
11. Modo pacote rápido (input com autofocus que incrementa por código)
12. Rota `/api/chat` integrando com Anthropic
13. Tela Chat
14. Tela Perfil + WhatsApp
15. Deploy na Vercel + configurar OAuth no Google Cloud Console e Supabase

---

## Restrições e cuidados

- **Não use service_role key no client.** Só em route handlers/server.
- **RLS ligado em tudo.** Verifique que um usuário não consegue editar a coleção de outro.
- **Não armazene a API key da Anthropic no frontend.** Sempre via route handler.
- **Custos:** Anthropic Haiku é barato (~$1/M tokens input). Limite o histórico do chat a últimas 10 mensagens pra controlar gasto.
- **Não invente dados de jogadores.** Quando criar o seed, use só os dados que eu fornecer. Crie um placeholder claro.
- **Código em português** para variáveis de domínio (figurinha, colecao, troca), inglês pra termos técnicos.

---

## Critério de "pronto"

Quando eu puder:
1. Acessar o site no celular
2. Logar com Google
3. Marcar minhas figurinhas (incluindo repetidas)
4. Ver quem do grupo tem o que me falta
5. Conversar com a IA pedindo "qual minha melhor troca?"
6. Compartilhar o link com 20 amigos pra eles fazerem o mesmo

…o MVP está pronto.

Comece criando o projeto Next.js e a estrutura de pastas. Vá implementando passo a passo, me mostrando o progresso.
