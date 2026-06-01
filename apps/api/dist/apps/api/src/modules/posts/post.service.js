import { randomUUID } from 'node:crypto';
import { query } from '../../db/client.js';
import { AppError } from '../../lib/errors.js';
export async function savePostDraft(input) {
    const id = randomUUID();
    const result = await query(`insert into posts (
      id, workspace_id, brand_id, source_type, post_type, text_master, image_prompt, image_url,
      quality_score, status, scheduled_for, platform_targets
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
    returning
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"`, [
        id,
        input.workspaceId,
        input.brandId,
        input.sourceType,
        input.postType,
        input.textMaster,
        input.imagePrompt,
        input.imageUrl ?? null,
        input.qualityScore,
        input.status,
        input.scheduledFor ?? null,
        JSON.stringify(input.platformTargets)
    ]);
    return result.rows[0];
}
export async function updatePostImage(id, workspaceId, imageUrl) {
    const result = await query(`update posts
     set image_url = $3, updated_at = now()
     where id = $1 and workspace_id = $2
     returning
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"`, [id, workspaceId, imageUrl]);
    if (!result.rows[0])
        throw new AppError('Post not found', 404);
    return result.rows[0];
}
export async function listRecentPostTexts(brandId, workspaceId, limit = 10) {
    const result = await query(`select text_master as "textMaster"
     from posts where brand_id = $1 and workspace_id = $2
     order by created_at desc limit $3`, [brandId, workspaceId, limit]);
    return result.rows.map((row) => row.textMaster);
}
export async function listPosts(workspaceId) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"
     from posts
     where workspace_id = $1
     order by created_at desc limit 100`, [workspaceId]);
    return result.rows;
}
export async function getPostById(id, workspaceId) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"
     from posts where id = $1 and workspace_id = $2`, [id, workspaceId]);
    if (!result.rows[0])
        throw new AppError('Post not found', 404);
    return result.rows[0];
}
export async function updatePostStatus(id, workspaceId, status) {
    const result = await query(`update posts
     set status = $3, updated_at = now()
     where id = $1 and workspace_id = $2
     returning
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"`, [id, workspaceId, status]);
    if (!result.rows[0])
        throw new AppError('Post not found', 404);
    return result.rows[0];
}
export async function listPendingApprovalPosts(workspaceId) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"
     from posts where status = 'pending_approval' and workspace_id = $1
     order by created_at desc`, [workspaceId]);
    return result.rows;
}
export async function listSchedulablePosts(workspaceId, nowIso) {
    const result = await query(`select
      id,
      workspace_id as "workspaceId",
      brand_id as "brandId",
      source_type as "sourceType",
      post_type as "postType",
      text_master as "textMaster",
      image_prompt as "imagePrompt",
      image_url as "imageUrl",
      quality_score as "qualityScore",
      status,
      scheduled_for as "scheduledFor",
      platform_targets as "platformTargets",
      created_at as "createdAt",
      updated_at as "updatedAt"
     from posts
     where workspace_id = $1
       and status in ('generated', 'scheduled')
       and scheduled_for is not null
       and scheduled_for <= $2::timestamptz
     order by scheduled_for asc`, [workspaceId, nowIso]);
    return result.rows;
}
