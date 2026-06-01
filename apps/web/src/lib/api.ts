export class ApiClientError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-workspace-id': 'demo-workspace',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const body = await response.json() as { message?: string };
      if (body?.message) errorMessage = body.message;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new ApiClientError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(path: string) {
    return apiRequest<T>(path);
  },
  post<T>(path: string, body?: unknown) {
    return apiRequest<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  }
};
