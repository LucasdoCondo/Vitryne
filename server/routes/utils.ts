export function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function validTone(value: unknown): value is 'agressivo' | 'informativo' | 'economia' {
  return value === 'agressivo' || value === 'informativo' || value === 'economia';
}
