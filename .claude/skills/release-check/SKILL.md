---
name: release-check
description: Checklist: typecheck, build, testes, varredura de segredos, .gitignore, README atualizado.
---

# Skill: release-check

## Quando usar
Antes de qualquer release ou PR do Vitryne, para garantir qualidade e segurança.

## Checklist

- [ ] `npm run typecheck` — TypeScript estrito, sem erros.
- [ ] `npm run test` — todos os testes passam (Vitest).
- [ ] `npm run lint` — ESLint sem erros (warnings aceitáveis só de código pré-existente).
- [ ] `npm run build` — build de produção funciona (`tsc -b && vite build`).
- [ ] Varredura de segredos — nenhum `sk-`, `gsk_`, `EAA`, `AKIA`, `Bearer`, `senha`, `token` hardcoded fora de `.vitryne/` e `.env`.
- [ ] `.env.example` — contém apenas placeholders, nenhum valor real de chave.
- [ ] `.gitignore` — ignora `.env`, `.vitryne/`, `dist/`, `node_modules/`.
- [ ] `README.md` — atualizado com novos comandos, variáveis de ambiente ou alterações de comportamento.
- [ ] Commits atômicos (Conventional Commits), em inglês técnico.
- [ ] Nenhuma dependência nova adicionada sem justificativa e aprovação.

## Saída esperada
Confirmação de que todos os itens do checklist estão OK, ou lista de itens pendentes com arquivos envolvidos.
