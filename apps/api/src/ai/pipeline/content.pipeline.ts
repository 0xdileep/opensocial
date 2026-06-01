import { GeneratePostInput } from '@social-ai/shared';
import { getBrandById } from '../../modules/brands/brand.service.js';
import { listRecentPostTexts, savePostDraft, updatePostImage } from '../../modules/posts/post.service.js';
import { critiqueAndRewrite } from '../stages/critique.rewrite.js';
import { generateImage } from '../stages/image.generate.js';
import { finalizeImagePrompt } from '../stages/image.prompt.js';
import { reviewImage } from '../stages/image.review.js';
import { generateStrategy } from '../stages/generate.strategy.js';
import { persistGeneratedImage } from '../../modules/assets/asset.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';

export async function runContentPipeline(input: GeneratePostInput) {
  const brand = await getBrandById(input.brandId, input.workspaceId);
  const recentPosts = await listRecentPostTexts(input.brandId, input.workspaceId, 10);

  const generated = await generateStrategy({
    businessSummary: brand.businessSummary,
    audience: brand.audience,
    tone: brand.tone,
    goals: brand.goals,
    recentPosts,
    userPrompt: input.prompt,
    postType: input.postType,
    platforms: input.platforms
  });

  if (!generated) throw new AppError('Strategy generation returned no result', 502);

  const finalText = generated.needsRewrite ? await critiqueAndRewrite(generated.text) : generated.text;

  const draft = await savePostDraft({
    workspaceId: input.workspaceId,
    brandId: input.brandId,
    sourceType: 'manual',
    postType: input.postType,
    textMaster: finalText,
    imagePrompt: generated.imagePrompt,
    qualityScore: generated.qualityScore,
    status: input.requireApproval ? 'pending_approval' : (input.scheduledFor ? 'scheduled' : 'generated'),
    scheduledFor: input.scheduledFor,
    platformTargets: input.platforms.map((platform) => ({ platform, enabled: true }))
  });

  if (!input.withImage) return draft;

  const imagePrompt = finalizeImagePrompt(generated.imagePrompt, brand.name);
  const imageDataUrl = await generateImage(imagePrompt);
  const stored = await persistGeneratedImage(imageDataUrl);
  const imageUrl = `${env.APP_BASE_URL}${stored.publicUrl}`;
  const review = await reviewImage(finalText, imageUrl);
  if (!review) throw new AppError('Image review returned no result', 502);

  if (!review.approved) {
    throw new AppError(`Image review failed: ${review.issues.join(', ')}`, 422);
  }

  return updatePostImage(draft.id, input.workspaceId, imageUrl);
}
