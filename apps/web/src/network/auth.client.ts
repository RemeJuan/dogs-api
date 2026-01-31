import api from '@web/network/api.controller';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@dogs-api/shared-interfaces';

const AUTH_BASE = '/auth';

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return api.post<LoginResponse, LoginRequest>(`${AUTH_BASE}/login`, body);
}

export async function refresh(
  body: RefreshTokenRequest,
): Promise<RefreshTokenResponse> {
  return api.post<RefreshTokenResponse, RefreshTokenRequest>(
    `${AUTH_BASE}/refresh`,
    body,
  );
}
