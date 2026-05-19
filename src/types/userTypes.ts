// User 도메인에서 사용하는 타입들

export type UserRole = 'operator' | 'viewer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}
