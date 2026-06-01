import { randomUUID } from 'node:crypto';
import { query } from '../../db/client.js';
export async function logPublishAttempt(input) {
    await query(`insert into publish_attempts (
      id, post_id, platform, status, request_payload, response_payload, error_message
    ) values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7)`, [
        randomUUID(),
        input.postId,
        input.platform,
        input.status,
        JSON.stringify(input.requestPayload ?? {}),
        JSON.stringify(input.responsePayload ?? {}),
        input.errorMessage ?? null
    ]);
}
export async function listPublishAttempts(postId, workspaceId) {
    const result = await query(`select
      pa.id,
      pa.post_id as "postId",
      pa.platform,
      pa.status,
      pa.request_payload as "requestPayload",
      pa.response_payload as "responsePayload",
      pa.error_message as "errorMessage",
      pa.created_at as "createdAt"
     from publish_attempts pa
     inner join posts p on p.id = pa.post_id
     where pa.post_id = $1 and p.workspace_id = $2
     order by pa.created_at desc`, [postId, workspaceId]);
    return result.rows;
}
