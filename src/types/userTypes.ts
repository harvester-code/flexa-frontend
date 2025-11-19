// User 도메인에서 사용하는 타입들

export type UserRole = 'operator' | 'viewer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  profileImageUrl?: string;
  position?: string;
  introduction?: string;
  groupId?: string;
  roleId?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

