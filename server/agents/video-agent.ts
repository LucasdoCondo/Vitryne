import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import type { Agent, AgentContext, AgentResult } from './agent-base.js';

export interface VideoAgentInput {
  promotionalImagePath: string;
}

export interface VideoAgentOutput {
  videoPath: string;
}

const rootDirectory = dirname(fileURLToPath(new URL('../../package.json', import.meta.url)));

export class VideoAgent implements Agent<VideoAgentInput, VideoAgentOutput> {
  readonly name = 'VideoAgent';

  async run(input: VideoAgentInput, ctx: AgentContext): Promise<AgentResult<VideoAgentOutput>> {
    const start = Date.now();
    if (ctx.dryRun || !input.promotionalImagePath || typeof ffmpegPath !== 'string') {
      return { ok: true, output: { videoPath: '' }, stage: 'video', durationMs: Date.now() - start };
    }

    const executable: string = ffmpegPath;
    try {
      const mediaDirectory = join(rootDirectory, '.vitryne', 'media');
      await mkdir(mediaDirectory, { recursive: true, mode: 0o700 });
      const videoPath = join(mediaDirectory, `${randomUUID()}.mp4`);
      await new Promise<void>((resolve, reject) => {
        const process = spawn(executable, ['-y', '-loop', '1', '-i', input.promotionalImagePath, '-t', '3', '-vf', 'scale=1080:1080', '-r', '30', '-pix_fmt', 'yuv420p', videoPath], { windowsHide: true });
        const timeout = setTimeout(() => {
          process.kill();
          reject(new Error('Tempo esgotado ao gerar o vídeo promocional.'));
        }, 30_000);
        process.once('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        process.once('exit', (code) => {
          clearTimeout(timeout);
          if (code === 0) resolve();
          else reject(new Error('FFmpeg terminou com erro.'));
        });
      });
      return { ok: true, output: { videoPath }, stage: 'video', durationMs: Date.now() - start };
    } catch {
      return { ok: false, error: 'Não foi possível gerar o vídeo promocional.', stage: 'video', durationMs: Date.now() - start };
    }
  }
}
