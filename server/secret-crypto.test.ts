import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { decryptSecret, encryptSecret } from './secret-crypto.js';

const validKey = Buffer.alloc(32).toString('base64');

beforeEach(() => {
  process.env.VITRYNE_ENCRYPTION_KEY = validKey;
});

afterEach(() => {
  delete process.env.VITRYNE_ENCRYPTION_KEY;
});

describe('secret-crypto', () => {
  test('round-trip encrypt/decrypt', () => {
    const original = 'meu-token-super-secreto';
    const encrypted = encryptSecret(original);
    expect(encrypted).not.toBe(original);
    expect(decryptSecret(encrypted)).toBe(original);
  });

  test('lança erro quando VITRYNE_ENCRYPTION_KEY não está configurada', () => {
    delete process.env.VITRYNE_ENCRYPTION_KEY;
    expect(() => encryptSecret('x')).toThrow(/VITRYNE_ENCRYPTION_KEY/);
  });

  test('lança erro quando a chave não tem 32 bytes', () => {
    process.env.VITRYNE_ENCRYPTION_KEY = 'chave-curta';
    expect(() => encryptSecret('x')).toThrow(/32 bytes/);
  });

  test('lança erro para formato de credencial inválido', () => {
    expect(() => decryptSecret('formato-invalido')).toThrow(/Formato de credencial criptografada inválido/);
  });
});
