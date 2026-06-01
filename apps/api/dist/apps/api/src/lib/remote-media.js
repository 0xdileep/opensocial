import { AppError } from './errors.js';
export async function fetchRemoteBinary(remoteUrl, expectedKind) {
    const response = await fetch(remoteUrl);
    if (!response.ok)
        throw new AppError(`Could not fetch remote ${expectedKind}: ${response.status}`, 400);
    const contentType = response.headers.get('content-type') || (expectedKind === 'image' ? 'image/jpeg' : 'video/mp4');
    if (!contentType.includes(expectedKind))
        throw new AppError(`Remote asset is not a ${expectedKind} content-type`, 400);
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType };
}
export async function assertRemoteImageUrl(remoteUrl) {
    const response = await fetch(remoteUrl, { method: 'HEAD' });
    if (!response.ok)
        throw new AppError(`Could not verify remote image URL: ${response.status}`, 400);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.includes('image'))
        throw new AppError('Remote asset is not an image content-type', 400);
    return { contentType };
}
