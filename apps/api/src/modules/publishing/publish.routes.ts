import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { publishPostNow } from './publish.service.js';
import { listPublishAttempts } from './publish-attempt.service.js';
import { requireWorkspaceId } from '../../lib/workspace.js';

export async function publishRoutes(app: FastifyInstance) {
  app.post('/v1/publish/:postId/now', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    const params = z.object({ postId: z.string() }).parse(request.params);
    return publishPostNow(params.postId, workspaceId);
  });

  app.get('/v1/publish/:postId/attempts', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    const params = z.object({ postId: z.string() }).parse(request.params);
    return listPublishAttempts(params.postId, workspaceId);
  });
}
