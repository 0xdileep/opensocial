import { AppError } from './errors.js';
export async function jsonRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new AppError(`HTTP ${response.status}: ${text}`, response.status);
  }
  return response.json() as Promise<T>;
}
