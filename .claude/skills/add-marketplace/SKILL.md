---
name: add-marketplace
description: Adiciona um novo marketplace (ex.: Amazon, Shein): tipos, identifyMarketplace, parâmetro de afiliado, validação, UI e testes.
---

# Skill: add-marketplace

## Quando usar
Quando for necessário suportar um novo marketplace de afiliados além de Shopee e Mercado Livre.

## Passo a passo

1. **Confirme a API oficial**: verifique a documentação atual do marketplace. Se não houver API acessível, a entrada de dados será manual (o agent pede ao usuário). Não raspe páginas contra ToS.

2. **Tipos** (`server/types.ts`):
   - Adicione o novo valor ao tipo `Marketplace` (ex.: `'amazon' | 'shein'`).
   - Mantenha `OfferCategory` atualizado se houver nova categoria de oferta.

3. **Detecção** (`server/link-service.ts`):
   - Estenda `identifyMarketplace(hostname)` para reconhecer o domínio do novo marketplace.
   - Mantenha `'unknown'` como fallback para domínios não reconhecidos.

4. **Parâmetro de afiliado**:
   - Adicione o campo correspondente a `Settings` (ex.: `amazonTag`).
   - Em `convertAffiliateUrl`, acrescente o parâmetro de tracking do marketplace quando o campo estiver preenchido.
   - Atualize `settingStringKeys` e `toPublicSettings` em `server/store.ts`.

5. **Validação**:
   - `convertAffiliateUrl` deve rejeitar URLs inválidas e protocolos não http(s).
   - Adicione testes cobrindo o novo marketplace (sucesso, URL inválida, domínio desconhecido).

6. **UI**:
   - Adicione o campo de configuração no painel de settings (front).
   - Atualize `src/lib/api.ts` com a função de chamada da nova rota, se aplicável.
   - Exiba o nome amigável do marketplace (`marketplaceName`) na interface.

7. **Testes**:
   - Crie/adapte `server/link-service.test.ts` com casos do novo marketplace.
   - Execute `npm run test` e confirme que tudo passa.

8. **Validação final**:
   - `npm run check` verde.
   - Commit atômico (Conventional Commits).
