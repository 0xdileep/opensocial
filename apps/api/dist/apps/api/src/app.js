import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { brandRoutes } from './modules/brands/brand.routes.js';
import { postRoutes } from './modules/posts/post.routes.js';
import { scheduleRoutes } from './modules/schedules/schedule.routes.js';
import { platformRoutes } from './modules/platforms/platform.routes.js';
import { approvalRoutes } from './modules/approvals/approval.routes.js';
import { publishRoutes } from './modules/publishing/publish.routes.js';
export async function buildApp() {
    const app = Fastify({ logger: false });
    app.setErrorHandler((error, _request, reply) => {
        const maybeError = error;
        const statusCode = maybeError.statusCode && Number.isInteger(maybeError.statusCode)
            ? maybeError.statusCode
            : 500;
        reply.status(statusCode).send({
            error: statusCode >= 500 ? 'Internal Server Error' : (maybeError.message ?? 'Request failed')
        });
    });
    await app.register(cors, { origin: true });
    await app.register(sensible);
    await app.register(fastifyStatic, {
        root: new URL('../storage', import.meta.url).pathname,
        prefix: '/static/'
    });
    await brandRoutes(app);
    await postRoutes(app);
    await scheduleRoutes(app);
    await platformRoutes(app);
    await approvalRoutes(app);
    await publishRoutes(app);
    app.get('/health', async () => ({ ok: true }));
    return app;
}
