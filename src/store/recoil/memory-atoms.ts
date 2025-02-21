import { createRandomString } from '@/lib/utils';
import { RecoilState, atom } from 'recoil';

const PREFIX = 'MEMORY_ATOMS_';

export type TUserInfo = {
  fullName: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  initials: string;
};

export type TMemoryAtomList = {
  userInfo: RecoilState<TUserInfo>;
  accessToken: RecoilState<string>;
};

// 메모리에만 올려두고 사용 할 atoms
const memoryAtoms: TMemoryAtomList = {
  userInfo: atom<TUserInfo>({
    key: PREFIX + 'userInfo' + createRandomString(10),
    default: undefined,
  }),
  accessToken: atom<string>({
    key: PREFIX + 'accessToken' + createRandomString(10),
    default: undefined,
  }),
};

export default memoryAtoms;
