export type UserRole = 'CUSTOMER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'DEACTIVATED';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole | string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}
