import { randomUUID } from 'node:crypto';
import { query } from '../../db/client.js';
export async function createSchedule(input) {
    const id = randomUUID();
    const result = await query(`insert into schedules (
      id, workspace_id, brand_id, enabled, timezone, days_of_week, local_time, post_types, platforms, require_approval
    ) values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10)
    returning
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      enabled,
      timezone,
      days_of_week as "daysOfWeek",
      local_time as "localTime",
      post_types as "postTypes",
      platforms,
      require_approval as "requireApproval",
      last_run_at as "lastRunAt"`, [
        id,
        input.workspaceId,
        input.brandId,
        input.enabled,
        input.timezone,
        JSON.stringify(input.daysOfWeek),
        input.localTime,
        JSON.stringify(input.postTypes),
        JSON.stringify(input.platforms),
        input.requireApproval
    ]);
    return result.rows[0];
}
export async function listSchedules(workspaceId) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      enabled,
      timezone,
      days_of_week as "daysOfWeek",
      local_time as "localTime",
      post_types as "postTypes",
      platforms,
      require_approval as "requireApproval",
      last_run_at as "lastRunAt"
     from schedules
     where workspace_id = $1
     order by id desc`, [workspaceId]);
    return result.rows;
}
