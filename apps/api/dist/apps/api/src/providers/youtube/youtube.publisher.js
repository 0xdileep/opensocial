import { AppError } from '../../lib/errors.js';
import { fetchRemoteBinary } from '../../lib/remote-media.js';
function getVideoUrl(account, explicitVideoUrl) {
    const videoUrl = explicitVideoUrl || (typeof account.meta?.videoUrl === 'string' ? account.meta.videoUrl : null);
    if (!videoUrl)
        throw new AppError('YouTube publishing requires videoUrl either on input or account.meta.videoUrl');
    return videoUrl;
}
function getUploadMetadata(account, text) {
    const title = typeof account.meta?.title === 'string' ? account.meta.title : text.slice(0, 95);
    const description = typeof account.meta?.description === 'string' ? account.meta.description : text;
    const tags = Array.isArray(account.meta?.tags) ? account.meta.tags.filter((item) => typeof item === 'string') : [];
    const categoryId = typeof account.meta?.categoryId === 'string' ? account.meta.categoryId : '22';
    const privacyStatus = typeof account.meta?.privacyStatus === 'string' ? account.meta.privacyStatus : 'private';
    if (!['private', 'public', 'unlisted'].includes(privacyStatus))
        throw new AppError('Invalid YouTube privacyStatus in account.meta');
    return { title, description, tags, categoryId, privacyStatus };
}
async function startResumableSession(token, metadata, contentType, size) {
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
    if (!uploadUrl)
        throw new AppError('YouTube resumable session did not return upload location');
    return uploadUrl;
}
async function uploadVideo(uploadUrl, token, buffer, contentType) {
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
    return response.json();
}
export async function publishToYouTube(input) {
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
