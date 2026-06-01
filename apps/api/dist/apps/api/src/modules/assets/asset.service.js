import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { AppError } from '../../lib/errors.js';
const assetRoot = join(process.cwd(), 'storage', 'images');
export async function persistGeneratedImage(dataUrl) {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match)
        throw new AppError('Invalid data URL image', 400);
    const mime = match[1];
    const base64 = match[2];
    const extension = mime.includes('png') ? 'png' : 'jpg';
    const filename = `${randomUUID()}.${extension}`;
    const absolutePath = join(assetRoot, filename);
    await mkdir(assetRoot, { recursive: true });
    await writeFile(absolutePath, Buffer.from(base64, 'base64'));
    return { filename, absolutePath, publicUrl: `/static/images/${filename}` };
}
