---
name: new-api-route
description: Cria rota Express com validação, erros em pt-BR, tipos compartilhados e função em src/lib/api.ts.
---

# Skill: new-api-route

## Quando usar
Quando for necessário adicionar uma nova rota da API Express no servidor Vitryne.

## Passo a passo

1. **Localização**:
   - Coloque a rota no arquivo adequado em `server/routes/` (ex.: `health.ts`, `settings.ts`, `links.ts`, `copy.ts`, `telegram.ts`).
   - `server/index.ts` só monta o app e ouve a porta (não concentre rotas lá).

2. **Tipos compartilhados**:
   - Adicione/types compartilhados em `server/types.ts` se houver novos payloads de request/response.
   - Mantenha `Settings`/`PublicSettings` atualizados quando houver novos campos de configuração.

3. **Validação**:
   - Valide entrada externa rigorosamente (campos obrigatórios, tipos, valores permitidos).
   - Rejeite com HTTP 400 e mensagem clara em pt-BR.

4. **Tratamento de erros**:
   - Erros de validação → 400 com mensagem em pt-BR.
   - Erros externos → 502 com mensagem genérica em pt-BR (sem vazar segredo).
   - Erro inesperado → middleware global de erro (500).

5. **Front-end**:
   - Adicione a função de chamada em `src/lib/api.ts` (tipada, com tratamento de erro).
   - Reutilize o cliente de API existente (fetch com base URL).

6. **Testes**:
   - Crie testes em `server/*.test.ts` cobrindo sucesso, validação e erro.
   - Execute `npm run test` e confirme que tudo passa.

7. **Validação final**:
   - `npm run check` verde.
   - Commit atômico.
