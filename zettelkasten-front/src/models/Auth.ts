import { User } from "./User";

export interface LoginResponse {
    access_token: string;
    user: User;
    message: string;
}

export interface ResetPasswordResponse {
    message: string;
}