import { AppError } from './errors.js';
export async function jsonRequest(url, init) {
    const response = await fetch(url, init);
    if (!response.ok) {
        const text = await response.text();
        throw new AppError(`HTTP ${response.status}: ${text}`, response.status);
    }
    return response.json();
}
