import { create } from 'zustand';

export type TUserInfo = {
  id: string;
  fullName: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  initials: string;
};

export const useUserInfo = create<{
  userInfo?: TUserInfo;
  accessToken?: string;
  setUserInfo: (info: TUserInfo) => void;
  setAccessToken: (token: string) => void;
}>((set) => ({
  userInfo: undefined,
  setUserInfo: (info)  => set({ userInfo: info }),
  setAccessToken: (token) => set({ accessToken: token }),
}));

export const getUserInfo = useUserInfo.getState;
export const setUserInfo = useUserInfo.setState;
