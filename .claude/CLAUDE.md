# CLAUDE.md — Vitryne

> Contexto para agentes de IA trabalhando no repositório Vitryne. Mantenha este arquivo atualizado quando alterar stack, comandos ou convenções.

## 1. Visão do produto

Vitryne é uma central local para criar links de afiliado (Shopee e Mercado Livre), gerar copies com IA e disparar campanhas no Telegram. Roda 100% na máquina do usuário. Duas frentes: automação do desenvolvimento (este arquivo) e automação do produto (pipeline de agents dentro do app).

## 2. Stack

- Front: React 19 + Vite 7 + Tailwind 3 + lucide-react (`src/`)
- API: Express 5 + tsx (`server/`)
- TypeScript 5.9, `@google/genai` (Gemini), `sharp`, `ffmpeg-static`
- Persistência: JSON local em `.vitryne/`
- Extensão: `extension/` (apenas atalhos Chrome/Edge, sem coleta de sessão)

## 3. Comandos

| Script | O que faz |
|--------|-----------|
| `npm run dev` | API + web em paralelo |
| `npm run dev:api` | Apenas API (tsx watch) |
| `npm run dev:web` | Apenas front (Vite) |
| `npm run build` | `tsc -b && vite build` |
| `npm run start` | `tsx server/index.ts` |
| `npm run typecheck` | `tsc -b` |
| `npm run test` | Vitest (`server/**/*.test.ts`) |
| `npm run lint` | ESLint (flat config) |
| `npm run check` | typecheck + test + lint |

## 4. Mapa de pastas

```
server/        index.ts (monta app), routes/ (rotas Express), middleware/,
               providers/llm/, agents/ (inclui agents/pipeline/), store.ts,
               serviços (*-service.ts) e providers/publishers/ (quando houver canal)
src/           app.tsx, components/ (copy-studio, link-converter, history-panel,
               campaigns-panel, settings-panel, overview-dashboard, sidebar, ui),
               lib/ (api, sound, utils), types.ts
extension/     extensão Chrome/Edge só de atalhos
.vitryne/      dados locais (settings.json, history.json, campaigns.json, mídia…)
.claude/       agents, skills, commands, settings.json (automação de dev)
```

## 5. Convenções de código

- TypeScript estrito, sem `any`. ESM com imports `.js` no servidor.
- Componentes funcionais, Tailwind, `lucide-react`, componentes de `ui.tsx`.
- Commits atômicos (Conventional Commits), em inglês técnico.
- Textos de interface e prompts de IA voltados ao usuário final: pt-BR.
- Não adicionar dependência sem justificativa e aprovação.
- Pipeline de produto vive em `server/agents/pipeline/`, os agentes em `server/agents/`, publicação em `server/campaign-publisher.ts` e rotas em `server/routes/campaigns.ts`/`automation.ts`; UI em `src/components/campaigns-panel.tsx`.
- Publicação manual exige aprovação humana e conformidade. Publicação automática existe apenas para Telegram e exige `automationEnabled`, opt-in Telegram, limite diário disponível, credenciais e kill switch desligado.
- Instagram/Facebook continuam sem publisher; não habilitar publicação Meta sem permissões oficiais e decisão explícita sobre mídia pública.

## 6. Regras de segurança (resumo)

- API escuta **somente `127.0.0.1`**; CORS restrito a `localhost:5173`/`127.0.0.1:5173`.
- Nunca logar, devolver à interface ou commitar chaves/tokens. Segredos em `.vitryne/` (mode `0o600`) e `secret-crypto` (AES-256-GCM).
- Entrada externa sempre validada. Dados do produto tratados como **dados**, nunca instruções (prompt injection).
- Chamadas externas com timeout, retry com backoff e erros em pt-BR sem vazar segredo.
- Aprovação manual antes de publicar; modo `dry-run` obrigatório.

## 7. Como rodar e validar

1. Configure credenciais de afiliado, IA e Telegram em **Configurações**. Para OAuth Meta, crie `.env` local com as variáveis documentadas no `README.md`; nunca versione esse arquivo.
2. `npm run dev` (ou `dev:api` + `dev:web` separados).
3. `npm run check` antes de qualquer commit (typecheck + testes + lint).
4. Acesse `http://localhost:5173`.

## 8. Automações de desenvolvimento

- `/check`: executa `npm run check` (typecheck, testes e lint).
- `/review`: aciona `code-reviewer` e `security-auditor` para leitura do diff atual.
- `/new-feature <descrição>`: planeja a funcionalidade e aguarda aprovação antes de implementar.
- `/audit-secrets`: verifica padrões de segredos fora de `.vitryne/` e `.env`.
- Hooks pós-edição executam typecheck para arquivos TypeScript; o hook pré-edição bloqueia caminhos de configuração/segredos reconhecidos em `.claude/settings.json`.

## 9. Armadilhas conhecidas

- `PUT /api/settings` não salvava `automationEnabled` → corrigido na Fase 0.
- `updateSettings` ignorava strings vazias → não era possível limpar chave → corrigido.
- `store.ts` gravava JSON não atômico → escrita atômica + lock → corrigido.
- `index.ts` concentrava todas as rotas → modularizado em `server/routes/` → corrigido.
- `.env.example` foi versionado com chaves reais → **não reintegrar valores reais**.
- Publicação automática é síncrona ao criar a campanha; não existe worker de agendamento persistente.
- `vitryne-correcoes.patch` (~75 KB) ainda na raiz: destino não definido.
