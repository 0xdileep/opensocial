import { AppError } from '../../lib/errors.js';
import { PlatformAccount } from '../../modules/platforms/platform.service.js';
import { fetchRemoteBinary } from '../../lib/remote-media.js';

interface YouTubePublishInput {
  account: PlatformAccount;
  text: string;
  videoUrl?: string;
}

interface YouTubeUploadResult {
  id?: string;
  snippet?: { title?: string };
  status?: { privacyStatus?: string; uploadStatus?: string };
  processingDetails?: { processingStatus?: string };
}

function getVideoUrl(account: PlatformAccount, explicitVideoUrl?: string) {
  const videoUrl = explicitVideoUrl || (typeof account.meta?.videoUrl === 'string' ? account.meta.videoUrl : null);
  if (!videoUrl) throw new AppError('YouTube publishing requires videoUrl either on input or account.meta.videoUrl');
  return videoUrl;
}

function getUploadMetadata(account: PlatformAccount, text: string) {
  const title = typeof account.meta?.title === 'string' ? account.meta.title : text.slice(0, 95);
  const description = typeof account.meta?.description === 'string' ? account.meta.description : text;
  const tags = Array.isArray(account.meta?.tags) ? account.meta.tags.filter((item): item is string => typeof item === 'string') : [];
  const categoryId = typeof account.meta?.categoryId === 'string' ? account.meta.categoryId : '22';
  const privacyStatus = typeof account.meta?.privacyStatus === 'string' ? account.meta.privacyStatus : 'private';
  if (!['private', 'public', 'unlisted'].includes(privacyStatus)) throw new AppError('Invalid YouTube privacyStatus in account.meta');
  return { title, description, tags, categoryId, privacyStatus };
}

async function startResumableSession(token: string, metadata: ReturnType<typeof getUploadMetadata>, contentType: string, size: number) {
  const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,processingDetails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': contentType,
      'X-Upload-Content-Length': String(size)
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId
      },
      status: {
        privacyStatus: metadata.privacyStatus
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`YouTube resumable session init failed: ${response.status} ${text}`);
  }

  const uploadUrl = response.headers.get('location');
  if (!uploadUrl) throw new AppError('YouTube resumable session did not return upload location');
  return uploadUrl;
}

async function uploadVideo(uploadUrl: string, token: string, buffer: Buffer, contentType: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Length': String(buffer.length),
      'Content-Type': contentType
    },
    body: new Uint8Array(buffer)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`YouTube upload failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<YouTubeUploadResult>;
}

export async function publishToYouTube(input: YouTubePublishInput) {
  const token = input.account.accessToken;
  const videoUrl = getVideoUrl(input.account, input.videoUrl);
  const metadata = getUploadMetadata(input.account, input.text);
  const { buffer, contentType } = await fetchRemoteBinary(videoUrl, 'video');
  const uploadUrl = await startResumableSession(token, metadata, contentType, buffer.length);
  const result = await uploadVideo(uploadUrl, token, buffer, contentType);

  return {
    videoId: result.id,
    privacyStatus: result.status?.privacyStatus ?? metadata.privacyStatus,
    title: result.snippet?.title ?? metadata.title,
    uploadStatus: result.status?.uploadStatus ?? 'uploaded',
    processingStatus: result.processingDetails?.processingStatus ?? null
  };
}
