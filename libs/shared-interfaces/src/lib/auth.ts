export interface LoginRequest {
  username: string;
  password: string;
  expiresInMins?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export interface LoginResponse extends User {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken?: string;
  expiresInMins?: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}