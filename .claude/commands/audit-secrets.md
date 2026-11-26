---
description: Varredura de segredos (chaves/tokens hardcoded) fora de .vitryne/ e .env.
---

# /audit-secrets

Aciona o agent `security-auditor` para varrer o repositório em busca de segredos expostos.

## O que faz
Busca padrões de chave/token hardcoded (`sk-`, `gsk_`, `EAA`, `AKIA`, `Bearer`, `senha`, `senha`, `token`, `secret`, `apiKey`) fora de `.vitryne/` e `.env`.

## Resultado
Relatório em português do Brasil com:
- Arquivo:linha de cada achado
- Severidade (baixa/média/alta/crítica)
- Correção sugerida (mover para `.vitryne/` + `secret-crypto`, ou remover)

Nunca commite valores reais de chave. `.env.example` deve conter apenas placeholders.
