// Monta a API (usado pelo servidor e pelos testes).
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import estaticos from '@fastify/static';
import fs from 'node:fs';
import { config } from './config.js';
import { lerUsuario } from './auth.js';
import { tratarErro } from './erros.js';
import contas from './rotas/contas.js';
import pets from './rotas/pets.js';
import estabelecimentos from './rotas/estabelecimentos.js';
import agendamentos from './rotas/agendamentos.js';
import social from './rotas/social.js';
import matilhas from './rotas/matilhas.js';
import saude from './rotas/saude.js';
import geral from './rotas/geral.js';

export async function criarApp({ logger = true } = {}) {
  const app = Fastify({ logger, trustProxy: true, bodyLimit: 1024 * 1024 });
  await app.register(cors, { origin: true });
  await app.register(multipart);
  fs.mkdirSync(config.pastaUploads, { recursive: true });
  // Arquivos públicos (avatares, posts, fotos de estabelecimento).
  await app.register(estaticos, { root: config.pastaUploads, prefix: '/arquivos/', allowedPath: (p) => /^\/(avatares|posts|estabelecimentos)\//.test(p) });
  app.addHook('onRequest', lerUsuario);
  app.setErrorHandler(tratarErro);
  for (const rotas of [contas, pets, estabelecimentos, agendamentos, social, matilhas, saude, geral]) await app.register(rotas);
  return app;
}
