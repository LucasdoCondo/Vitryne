---
name: add-channel-publisher
description: Adiciona canal de publicação (Telegram, Facebook, Instagram, Discord…) seguindo a interface Publisher.
---

# Skill: add-channel-publisher

## Quando usar
Quando for necessário adicionar um novo canal de publicação de campanhas (ex.: Facebook Page, Instagram, Discord).

## Passo a passo

1. **Interface** (`server/providers/publishers/`):
   - Defina/implemente a interface `Publisher` (método `publish(campaign, ctx): Promise<{ postId?: string; ok: boolean }>`).
   - Cada publisher é idempotente: nunca posta duas vezes a mesma campanha/canal (`videoPostId`/`imagePostId`).

2. **Implementação do canal**:
   - Crie um arquivo por canal (ex.: `telegram.ts`, `facebook.ts`, `instagram.ts`).
   - Tokens de terceiros criptografados com `secret-crypto`, armazenados em `.vitryne/`.
   - Chamadas externas com timeout, retry com backoff e erros em pt-BR.

3. **Decisão sobre mídia pública (Instagram)**:
   - Instagram exige mídia acessível por URL pública. Não presuma que funciona em `localhost`.
   - Apresente opções (túnel temporário, armazenamento público, ou publicar só no Facebook/Telegram) e peça decisão do usuário antes de implementar.

4. **Controle humano**:
   - Publicação só após aprovação manual, exceto modo automático explicitamente habilitado (`automationEnabled` + opt-in por canal).
   - Respeite limites (máx. posts/dia, janela de horário, intervalo mínimo entre posts) e kill switch.

5. **Rotas e UI**:
   - Adicione rotas em `server/routes/` seguindo o padrão existente.
   - Adicione o canal na tela de Automação (toggle, log de execuções).
   - Nunca exibir tokens ao front.

6. **Testes**:
   - Teste o publisher com mock de rede.
   - Execute `npm run test` e confirme que tudo passa.

7. **Validação final**:
   - `npm run check` verde.
   - Commit atômico.
