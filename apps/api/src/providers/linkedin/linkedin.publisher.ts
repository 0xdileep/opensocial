import { AppError } from '../../lib/errors.js';
import { jsonRequest } from '../../lib/http.js';
import { PlatformAccount } from '../../modules/platforms/platform.service.js';
import { fetchRemoteBinary, assertRemoteImageUrl } from '../../lib/remote-media.js';

interface LinkedInPublishInput {
  account: PlatformAccount;
  text: string;
  imageUrl?: string;
}

function baseHeaders(token: string, extra: Record<string, string> = {}) {
  return {
    Authorization: `Bearer ${token}`,
    'X-Restli-Protocol-Version': '2.0.0',
    ...extra
  };
}

async function getPostLifecycleState(token: string, ugcPostUrn: string) {
  const encodedUrn = encodeURIComponent(ugcPostUrn);
  const response = await fetch(`https://api.linkedin.com/rest/posts/${encodedUrn}?viewContext=AUTHOR`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version': '202605'
    }
  });

  if (!response.ok) return null;
  return response.json() as Promise<{ lifecycleState?: string }>;
}

export async function publishToLinkedIn(input: LinkedInPublishInput) {
  const authorUrn = String(input.account.meta.authorUrn ?? '');
  if (!authorUrn) throw new AppError('LinkedIn account requires meta.authorUrn');

  if (!input.imageUrl) {
    return jsonRequest('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: baseHeaders(input.account.accessToken, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: input.text },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });
  }

  await assertRemoteImageUrl(input.imageUrl);
  const register = await jsonRequest<{
    value: {
      asset: string;
      uploadMechanism: {
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': { uploadUrl: string };
      };
    };
  }>('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: baseHeaders(input.account.accessToken, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }]
      }
    })
  });

  const uploadUrl = register.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = register.value.asset;
  const { buffer, contentType } = await fetchRemoteBinary(input.imageUrl, 'image');
  const upload = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(buffer)
  });

  if (!upload.ok) throw new AppError(`LinkedIn media upload failed with ${upload.status}`);

  const publishResult = await jsonRequest<{ id?: string }>('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: baseHeaders(input.account.accessToken, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: input.text },
          shareMediaCategory: 'IMAGE',
          media: [{ status: 'READY', media: asset }]
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    })
  });

  if (!publishResult.id) return publishResult;
  const state = await getPostLifecycleState(input.account.accessToken, publishResult.id);
  return {
    ...publishResult,
    lifecycleState: state?.lifecycleState ?? null
  };
}
