---
description: Executa typecheck + build + testes (npm run check) para validar o estado do código.
---

# /check

Executa a rede de segurança mínima do Vitryne antes de qualquer commit.

## O que faz
Roda `npm run check`, que executa em sequência:
1. `npm run typecheck` — `tsc -b` (TypeScript estrito).
2. `npm run test` — Vitest (`server/**/*.test.ts`).
3. `npm run lint` — ESLint (flat config).

## Resultado
- Se tudo passar: confirma que o estado do código está verde.
- Se houver falha: mostra o comando que falhou e o erro, para você corrigir antes de commitar.
