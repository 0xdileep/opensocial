import { z } from 'zod';
import { approvePost, listApprovals, rejectPost } from './approval.service.js';
import { requireWorkspaceId } from '../../lib/workspace.js';
export async function approvalRoutes(app) {
    app.get('/v1/approvals', async (request) => {
        const workspaceId = requireWorkspaceId(request);
        return listApprovals(workspaceId);
    });
    app.post('/v1/posts/:id/approve', async (request) => {
        const workspaceId = requireWorkspaceId(request);
        const params = z.object({ id: z.string() }).parse(request.params);
        return approvePost(params.id, workspaceId);
    });
    app.post('/v1/posts/:id/reject', async (request) => {
        const workspaceId = requireWorkspaceId(request);
        const params = z.object({ id: z.string() }).parse(request.params);
        return rejectPost(params.id, workspaceId);
    });
}
