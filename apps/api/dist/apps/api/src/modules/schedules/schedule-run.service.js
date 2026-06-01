import { randomUUID } from 'node:crypto';
import { query } from '../../db/client.js';
export async function markScheduleRun(scheduleId, runKey) {
    try {
        await query(`insert into scheduler_runs (id, schedule_id, run_key) values ($1,$2,$3)`, [randomUUID(), scheduleId, runKey]);
        return true;
    }
    catch {
        return false;
    }
}
