import { createRandomString } from '@/lib/utils';
import { RecoilState, atom } from 'recoil';

const PREFIX = 'STORAGE_ATOMS_';

export type TStorageAtomList = {};

// 스토리지에 저장 / 불러오기로 사용 할 atoms
const storageAtoms: TStorageAtomList = {};

export default storageAtoms;
