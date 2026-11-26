---
description: Aciona code-reviewer + security-auditor no diff atual para revisar antes de commitar.
---

# /review

Aciona os agents `code-reviewer` e `security-auditor` no diff atual (não commitado) do repositório Vitryne.

## O que faz
1. `code-reviewer`: revisa tipos, erros, segurança e estilo do projeto no diff. Só lê.
2. `security-auditor`: procura vazamento de segredo, SSRF, injeção, CORS/CSP, tratamento de token Meta/Telegram e prompt injection. Só lê.

## Resultado
Um relatório consolidado em português do Brasil com:
- ✅ O que está certo
- ⚠️ O que precisa atenção (arquivo:linha)
- ❌ O que bloqueia o commit

Depois da revisão, você decide se aprova, corrige ou pede ajustes.
