import { create } from 'zustand';

export type TUserInfo = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  profileImageUrl?: string;
  position: string;
  introduction: string;
  groupId: number;
  roleId: number;
  createdAt: string;
  updatedAt?: string;
};

export const useUserInfo = create<{
  userInfo?: TUserInfo;
  accessToken?: string;
  setUserInfo: (info: TUserInfo) => void;
  setAccessToken: (token: string) => void;
}>((set) => ({
  userInfo: undefined,
  setUserInfo: (info) => set({ userInfo: info }),
  setAccessToken: (token) => set({ accessToken: token }),
}));

export const getUserInfo = useUserInfo.getState;
export const setUserInfo = useUserInfo.setState;
