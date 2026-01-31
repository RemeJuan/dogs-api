import * as React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { Wrapper } from '@web/utils/test-utils';
import { useAuthContext } from '@web/context/auth.context';
import * as authClient from '@web/network/auth.client';
import * as jwtUtils from '@web/network/jwt.utils';

function TestLogin() {
  const { user, login, logout } = useAuthContext();

  return React.createElement(
    'div',
    null,
    React.createElement('div', null, user ? user.username : 'no-user'),
    React.createElement(
      'button',
      { onClick: () => void login({ username: 'u', password: 'p' }) },
      'login',
    ),
    React.createElement('button', { onClick: () => logout() }, 'logout'),
  );
}

function TestGetAccessToken() {
  const { getAccessToken, user } = useAuthContext();

  React.useEffect(() => {
    (async () => {
      const token = await getAccessToken();

      const el = document.createElement('div');
      el.setAttribute('data-testid', 'token');
      el.textContent = token ?? 'null';

      document.body.appendChild(el);
    })();
  }, []);

  return React.createElement('div', null, user ? user.username : 'no-user');
}

function ConcurrentRequester() {
  const { getAccessToken } = useAuthContext();

  React.useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([getAccessToken(), getAccessToken()]);

      const el1 = document.createElement('div');
      el1.setAttribute('data-testid', 'token');
      el1.textContent = a ?? 'null';

      const el2 = document.createElement('div');
      el2.setAttribute('data-testid', 'token');
      el2.textContent = b ?? 'null';

      document.body.appendChild(el1);
      document.body.appendChild(el2);
    })();
  }, []);

  return React.createElement('div', null, 'ok');
}

function LoginButtonSwallow() {
  const { login } = useAuthContext();

  return React.createElement(
    'button',
    {
      onClick: () => {
        //eslint-disable-next-line @typescript-eslint/no-empty-function
        void login({ username: 'u', password: 'p' }).catch(() => {});
      },
    },
    'login',
  );
}

function makeJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString(
    'base64url',
  );

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  return `${header}.${body}.sig`;
}

function TokenDisplay() {
  const { getAccessToken } = useAuthContext();

  React.useEffect(() => {
    (async () => {
      const t = await getAccessToken();
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'token');
      el.textContent = t ?? 'null';
      document.body.appendChild(el);
    })();
  }, []);

  return React.createElement('div', null, 'ok');
}

function RefreshStateRequester() {
  const { getAccessToken, isRefreshing } = useAuthContext();

  React.useEffect(() => {
    (async () => {
      void getAccessToken();
    })();
  }, []);

  return React.createElement('div', null, isRefreshing ? 'refreshing' : 'idle');
}

function ScheduleMount() {
  useAuthContext();

  return React.createElement('div', null, 'mounted');
}

describe('useAuth (consolidated tests)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();

    const t = document.querySelector('[data-testid="token"]');
    if (t && t.parentNode) t.parentNode.removeChild(t);

    jest.useRealTimers();
  });

  it('login stores tokens and user', async () => {
    const fakeResp = {
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      id: 1,
      username: 'emily',
      email: 'e@e.com',
      firstName: 'Em',
      lastName: 'P',
      gender: 'female',
      image: 'img',
    };

    jest.spyOn(authClient, 'login').mockResolvedValueOnce(fakeResp as any);

    render(React.createElement(Wrapper, null, React.createElement(TestLogin)));

    expect(screen.getByText('no-user')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('login'));
    });

    await waitFor(() => {
      expect(screen.getByText(/emily/)).toBeDefined();
    });

    expect(sessionStorage.getItem('dogs:accessToken')).toBe('access-1');
    expect(sessionStorage.getItem('dogs:refreshToken')).toBe('refresh-1');

    const stored = sessionStorage.getItem('dogs:user');
    expect(stored).not.toBeNull();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.username).toBe('emily');
    }
  });

  it('getAccessToken refreshes when expired and does not overwrite user', async () => {
    const storedUser = {
      accessToken: 'old',
      refreshToken: 'refresh-old',
      id: 2,
      username: 'stored',
      email: 's@e.com',
      firstName: 'S',
      lastName: 'T',
      gender: 'male',
      image: 'img',
    };

    sessionStorage.setItem('dogs:user', JSON.stringify(storedUser));
    sessionStorage.setItem('dogs:accessToken', 'old');
    sessionStorage.setItem('dogs:refreshToken', 'refresh-old');

    jest.spyOn(jwtUtils, 'isExpired').mockReturnValue(true);
    jest.spyOn(authClient, 'refresh').mockResolvedValueOnce({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(TestGetAccessToken),
      ),
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="token"]')?.textContent).toBe(
        'new-access',
      );
    });

    expect(sessionStorage.getItem('dogs:user')).not.toBeNull();
    const parsed = JSON.parse(sessionStorage.getItem('dogs:user') as string);
    expect(parsed.username).toBe('stored');

    expect(sessionStorage.getItem('dogs:accessToken')).toBe('new-access');
    expect(sessionStorage.getItem('dogs:refreshToken')).toBe('new-refresh');
  });

  it('logout clears storage and user', async () => {
    sessionStorage.setItem('dogs:accessToken', 'x');
    sessionStorage.setItem('dogs:refreshToken', 'r');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    render(React.createElement(Wrapper, null, React.createElement(TestLogin)));

    await act(async () => {
      fireEvent.click(screen.getByText('logout'));
    });

    await waitFor(() => {
      expect(screen.getByText('no-user')).toBeDefined();
    });

    expect(sessionStorage.getItem('dogs:accessToken')).toBeNull();
    expect(sessionStorage.getItem('dogs:refreshToken')).toBeNull();
    expect(sessionStorage.getItem('dogs:user')).toBeNull();
  });

  it('concurrent refresh: multiple callers wait for single refresh', async () => {
    sessionStorage.setItem('dogs:accessToken', 'old');
    sessionStorage.setItem('dogs:refreshToken', 'rf');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    jest.spyOn(jwtUtils, 'isExpired').mockReturnValue(true);

    let resolveRefresh: any;
    const refreshPromise = new Promise((res) => {
      resolveRefresh = res;
    });

    const refreshMock = jest
      .spyOn(authClient, 'refresh')
      .mockImplementation(() => refreshPromise as any);

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(ConcurrentRequester),
      ),
    );

    expect(refreshMock).toHaveBeenCalledTimes(1);

    act(() => resolveRefresh({ accessToken: 'new', refreshToken: 'r2' }));

    await waitFor(() => {
      expect(document.querySelectorAll('[data-testid="token"]').length).toBe(2);
      document.querySelectorAll('[data-testid="token"]').forEach((n) => {
        expect(n.textContent).toBe('new');
      });
    });

    expect(sessionStorage.getItem('dogs:accessToken')).toBe('new');
    expect(sessionStorage.getItem('dogs:refreshToken')).toBe('r2');
  });

  it('login propagates error and does not set tokens on failure', async () => {
    jest.spyOn(authClient, 'login').mockRejectedValueOnce(new Error('bad'));

    render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(LoginButtonSwallow),
      ),
    );

    await act(async () => {
      fireEvent.click(screen.getByText('login'));
    });

    await waitFor(() => {
      expect(sessionStorage.getItem('dogs:accessToken')).toBeNull();
    });
  });

  it('getAccessToken returns current token when not expired', async () => {
    sessionStorage.setItem('dogs:accessToken', 'valid-token');
    sessionStorage.setItem('dogs:refreshToken', 'r');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    jest.spyOn(jwtUtils, 'isExpired').mockReturnValue(false);

    render(
      React.createElement(Wrapper, null, React.createElement(TokenDisplay)),
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="token"]')?.textContent).toBe(
        'valid-token',
      );
    });
  });

  it('missing refresh token during refresh logs out and clears storage', async () => {
    sessionStorage.setItem('dogs:accessToken', 'old');
    sessionStorage.removeItem('dogs:refreshToken');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    jest.spyOn(jwtUtils, 'isExpired').mockReturnValue(true);

    render(
      React.createElement(Wrapper, null, React.createElement(TokenDisplay)),
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="token"]')?.textContent).toBe(
        'null',
      );
    });

    expect(sessionStorage.getItem('dogs:accessToken')).toBeNull();
    expect(sessionStorage.getItem('dogs:refreshToken')).toBeNull();
    expect(sessionStorage.getItem('dogs:user')).toBeNull();
  });

  it('isRefreshing toggles while refresh in progress', async () => {
    sessionStorage.setItem('dogs:accessToken', 'old');
    sessionStorage.setItem('dogs:refreshToken', 'rf');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    jest.spyOn(jwtUtils, 'isExpired').mockReturnValue(true);

    let resolveRefresh: any;
    const refreshPromise = new Promise((res) => {
      resolveRefresh = res;
    });
    jest
      .spyOn(authClient, 'refresh')
      .mockImplementation(() => refreshPromise as any);

    const { getByText } = render(
      React.createElement(
        Wrapper,
        null,
        React.createElement(RefreshStateRequester),
      ),
    );

    await waitFor(() => expect(getByText('refreshing')).toBeDefined());

    act(() => resolveRefresh({ accessToken: 'new', refreshToken: 'r2' }));

    await waitFor(() => expect(getByText('idle')).toBeDefined());

    expect(sessionStorage.getItem('dogs:accessToken')).toBe('new');
    expect(sessionStorage.getItem('dogs:refreshToken')).toBe('r2');
  });

  it('scheduled refresh triggers authClient.refresh after timeout', async () => {
    jest.useRealTimers();
    const laterExp = Math.floor(Date.now() / 1000) + 35;
    const laterToken = makeJwt({ exp: laterExp });

    sessionStorage.setItem('dogs:accessToken', laterToken);
    sessionStorage.setItem('dogs:refreshToken', 'rf');
    sessionStorage.setItem('dogs:user', JSON.stringify({ username: 'u' }));

    jest.useFakeTimers();

    const refreshMock = jest
      .spyOn(authClient, 'refresh')
      .mockResolvedValue({ accessToken: 'new', refreshToken: 'r2' } as any);

    render(
      React.createElement(Wrapper, null, React.createElement(ScheduleMount)),
    );

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => expect(refreshMock).toHaveBeenCalled());

    expect(sessionStorage.getItem('dogs:accessToken')).toBe('new');
    expect(sessionStorage.getItem('dogs:refreshToken')).toBe('r2');
  });
});
