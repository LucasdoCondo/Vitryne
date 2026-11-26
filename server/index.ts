import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimiter } from './middleware/rate-limit.js';
import { setupHealthRoutes } from './routes/health.js';
import { setupSettingsRoutes } from './routes/settings.js';
import { setupConnectionsRoutes } from './routes/connections.js';
import { setupOAuthRoutes } from './routes/oauth.js';
import { setupLinksRoutes } from './routes/links.js';
import { setupCopyRoutes } from './routes/copy.js';
import { setupTelegramRoutes } from './routes/telegram.js';
import { setupCampaignRoutes } from './routes/campaigns.js';
import { setupAutomationRoutes } from './routes/automation.js';

const app = express();
const port = Number(process.env.VITRYNE_PORT ?? 8787);

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '64kb' }));
app.use(rateLimiter);

setupHealthRoutes(app);
setupSettingsRoutes(app);
setupConnectionsRoutes(app);
setupOAuthRoutes(app);
setupLinksRoutes(app);
setupCopyRoutes(app);
setupTelegramRoutes(app);
setupCampaignRoutes(app);
setupAutomationRoutes(app);

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error);
  response.status(500).json({ error: error.message || 'Ocorreu um erro inesperado.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Vitryne API ativa em http://localhost:${port}`);
});
