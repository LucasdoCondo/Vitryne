import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const algorithm = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const encoded = process.env.VITRYNE_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error('Configure VITRYNE_ENCRYPTION_KEY com uma chave Base64 de 32 bytes.');
  }

  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32 || key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
    throw new Error('VITRYNE_ENCRYPTION_KEY deve ser uma chave Base64 válida de 32 bytes.');
  }
  return key;
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((part) => part.toString('base64')).join('.');
}

export function decryptSecret(value: string): string {
  const [encodedIv, encodedTag, encodedData, extra] = value.split('.');
  if (!encodedIv || !encodedTag || !encodedData || extra) {
    throw new Error('Formato de credencial criptografada inválido.');
  }

  const decipher = createDecipheriv(algorithm, getEncryptionKey(), Buffer.from(encodedIv, 'base64'));
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedData, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
