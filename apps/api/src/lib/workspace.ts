import { FastifyRequest } from 'fastify';
import { AppError } from './errors.js';

export function requireWorkspaceId(request: FastifyRequest) {
  const workspaceId = request.headers['x-workspace-id'];
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new AppError('Missing x-workspace-id header', 400);
  }
  return workspaceId;
}
