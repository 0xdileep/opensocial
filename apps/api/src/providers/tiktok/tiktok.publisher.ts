import { AppError } from '../../lib/errors.js';
import { jsonRequest } from '../../lib/http.js';
import { PlatformAccount } from '../../modules/platforms/platform.service.js';

interface TikTokPublishInput {
  account: PlatformAccount;
  text: string;
  imageUrl?: string;
}

interface TikTokInitUploadResponse {
  data?: {
    publish_id?: string;
    upload_url?: string;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

interface TikTokContentInitResponse {
  data?: {
    publish_id?: string;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

interface TikTokStatusResponse {
  data?: {
    status?: string;
    fail_reason?: string;
    publicaly_available_post_id?: string;
  };
  error?: {
    code?: string;
    message?: string;
    log_id?: string;
  };
}

function getCreatorInfo(account: PlatformAccount) {
  const openId = typeof account.meta?.openId === 'string' ? account.meta.openId : null;
  if (!openId) throw new AppError('TikTok account meta.openId is required');
  return { openId };
}

function getVideoUrl(account: PlatformAccount) {
  const videoUrl = typeof account.meta?.videoUrl === 'string' ? account.meta.videoUrl : null;
  if (!videoUrl) throw new AppError('TikTok requires meta.videoUrl for video publishing');
  return videoUrl;
}

function getPhotoUrls(account: PlatformAccount, explicitImageUrl?: string) {
  const metaPhotoImages = Array.isArray(account.meta?.photoImages)
    ? account.meta.photoImages.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];
  const urls = explicitImageUrl ? [explicitImageUrl, ...metaPhotoImages] : metaPhotoImages;
  const unique = [...new Set(urls)];
  if (unique.length === 0) throw new AppError('TikTok photo posting requires imageUrl or meta.photoImages');
  return unique;
}

function getPrivacyLevel(account: PlatformAccount) {
  const privacyLevel = typeof account.meta?.privacyLevel === 'string' ? account.meta.privacyLevel : 'SELF_ONLY';
  const allowed = new Set(['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'FOLLOWER_OF_CREATOR', 'SELF_ONLY']);
  if (!allowed.has(privacyLevel)) throw new AppError('Invalid TikTok privacyLevel in meta');
  return privacyLevel;
}

function getPostMode(account: PlatformAccount) {
  const postMode = typeof account.meta?.postMode === 'string' ? account.meta.postMode : 'DIRECT_POST';
  const allowed = new Set(['DIRECT_POST', 'MEDIA_UPLOAD']);
  if (!allowed.has(postMode)) throw new AppError('Invalid TikTok postMode in meta');
  return postMode;
}

async function initVideoUpload(token: string, openId: string, caption: string, privacyLevel: string) {
  const payload = {
    post_info: {
      title: caption.slice(0, 90),
      privacy_level: privacyLevel,
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: 'FILE_UPLOAD'
    },
    creator_info: {
      open_id: openId
    }
  };

  const result = await jsonRequest<TikTokInitUploadResponse>('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (result.error?.message) throw new AppError(`TikTok init failed: ${result.error.message}`);
  const publishId = result.data?.publish_id;
  const uploadUrl = result.data?.upload_url;
  if (!publishId || !uploadUrl) throw new AppError('TikTok init did not return publish_id and upload_url');
  return { publishId, uploadUrl };
}

async function initPhotoPost(token: string, caption: string, photoImages: string[], postMode: string) {
  const payload = {
    post_info: {
      title: caption.slice(0, 90),
      description: caption
    },
    source_info: {
      source: 'PULL_FROM_URL',
      photo_cover_index: 1,
      photo_images: photoImages
    },
    post_mode: postMode,
    media_type: 'PHOTO'
  };

  const result = await jsonRequest<TikTokContentInitResponse>('https://open.tiktokapis.com/v2/post/publish/content/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (result.error?.message) throw new AppError(`TikTok photo init failed: ${result.error.message}`);
  const publishId = result.data?.publish_id;
  if (!publishId) throw new AppError('TikTok photo init did not return publish_id');
  return { publishId };
}

async function uploadVideoFromRemoteUrl(uploadUrl: string, remoteUrl: string) {
  const mediaResponse = await fetch(remoteUrl);
  if (!mediaResponse.ok) throw new AppError(`Could not fetch remote video: ${mediaResponse.status}`);
  const contentType = mediaResponse.headers.get('content-type') || 'video/mp4';
  if (!contentType.includes('video')) throw new AppError('TikTok remote asset is not a video content-type');
  const videoBuffer = Buffer.from(await mediaResponse.arrayBuffer());
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(videoBuffer.length)
    },
    body: new Uint8Array(videoBuffer)
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new AppError(`TikTok upload failed: ${uploadResponse.status} ${text}`);
  }
}

async function getPublishStatus(token: string, publishId: string) {
  const result = await jsonRequest<TikTokStatusResponse>('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ publish_id: publishId })
  });

  if (result.error?.message) throw new AppError(`TikTok status fetch failed: ${result.error.message}`);
  return result.data ?? {};
}

async function pollStatus(token: string, publishId: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const status = await getPublishStatus(token, publishId);
    const state = status.status || 'UNKNOWN';
    if (state === 'PUBLISH_COMPLETE' || state === 'SEND_TO_USER_INBOX') return status;
    if (state === 'FAILED') throw new AppError(`TikTok publish failed: ${status.fail_reason || 'Unknown failure'}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return getPublishStatus(token, publishId);
}

export async function publishToTikTok(input: TikTokPublishInput) {
  const token = input.account.accessToken;

  if (input.imageUrl) {
    const photoImages = getPhotoUrls(input.account, input.imageUrl);
    const postMode = getPostMode(input.account);
    const { publishId } = await initPhotoPost(token, input.text, photoImages, postMode);
    const status = await pollStatus(token, publishId);

    return {
      publishId,
      mediaType: 'PHOTO',
      status: status.status ?? 'UNKNOWN',
      postId: status.publicaly_available_post_id ?? null,
      failReason: status.fail_reason ?? null
    };
  }

  const { openId } = getCreatorInfo(input.account);
  const videoUrl = getVideoUrl(input.account);
  const privacyLevel = getPrivacyLevel(input.account);

  const { publishId, uploadUrl } = await initVideoUpload(token, openId, input.text, privacyLevel);
  await uploadVideoFromRemoteUrl(uploadUrl, videoUrl);
  const status = await pollStatus(token, publishId);

  return {
    publishId,
    mediaType: 'VIDEO',
    status: status.status ?? 'UNKNOWN',
    postId: status.publicaly_available_post_id ?? null,
    failReason: status.fail_reason ?? null
  };
}
