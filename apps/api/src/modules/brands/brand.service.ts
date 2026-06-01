import { randomUUID } from 'node:crypto';
import { BrandProfile } from '@social-ai/shared';
import { query } from '../../db/client.js';
import { AppError } from '../../lib/errors.js';

export async function createBrand(input: Omit<BrandProfile, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = randomUUID();
  const result = await query<BrandProfile>(
    `insert into brand_profiles (
      id, workspace_id, name, business_summary, audience, tone, goals, banned_phrases, required_mentions
    ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb)
    returning
      id,
      workspace_id as "workspaceId",
      name,
      business_summary as "businessSummary",
      audience,
      tone,
      goals,
      banned_phrases as "bannedPhrases",
      required_mentions as "requiredMentions",
      created_at as "createdAt",
      updated_at as "updatedAt"`,
    [
      id,
      input.workspaceId,
      input.name,
      input.businessSummary,
      input.audience,
      input.tone,
      JSON.stringify(input.goals),
      JSON.stringify(input.bannedPhrases),
      JSON.stringify(input.requiredMentions)
    ]
  );
  return result.rows[0];
}

export async function getBrandById(id: string, workspaceId?: string) {
  const result = workspaceId
    ? await query<BrandProfile>(
        `select
          id,
          workspace_id as "workspaceId",
          name,
          business_summary as "businessSummary",
          audience,
          tone,
          goals,
          banned_phrases as "bannedPhrases",
          required_mentions as "requiredMentions",
          created_at as "createdAt",
          updated_at as "updatedAt"
         from brand_profiles where id = $1 and workspace_id = $2`,
        [id, workspaceId]
      )
    : await query<BrandProfile>(
        `select
          id,
          workspace_id as "workspaceId",
          name,
          business_summary as "businessSummary",
          audience,
          tone,
          goals,
          banned_phrases as "bannedPhrases",
          required_mentions as "requiredMentions",
          created_at as "createdAt",
          updated_at as "updatedAt"
         from brand_profiles where id = $1`,
        [id]
      );

  if (!result.rows[0]) throw new AppError('Brand not found', 404);
  return result.rows[0];
}
