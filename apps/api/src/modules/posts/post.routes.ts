import { FastifyInstance } from 'fastify';
import { generatePostInputSchema } from '@social-ai/shared';
import { z } from 'zod';
import { listPosts, getPostById } from './post.service.js';
import { runContentPipeline } from '../../ai/pipeline/content.pipeline.js';
import { requireWorkspaceId } from '../../lib/workspace.js';
import { AppError } from '../../lib/errors.js';

export async function postRoutes(app: FastifyInstance) {
  app.get('/v1/posts', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    return listPosts(workspaceId);
  });

  app.get('/v1/posts/:id', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    const params = z.object({ id: z.string() }).parse(request.params);
    return getPostById(params.id, workspaceId);
  });

  app.post('/v1/posts/generate', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    const input = generatePostInputSchema.parse(request.body);
    if (workspaceId !== input.workspaceId) throw new AppError('Workspace mismatch', 403);
    return runContentPipeline(input);
  });
}
