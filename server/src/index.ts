import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { env, isProd } from './lib/env.js';
import authRoutes from './routes/auth.js';
import favoriteRoutes from './routes/favorites.js';
import gitaRoutes from './routes/gita.js';
import insightRoutes from './routes/insights.js';
import profileRoutes from './routes/profile.js';

const app = Fastify({ logger: { level: isProd ? 'info' : 'warn' } });

await app.register(fastifyCookie);

// Client and API are same-origin in both dev (vite proxy) and prod (static
// serving below), so there is deliberately no CORS plugin.
await app.register(
  async (api) => {
    api.get('/health', async () => ({ ok: true }));
    await api.register(authRoutes);
    await api.register(gitaRoutes);
    await api.register(profileRoutes);
    await api.register(favoriteRoutes);
    await api.register(insightRoutes);
  },
  { prefix: '/api' },
);

// dist/server/index.js -> dist/client
const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../client');
const hasClientBuild = existsSync(join(clientDist, 'index.html'));

if (hasClientBuild) {
  await app.register(fastifyStatic, { root: clientDist });
}

app.setNotFoundHandler(async (request, reply) => {
  // Unmatched API paths must stay JSON; falling through to index.html would
  // surface as an HTML parse error inside the client's fetch wrapper.
  if (request.url.startsWith('/api/')) {
    return reply.code(404).send({ error: 'Not found' });
  }
  if (hasClientBuild) {
    return reply.sendFile('index.html');
  }
  return reply.code(404).send({ error: 'Not found' });
});

await app.listen({ port: env.PORT, host: '0.0.0.0' });
console.log(`server listening on :${env.PORT}${hasClientBuild ? ' (serving client)' : ''}`);
