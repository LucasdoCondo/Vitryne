import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface ImageAgentInput {
  productName: string;
}

export interface ImageAgentOutput {
  promotionalImagePath: string;
}

const rootDirectory = dirname(fileURLToPath(new URL('../../package.json', import.meta.url)));

export class ImageAgent implements Agent<ImageAgentInput, ImageAgentOutput> {
  readonly name = 'ImageAgent';

  async run(input: ImageAgentInput, ctx: AgentContext): Promise<AgentResult<ImageAgentOutput>> {
    const start = Date.now();
    if (ctx.dryRun) {
      return { ok: true, output: { promotionalImagePath: '' }, stage: 'image', durationMs: Date.now() - start };
    }

    try {
      const mediaDirectory = join(rootDirectory, '.vitryne', 'media');
      await mkdir(mediaDirectory, { recursive: true, mode: 0o700 });
      const path = join(mediaDirectory, `${randomUUID()}.png`);
      const title = input.productName.replace(/[<>&]/g, '').slice(0, 80);
      const svg = `<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="#081329"/><rect x="50" y="50" width="980" height="980" rx="48" fill="#111827" stroke="#00f0ff" stroke-width="6"/><text x="540" y="470" fill="#ffffff" font-family="Arial" font-size="58" font-weight="bold" text-anchor="middle">${title}</text><text x="540" y="590" fill="#00f0ff" font-family="Arial" font-size="34" text-anchor="middle">Publicidade / conteúdo afiliado</text></svg>`;
      await sharp(Buffer.from(svg)).png().toFile(path);
      return { ok: true, output: { promotionalImagePath: path }, stage: 'image', durationMs: Date.now() - start };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? 'Não foi possível gerar a imagem promocional.' : 'Não foi possível gerar a mídia.', stage: 'image', durationMs: Date.now() - start };
    }
  }
}
