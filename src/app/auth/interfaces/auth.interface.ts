
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginDTO {
  userId: number;
  username: string;
  token: string;
  refreshToken: string;
  fullName: string;
  roleId: number;
  roleDescription: string;
}

export interface ApiResponse<T> {
  result: T | null;
  error: {
    code: number;
    message: string;
  } | null;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UsersDTO {
  userId: number;
  firstName: string;
  lastName: string;
  mLastName: string;
  username: string;
  status: number;
  descriptionStatus: string;
  role: string;
}