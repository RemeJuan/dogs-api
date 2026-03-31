import api from '@web/network/api.controller';
import { tokenStorage } from '@web/network/token.storage';

import type { Mock } from 'vitest';
vi.mock('@web/network/api.controller', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@web/network/token.storage', () => ({
  __esModule: true,
  tokenStorage: {
    getAccessToken: vi.fn(),
  },
}));

import {
  getFavourites,
  addFavourite,
  deleteFavourite,
} from '@web/network/favourites.client';

type ApiMock = {
  get: Mock;
  post: Mock;
  delete: Mock;
};

const mockApi = api as unknown as ApiMock;
const mockTokenStorage = tokenStorage as unknown as {
  getAccessToken: Mock;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockTokenStorage.getAccessToken.mockReturnValue('mock-token');
});

describe('favourites.client', () => {
  it('getFavourites - happy path with auth header', async () => {
    const mockResp = {
      favourites: [{ id: '1', breed: 'labrador', imageUrl: 'url' }],
    };
    mockApi.get.mockResolvedValue(mockResp);

    const res = await getFavourites();

    expect(mockApi.get).toHaveBeenCalledWith('/favourites', {
      headers: { Authorization: 'Bearer mock-token' },
    });
    expect(res).toEqual(mockResp);
  });

  it('getFavourites - no token -> no headers passed', async () => {
    mockTokenStorage.getAccessToken.mockReturnValue(null);
    const mockResp = { favourites: [] };
    mockApi.get.mockResolvedValue(mockResp);

    const res = await getFavourites();

    expect(mockApi.get).toHaveBeenCalledWith('/favourites', undefined);
    expect(res).toEqual(mockResp);
  });

  it('addFavourite - happy path', async () => {
    const payload = { breed: 'poodle', imageUrl: 'url-2' };
    const mockResp = { favourite: { id: 'abc', ...payload } };
    mockApi.post.mockResolvedValue(mockResp);

    const res = await addFavourite(payload as any);

    expect(mockApi.post).toHaveBeenCalledWith('/favourites', payload, {
      headers: { Authorization: 'Bearer mock-token' },
    });
    expect(res).toEqual(mockResp);
  });

  it('deleteFavourite - happy path', async () => {
    mockApi.delete.mockResolvedValue(null);

    await deleteFavourite('img-url');

    expect(mockApi.delete).toHaveBeenCalledWith(
      '/favourites/',
      { imageUrl: 'img-url' },
      {
        headers: { Authorization: 'Bearer mock-token' },
      },
    );
  });

  it('propagates api errors', async () => {
    mockApi.get.mockRejectedValue(new Error('network-failure'));

    await expect(getFavourites()).rejects.toThrow('network-failure');
  });
});
