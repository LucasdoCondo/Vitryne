# Vitryne

Central local para criar links de afiliado, gerar copies e disparar campanhas para Telegram.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. A interface Vite conversa apenas com a API local em `http://localhost:8787`.

Para gerar uma build de produção:

```bash
npm run build
```

## Configuração

Abra **Configurações** no Vitryne e salve os IDs e credenciais necessários. O `.env` é reservado às configurações locais do OAuth Meta; crie-o manualmente com as variáveis abaixo e nunca o versione.

| Serviço | Campo | Uso |
| --- | --- | --- |
| Shopee | Tracking ID | Adiciona `uls_trackid` aos links Shopee. |
| Mercado Livre | Tag de afiliado | Adiciona `matt_tool` aos links Mercado Livre. |
| Anthropic, OpenAI, Gemini e Groq | API Key | As chaves podem ser configuradas pelo painel ou por `.env`. Atualmente, somente Gemini é usado para gerar copy (`gemini-2.5-flash`); sem chave Gemini, há um modo de demonstração local. |
| Telegram | Bot token e Chat ID | Permite o disparo direto em Markdown. |
| Instagram e Facebook | App Meta e OAuth | Conecta Páginas e contas profissionais do Instagram vinculadas; os tokens de Página são criptografados localmente. |

As chaves salvas pelo painel ficam em `.vitryne/settings.json`, exclusivamente na máquina local, e seus valores não são devolvidos à interface após salvos. Esse diretório e `.env` já estão ignorados pelo Git. Para configurar via ambiente, use `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` e `GROQ_API_KEY`.

### OAuth da Meta (Instagram/Facebook)

1. Crie um aplicativo Meta e habilite o login do Facebook e os produtos/permissões necessários para Páginas e Instagram. As permissões de publicação podem exigir análise/aprovação da Meta.
2. Crie `.env` local e preencha `META_APP_ID`, `META_APP_SECRET` e `META_GRAPH_API_VERSION` com os valores disponíveis no painel do seu aplicativo Meta. Mantenha `META_REDIRECT_URI=http://localhost:8787/api/oauth/meta/callback` registrado como URI de redirecionamento OAuth válida.
3. Gere uma chave local AES-256-GCM de 32 bytes Base64 com `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` e coloque o resultado em `VITRYNE_ENCRYPTION_KEY`. Não compartilhe nem versione essa chave.
4. Reinicie o Vitryne e use **Conectar** nos cards de Instagram ou Facebook. A autorização abre no site oficial da Meta. O Vitryne não recebe nem armazena sua senha ou cookies; os tokens de Página ficam criptografados em `.vitryne/meta-connections.json`.

O callback OAuth aceita apenas endereços locais (`localhost`/`127.0.0.1`) e a API escuta somente em `127.0.0.1`. A publicação Meta permanece bloqueada até haver permissões aprovadas, decisão explícita sobre mídia pública e endpoints oficiais; o Vitryne não usa sessão ou cookies do navegador.

## Campanhas e automação segura

A tela **Campanhas** cria campanhas a partir de URL, nome informado pelo usuário e tom da copy. O pipeline executa link, dados do produto, copy, conformidade e preparação de mídia em modo local. Por padrão:

- todo pipeline começa como **dry-run** até você desmarcar essa opção;
- a copy precisa passar nas verificações de conformidade e incluir divulgação de afiliado;
- com a automação desligada, uma campanha só é publicada após aprovação humana explícita;
- a repetição no mesmo canal é bloqueada pelos IDs locais já publicados;
- a publicação automática no Telegram é imediata após a geração, somente com `automationEnabled`, opt-in Telegram, credenciais, limite diário disponível e kill switch desligado;
- com qualquer gate automático desligado, a campanha fica na fila para aprovação/publicação manual;
- Instagram/Facebook não têm publisher ativo e permanecem bloqueados até haver permissões oficiais e decisão explícita sobre mídia pública.

Não há worker de agendamento persistente: campanhas que passam pelos gates são publicadas de forma síncrona durante a criação. Faça primeiro um dry-run para revisar a copy e a conformidade antes de habilitar a publicação automática.

As campanhas ficam em `.vitryne/campaigns.json`, também fora do Git e com escrita local. As rotas disponíveis são `GET /api/campaigns`, `POST /api/campaigns`, `POST /api/campaigns/:id/approve`, `POST /api/campaigns/:id/publish`, `GET /api/automation/status` e `POST /api/automation/dry-run`.

## Extensão de acesso rápido

A extensão local opcional em `extension/` abre os portais oficiais de afiliados e redes sociais em novas abas. Ela não coleta credenciais ou sessões e não automatiza ações nas plataformas. Consulte [extension/README.md](./extension/README.md) para instalá-la no Chrome ou Edge.

> Cada programa de afiliados pode exigir parâmetros, URLs de redirecionamento ou regras adicionais. Confirme se os IDs configurados e o formato final do link atendem às regras vigentes da Shopee e do Mercado Livre antes de publicar campanhas.

## Automações de desenvolvimento

Os comandos do Claude Code ficam em `.claude/commands/`: `/check` executa `npm run check`, `/review` inicia revisão do diff, `/new-feature <descrição>` conduz uma funcionalidade por fases e `/audit-secrets` procura segredos no repositório. Os hooks em `.claude/settings.json` executam typecheck após editar TypeScript e bloqueiam edição de caminhos reconhecidos como configuração ou segredo. Agents e skills específicos ficam em `.claude/agents/` e `.claude/skills/`.

## Estrutura

```text
src/       # React, TypeScript, Tailwind e componentes de interface
server/    # API Express, persistência JSON local e integrações externas
extension/ # Extensão local de acesso rápido (sem coleta de sessão)
```
