import { ApiController } from '../api.controller';
import apiDefault from '../api.controller';

describe('ApiController', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete (global as any).fetch;
  });

  it('calls fetch with correct url and headers on get', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ hello: 'world' }),
    });

    const api = new ApiController('https://example.com');
    const res = await api.get('/test');

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );

    expect(res).toEqual({ hello: 'world' });
  });

  it('returns null on 204', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const api = new ApiController('https://example.com');
    const res = await api.get('/empty');
    expect(res).toBeNull();
  });

  it('throws on non-ok response', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'error body' }),
    });

    const api = new ApiController('https://example.com');
    await expect(api.get('/fail')).rejects.toThrow('error body');
  });

  it('post sends JSON body', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    const api = new ApiController('https://example.com');
    const res = await api.post('/items', { name: 'a' });

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://example.com/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'a' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );

    expect(res).toEqual({ id: 1 });
  });

  it('delete calls fetch with DELETE and returns JSON', async () => {
    const fake = { deleted: true };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fake,
    });

    const c = new ApiController('https://example.com');
    const res = await c.delete('/item/1');

    expect((global as any).fetch).toHaveBeenCalledWith(
      'https://example.com/item/1',
      expect.objectContaining({ method: 'DELETE' }),
    );

    expect(res).toEqual(fake);
  });

  it("default exported api uses '/api' base", async () => {
    const fake = { pong: true };
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fake,
    });

    const res = await apiDefault.get('/ping');

    expect((global as any).fetch).toHaveBeenCalledWith(
      '/api/ping',
      expect.any(Object),
    );
    expect(res).toEqual(fake);
  });

  it('merges provided headers with Content-Type when calling request', async () => {
    const spyFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    (global as any).fetch = spyFetch;

    const c = new ApiController('https://api.test');

    const result = await (c as any).request('/x', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
      body: JSON.stringify({ a: 1 }),
    });

    expect(spyFetch).toHaveBeenCalled();
    const calledArgs = spyFetch.mock.calls[0];
    const opts = calledArgs[1] as RequestInit & {
      headers: Record<string, string>;
    };

    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.headers['Authorization']).toBe('Bearer token');
    expect(result).toEqual({ ok: true });
  });

  it('throws when response not ok and res.text throws', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new Error('boom');
      },
    });

    const c = new ApiController('https://x');

    await expect(c.get('/fail')).rejects.toThrow('boom');
  });

  it('throws when fetch itself rejects (network error)', async () => {
    (global as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error('network boom'));

    const c = new ApiController('https://x');

    await expect(c.get('/net')).rejects.toThrow('network boom');
  });
});
