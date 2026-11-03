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

Abra **Configurações** no Vitryne e salve os IDs e credenciais necessários. Alternativamente, copie `.env.example` para `.env` e preencha suas variáveis antes de iniciar o servidor.

| Serviço | Campo | Uso |
| --- | --- | --- |
| Shopee | Tracking ID | Adiciona `uls_trackid` aos links Shopee. |
| Mercado Livre | Tag de afiliado | Adiciona `matt_tool` aos links Mercado Livre. |
| Google Gemini | API Key | Gera copy com `gemini-2.5-flash`. Sem chave, há um modo de demonstração local. |
| Telegram | Bot token e Chat ID | Permite o disparo direto em Markdown. |

As chaves salvas pelo painel ficam em `.vitryne/settings.json`, exclusivamente na máquina local, e não são expostas à interface após salvas. Esse diretório e `.env` já estão ignorados pelo Git.

> Cada programa de afiliados pode exigir parâmetros, URLs de redirecionamento ou regras adicionais. Confirme se os IDs configurados e o formato final do link atendem às regras vigentes da Shopee e do Mercado Livre antes de publicar campanhas.

## Estrutura

```text
src/       # React, TypeScript, Tailwind e componentes de interface
server/    # API Express, persistência JSON local e integrações externas
```
