import { Platform } from '@social-ai/shared';
import { getPlatformAccount } from '../platforms/platform.service.js';
import { getPostById, updatePostStatus } from '../posts/post.service.js';
import { publishToMeta } from '../../providers/meta/meta.publisher.js';
import { publishToLinkedIn } from '../../providers/linkedin/linkedin.publisher.js';
import { publishToX } from '../../providers/x/x.publisher.js';
import { publishToTikTok } from '../../providers/tiktok/tiktok.publisher.js';
import { publishToYouTube } from '../../providers/youtube/youtube.publisher.js';
import { logPublishAttempt } from './publish-attempt.service.js';
import { AppError } from '../../lib/errors.js';

async function publishOne(postId: string, workspaceId: string, platform: Platform, text: string, imageUrl?: string) {
  const account = await getPlatformAccount(workspaceId, platform);
  if (!account) throw new AppError(`No connected account for ${platform}`, 400);

  const requestPayload = { workspaceId, platform, text, hasImage: Boolean(imageUrl) };

  try {
    let result: unknown;
    switch (platform) {
      case 'meta_instagram':
      case 'meta_facebook':
        result = await publishToMeta({ account, text, imageUrl });
        break;
      case 'linkedin':
        result = await publishToLinkedIn({ account, text, imageUrl });
        break;
      case 'x':
        result = await publishToX({ account, text, imageUrl });
        break;
      case 'tiktok':
        result = await publishToTikTok({ account, text, imageUrl });
        break;
      case 'youtube':
        result = await publishToYouTube({ account, text, videoUrl: typeof account.meta?.videoUrl === 'string' ? account.meta.videoUrl : undefined });
        break;
      default:
        throw new AppError(`Unsupported platform ${platform}`, 400);
    }

    await logPublishAttempt({ postId, platform, status: 'success', requestPayload, responsePayload: result });
    return result;
  } catch (error) {
    await logPublishAttempt({
      postId,
      platform,
      status: 'failed',
      requestPayload,
      errorMessage: error instanceof Error ? error.message : 'Unknown publish error'
    });
    throw error;
  }
}

export async function publishPostNow(postId: string, workspaceId: string) {
  const post = await getPostById(postId, workspaceId);
  await updatePostStatus(postId, workspaceId, 'publishing');

  const results = [] as Array<{ platform: Platform; result?: unknown; error?: string }>;
  let hasFailure = false;

  for (const target of post.platformTargets) {
    if (!target.enabled) continue;
    try {
      const result = await publishOne(postId, workspaceId, target.platform, post.textMaster, post.imageUrl);
      results.push({ platform: target.platform, result });
    } catch (error) {
      hasFailure = true;
      results.push({ platform: target.platform, error: error instanceof Error ? error.message : 'Unknown publish error' });
    }
  }

  await updatePostStatus(postId, workspaceId, hasFailure ? 'failed' : 'published');
  return { postId, results, status: hasFailure ? 'failed' : 'published' };
}
