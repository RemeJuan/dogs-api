export type Json = Record<string, unknown>;

const API_BASE = '/api';

export class ApiController {
  constructor(private baseUrl = '') {}

  private buildUrl(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    };

    const res = await fetch(this.buildUrl(path), { ...opts, headers });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${res.status} ${res.statusText} ${text}`);
    }

    if (res.status === 204) return null as unknown as T;

    return (await res.json()) as T;
  }

  get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T, B = Json>(path: string, body?: B) {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

const api = new ApiController(API_BASE);
export default api;
