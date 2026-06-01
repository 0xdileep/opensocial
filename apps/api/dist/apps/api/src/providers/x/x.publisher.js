import { AppError } from '../../lib/errors.js';
import { fetchRemoteBinary, assertRemoteImageUrl } from '../../lib/remote-media.js';
function authHeaders(token, extra = {}) {
    return { Authorization: `Bearer ${token}`, ...extra };
}
async function uploadImageToX(token, imageUrl) {
    await assertRemoteImageUrl(imageUrl);
    const { buffer, contentType } = await fetchRemoteBinary(imageUrl, 'image');
    const initRes = await fetch('https://api.x.com/2/media/upload/initialize', {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ total_bytes: buffer.length, media_type: contentType, media_category: 'tweet_image' })
    });
    if (!initRes.ok)
        throw new AppError(`X media initialize failed with ${initRes.status}`);
    const initJson = await initRes.json();
    const mediaId = initJson.data?.id;
    if (!mediaId)
        throw new AppError('X media initialize did not return media id');
    const form = new FormData();
    form.append('media', new Blob([buffer], { type: contentType }));
    form.append('segment_index', '0');
    form.append('media_id', mediaId);
    const appendRes = await fetch('https://api.x.com/2/media/upload/append', {
        method: 'POST',
        headers: authHeaders(token),
        body: form
    });
    if (!appendRes.ok)
        throw new AppError(`X media append failed with ${appendRes.status}`);
    const finalizeRes = await fetch('https://api.x.com/2/media/upload/finalize', {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ media_id: mediaId })
    });
    if (!finalizeRes.ok)
        throw new AppError(`X media finalize failed with ${finalizeRes.status}`);
    return mediaId;
}
export async function publishToX(input) {
    const token = input.account.accessToken;
    if (!input.imageUrl) {
        const response = await fetch('https://api.x.com/2/tweets', {
            method: 'POST',
            headers: authHeaders(token, { 'Content-Type': 'application/json' }),
            body: JSON.stringify({ text: input.text })
        });
        if (!response.ok)
            throw new AppError(`X tweet publish failed with ${response.status}`);
        return response.json();
    }
    const mediaId = await uploadImageToX(token, input.imageUrl);
    const response = await fetch('https://api.x.com/2/tweets', {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: input.text, media: { media_ids: [mediaId] } })
    });
    if (!response.ok)
        throw new AppError(`X tweet publish failed with ${response.status}`);
    return response.json();
}
