import { criarApp } from './app.js';
import { config } from './config.js';

const app = await criarApp();
await app.listen({ port: config.porta, host: '0.0.0.0' });
