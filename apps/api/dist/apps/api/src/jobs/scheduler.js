import { runContentPipeline } from '../ai/pipeline/content.pipeline.js';
import { logger } from '../lib/logger.js';
import { publishPostNow } from '../modules/publishing/publish.service.js';
import { listSchedulablePosts, updatePostStatus } from '../modules/posts/post.service.js';
import { listSchedules } from '../modules/schedules/schedule.service.js';
import { markScheduleRun } from '../modules/schedules/schedule-run.service.js';
function includesToday(daysOfWeek, now) {
    return daysOfWeek.includes(now.getUTCDay());
}
function matchesMinute(localTime, now) {
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    return localTime === `${hh}:${mm}`;
}
function buildRunKey(scheduleId, now) {
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    return `${scheduleId}:${y}-${m}-${d}T${hh}:${mm}`;
}
export async function runSchedulerTick(workspaceId) {
    const now = new Date();
    const schedules = await listSchedules(workspaceId);
    const duePosts = await listSchedulablePosts(workspaceId, now.toISOString());
    for (const post of duePosts) {
        try {
            await publishPostNow(post.id, workspaceId);
        }
        catch (error) {
            logger.error('publish due post failed', post.id, error);
            await updatePostStatus(post.id, workspaceId, 'failed');
        }
    }
    for (const schedule of schedules) {
        if (!schedule.enabled)
            continue;
        if (!includesToday(schedule.daysOfWeek, now))
            continue;
        if (!matchesMinute(schedule.localTime, now))
            continue;
        const runKey = buildRunKey(schedule.id, now);
        const locked = await markScheduleRun(schedule.id, runKey);
        if (!locked)
            continue;
        try {
            await runContentPipeline({
                workspaceId: schedule.workspaceId,
                brandId: schedule.brandId,
                prompt: 'Generate the next unique auto post for this business.',
                postType: schedule.postTypes[0] ?? 'sales',
                platforms: schedule.platforms,
                withImage: true,
                requireApproval: schedule.requireApproval,
                scheduledFor: undefined
            });
            logger.info('recurring content generated', schedule.id);
        }
        catch (error) {
            logger.error('recurring generation failed', schedule.id, error);
        }
    }
    return { schedulesChecked: schedules.length, duePosts: duePosts.length };
}
