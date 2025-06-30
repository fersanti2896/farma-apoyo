
export interface User {
    userId: number;
    username: string;
    token: string;
    refreshToken: string;
    fullName: string;
    roleId: number;
    roleDescription: string;
}

export interface StatusUserRequest {
    userName: string;
    status: number;
}

export interface CreateUserRequest {
    firstName: string;
    lastName: string;
    mLastName: string;
    email: string;
    username: string;
    passwordHash: string;
    creditLimit: number;
    availableCredit: number;
    roleId: number;
}