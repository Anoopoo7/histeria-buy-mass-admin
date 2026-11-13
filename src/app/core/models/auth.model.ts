import { PublicUser } from './user.model';

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  acceptTerms: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  identifier?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface SendPhoneOtpRequest {
  phone: string;
}

export interface SendPhoneOtpResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  cooldownSeconds: number;
}

export interface VerifyPhoneOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyPhoneOtpResponse {
  success: boolean;
  message: string;
}
