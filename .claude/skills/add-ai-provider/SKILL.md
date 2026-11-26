---
name: add-ai-provider
description: Adiciona provedor de IA atrás da interface LlmProvider (Anthropic, OpenAI, Groq), com fallback.
---

# Skill: add-ai-provider

## Quando usar
Quando for necessário adicionar um novo provedor de IA (ex.: Anthropic, OpenAI, Groq) atrás da interface de geração de copy, com fallback para provedores já existentes.

## Passo a passo

1. **Interface** (`server/providers/llm/`):
   - Defina a interface `LlmProvider` (método `generateCopy(request): Promise<{ copy: string; provider: string }>`).
   - Mantenha o fallback em cascata (Gemini → Anthropic/OpenAI/Groq → `localCopy`).

2. **Implementação do provedor**:
   - Crie um arquivo por provedor (ex.: `gemini.ts`, `anthropic.ts`, `openai.ts`, `groq.ts`).
   - Cada provedor lê sua chave de API de `Settings` e nunca a expõe ao front/logs.
   - Trate erros com mensagens em pt-BR sem vazar segredo.

3. **Configuração**:
   - Adicione o campo da chave de API a `Settings` e `PublicSettings` (apenas `hasXxxApiKey: boolean` no público).
   - Atualize `server/store.ts` (`settingStringKeys`, `updateSettings`, `toPublicSettings`).
   - Adicione a variável de ambiente correspondente a `.env.example` (placeholder, sem valor real).

4. **Chamada externa**:
   - Timeout e retry com backoff em toda chamada ao provedor.
   - Fallback local (`localCopy`) quando não houver chave ou todos os provedores falharem.

5. **Testes**:
   - Teste o provedor com mock de rede (sucesso, erro, timeout, fallback).
   - Execute `npm run test` e confirme que tudo passa.

6. **Validação final**:
   - `npm run check` verde.
   - Commit atômico.
