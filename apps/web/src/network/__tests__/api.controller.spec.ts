import { ApiController } from '../api.controller';

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
      text: async () => 'error body',
    });

    const api = new ApiController('https://example.com');
    await expect(api.get('/fail')).rejects.toThrow(
      '500 Internal Server Error error body',
    );
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
});
