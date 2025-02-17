'use client';

import { createContext } from 'react';

export type UserInfo = {
  fullName: string;
  email: string;
  firstName: string | undefined;
  lastName: string | undefined;
  profileImage?: string | undefined;
  initials: string;
};

export const UserContext = createContext<UserInfo | null>(null);

export default function UserProvider({
  children,
  userInfo,
}: {
  children: React.ReactNode;
  userInfo: UserInfo;
}) {
  return <UserContext.Provider value={userInfo}>{children}</UserContext.Provider>;
}
