---
description: Planejamento e implementação de uma nova funcionalidade: plano → implementação → revisão.
---

# /new-feature <descrição>

Inicia o ciclo de desenvolvimento de uma nova funcionalidade no Vitryne, seguindo o método do Prompt Mestre (seção 4).

## O que faz
Dada uma `<descrição>` da funcionalidade, o agent:

1. **Plano**: confirma o entendimento, lista suposições e apresenta o plano por fases com arquivos afetados, riscos e critérios de aceite (não escreve código ainda).
2. **Perguntas**: faz no máximo 5 perguntas com respostas padrão para você confirmar.
3. **Implementação**: executa uma fase por vez. Ao fim de cada fase, resume o que mudou, como testar e o que ficou pendente. Para e aguarda seu "ok" antes da próxima fase.
4. **Revisão**: ao final, roda `/review` + `/check` e valida com `npm run check`.

## Regras
- Não escreva código antes do plano ser aprovado.
- Mudanças pequenas, reversíveis, em commits atômicos (Conventional Commits).
- Se algo conflitar com as regras de segurança (seção 3 do Prompt Mestre), para e avisa em vez de contornar.

## Uso
`/new-feature <descrição da funcionalidade>`
