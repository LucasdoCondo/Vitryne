---
name: new-ui-section
description: Cria seção/tela nova no WorkspaceSection + sidebar + toast + estados de loading/erro.
---

# Skill: new-ui-section

## Quando usar
Quando for necessário adicionar uma nova tela/seção ao front-end Vitryne (ex.: tela Campanhas, tela Automação).

## Passo a passo

1. **Componente**:
   - Crie o componente em `src/components/<secao>/` seguindo o design system (dark/neon, `ui.tsx`, Tailwind, `lucide-react`).
   - Componente funcional com TypeScript estrito (sem `any`).

2. **Registro**:
   - Adicione a seção a `WorkspaceSection` (tipos e rotas internas do app).
   - Adicione o item ao `sidebar` com ícone `lucide-react` adequado.

3. **Estados**:
   - Trate sempre: vazio, loading, erro e sucesso.
   - Use toasts e sons existentes (`src/lib/sound.ts`) para feedback ao usuário.

4. **Integração com API**:
   - Chame as rotas via `src/lib/api.ts`.
   - Nunca exiba chaves/tokens na UI.

5. **Conformidade**:
   - Exiba divulgação de afiliado quando houver link de afiliado.
   - Não invente preço, desconto, estoque ou prazo na UI.

6. **Testes**:
   - Execute `npm run typecheck` e `npm run build`.
   - Confirme que a nova seção não quebra telas existentes.

7. **Validação final**:
   - `npm run check` verde.
   - Commit atômico.
