import { platformSchema } from '@social-ai/shared';
import { z } from 'zod';
import { createPlatformAccount, listPlatformAccounts } from './platform.service.js';
import { maskToken } from '../../lib/sanitize.js';
import { requireWorkspaceId } from '../../lib/workspace.js';
import { AppError } from '../../lib/errors.js';
const jsonPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const jsonValueSchema = z.lazy(() => z.union([jsonPrimitiveSchema, z.array(jsonValueSchema), z.record(jsonValueSchema)]));
const createPlatformAccountSchema = z.object({
    workspaceId: z.string(),
    platform: platformSchema,
    accountLabel: z.string(),
    accessToken: z.string().min(8),
    refreshToken: z.string().optional(),
    meta: z.record(jsonValueSchema).default({})
});
export async function platformRoutes(app) {
    app.get('/v1/platforms/accounts', async (request) => {
        const workspaceId = requireWorkspaceId(request);
        const query = z.object({ workspaceId: z.string().optional() }).parse(request.query);
        const resolvedWorkspaceId = query.workspaceId ?? workspaceId;
        if (resolvedWorkspaceId !== workspaceId)
            throw new AppError('Workspace mismatch', 403);
        const rows = await listPlatformAccounts(resolvedWorkspaceId);
        return rows.map((row) => ({
            ...row,
            accessToken: maskToken(row.accessToken),
            refreshToken: maskToken(row.refreshToken ?? null)
        }));
    });
    app.post('/v1/platforms/accounts', async (request) => {
        const workspaceId = requireWorkspaceId(request);
        const input = createPlatformAccountSchema.parse(request.body);
        if (workspaceId !== input.workspaceId)
            throw new AppError('Workspace mismatch', 403);
        const created = await createPlatformAccount(input);
        return {
            ...created,
            accessToken: maskToken(created.accessToken),
            refreshToken: maskToken(created.refreshToken ?? null)
        };
    });
}
