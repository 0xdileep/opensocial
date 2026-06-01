import { AppError } from './errors.js';
export function requireWorkspaceId(request) {
    const workspaceId = request.headers['x-workspace-id'];
    if (!workspaceId || typeof workspaceId !== 'string') {
        throw new AppError('Missing x-workspace-id header', 400);
    }
    return workspaceId;
}
