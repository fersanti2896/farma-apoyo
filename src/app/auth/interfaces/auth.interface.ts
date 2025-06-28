
export interface LoginRequest {
    Username: string;
    Password: string;
}

export interface LoginDTO {
    UserId: number;
    Username: string;
    Token: string;
    RefreshToken: string;
    FullName: string;
    RoleId: number;
    RoleDescription: string;
}

export interface ApiResponse<T> {
  result: T | null;
  error: {
    code: number;
    message: string;
  } | null;
}