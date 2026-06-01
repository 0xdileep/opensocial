import { env } from './config/env.js';
import { buildApp } from './app.js';
import { logger } from './lib/logger.js';
const app = await buildApp();
app.listen({ port: env.PORT, host: '0.0.0.0' })
    .then(() => logger.info(`API running on ${env.PORT}`))
    .catch((error) => {
    logger.error(error);
    process.exit(1);
});
