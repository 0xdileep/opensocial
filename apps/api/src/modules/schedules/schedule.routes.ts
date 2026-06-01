import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { platformSchema, postTypeSchema } from '@social-ai/shared';
import { createSchedule, listSchedules } from './schedule.service.js';
import { runSchedulerTick } from '../../jobs/scheduler.js';
import { requireWorkspaceId } from '../../lib/workspace.js';
import { AppError } from '../../lib/errors.js';

const createScheduleSchema = z.object({
  workspaceId: z.string(),
  brandId: z.string(),
  enabled: z.boolean().default(true),
  timezone: z.string(),
  daysOfWeek: z.array(z.number().min(0).max(6)),
  localTime: z.string(),
  postTypes: z.array(postTypeSchema),
  platforms: z.array(platformSchema),
  requireApproval: z.boolean().default(true)
});

export async function scheduleRoutes(app: FastifyInstance) {
  app.get('/v1/schedules', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    return listSchedules(workspaceId);
  });

  app.post('/v1/schedules', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    const input = createScheduleSchema.parse(request.body);
    if (workspaceId !== input.workspaceId) throw new AppError('Workspace mismatch', 403);
    return createSchedule(input);
  });

  app.post('/v1/schedules/run', async (request) => {
    const workspaceId = requireWorkspaceId(request);
    return runSchedulerTick(workspaceId);
  });
}
