import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createBrand, getBrandById } from './brand.service.js';
import { requireWorkspaceId } from '../../lib/workspace.js';
import { AppError } from '../../lib/errors.js';

const createBrandSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  businessSummary: z.string(),
  audience: z.string(),
  tone: z.string(),
  goals: z.array(z.string()).default([]),
  bannedPhrases: z.array(z.string()).default([]),
  requiredMentions: z.array(z.string()).default([])
});

export async function brandRoutes(app: FastifyInstance) {
  app.post('/v1/brands', async (request) => {
    const input = createBrandSchema.parse(request.body);
    const workspaceId = requireWorkspaceId(request);
    if (workspaceId !== input.workspaceId) throw new AppError('Workspace mismatch', 403);
    return createBrand(input);
  });

  app.get('/v1/brands/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    const workspaceId = requireWorkspaceId(request);
    return getBrandById(params.id, workspaceId);
  });
}
