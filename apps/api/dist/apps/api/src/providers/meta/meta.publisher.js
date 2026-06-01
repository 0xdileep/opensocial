import { AppError } from '../../lib/errors.js';
import { jsonRequest } from '../../lib/http.js';
import { assertRemoteImageUrl } from '../../lib/remote-media.js';
async function publishFacebookPost(input) {
    const pageId = typeof input.account.meta?.pageId === 'string' ? input.account.meta.pageId : null;
    if (!pageId)
        throw new AppError('Meta Facebook account requires meta.pageId');
    if (input.imageUrl) {
        await assertRemoteImageUrl(input.imageUrl);
        return jsonRequest(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${input.account.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: input.imageUrl,
                caption: input.text,
                published: true
            })
        });
    }
    return jsonRequest(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${input.account.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: input.text })
    });
}
async function getInstagramContainerStatus(containerId, token) {
    return jsonRequest(`https://graph.facebook.com/v20.0/${containerId}?fields=status_code`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
    });
}
async function pollInstagramContainer(containerId, token) {
    let lastStatus = 'UNKNOWN';
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await getInstagramContainerStatus(containerId, token);
        lastStatus = response.status_code || 'UNKNOWN';
        if (lastStatus === 'FINISHED')
            return lastStatus;
        if (lastStatus === 'ERROR' || lastStatus === 'EXPIRED')
            throw new AppError(`Instagram media container failed with status ${lastStatus}`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    throw new AppError(`Instagram media container did not finish in time: ${lastStatus}`, 504);
}
async function publishInstagramPost(input) {
    const instagramBusinessId = typeof input.account.meta?.instagramBusinessId === 'string' ? input.account.meta.instagramBusinessId : null;
    if (!instagramBusinessId)
        throw new AppError('Meta Instagram account requires meta.instagramBusinessId');
    if (!input.imageUrl)
        throw new AppError('Instagram publishing requires imageUrl in this implementation');
    await assertRemoteImageUrl(input.imageUrl);
    const creation = await jsonRequest(`https://graph.facebook.com/v20.0/${instagramBusinessId}/media`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${input.account.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_url: input.imageUrl,
            caption: input.text
        })
    });
    if (!creation.id)
        throw new AppError('Instagram media creation did not return container id');
    await pollInstagramContainer(creation.id, input.account.accessToken);
    return jsonRequest(`https://graph.facebook.com/v20.0/${instagramBusinessId}/media_publish`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${input.account.accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ creation_id: creation.id })
    });
}
export async function publishToMeta(input) {
    if (input.account.platform === 'meta_facebook')
        return publishFacebookPost(input);
    return publishInstagramPost(input);
}
