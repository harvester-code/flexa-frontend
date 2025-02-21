'use client'
import { useEffect } from "react";
import { useRecoilState as useRecoilStateBase, useRecoilValue as useRecoilValueBase, SetterOrUpdater, RecoilValue, RecoilState } from 'recoil';
import { getRecoil as getRecoilBase, setRecoil as setRecoilBase, resetRecoil as resetRecoilBase  } from 'recoil-nexus';
import storageAtoms, { TStorageAtomList } from './storage-atoms';
import memoryAtoms, { TMemoryAtomList } from './memory-atoms';

export type TAtomList = keyof TStorageAtomList | keyof TMemoryAtomList;

export const atoms: { [name: string]: RecoilState<any> } = { ...storageAtoms, ...memoryAtoms };

async function updateValue<T>(atomName: TAtomList, value: T)
{
    const savedValue = localStorage.getItem(atomName);

    if(value != savedValue)
    {
        localStorage.setItem(atomName, JSON.stringify(value));
    }
};

let _isReady = false;

export const isReady = () => _isReady;

// 스토리지에서 불러오기
export const loadFromStorage = async () =>
{
    for(const keyCur in storageAtoms)
    {
        const data = localStorage.getItem(keyCur);

        if(data && data != getRecoilBase(storageAtoms[keyCur]))
        {
            setRecoilBase(storageAtoms[keyCur], JSON.parse(data));
        }
    }

    _isReady = true;
};

// 스토리지에 저장
export const saveToStorage = async () =>
{
    for(const keyCur in storageAtoms)
    {
        localStorage.setItem(keyCur, getRecoilBase(storageAtoms[keyCur]));
    }
};

// 스토리지 초기화
export const resetStorage = async () =>
{
    for(const keyCur in storageAtoms)
    {
        localStorage.delete(keyCur);

        resetRecoilBase(storageAtoms[keyCur]);
    }
};

export function getRecoil<T>(atomName: TAtomList): T
{
    return getRecoilBase<T>(atoms[atomName]);
}

export function setRecoil<T>(atomName: TAtomList, value: T)
{
    if(atomName in storageAtoms)
    {
        updateValue(atomName, value);
    }
    
    return setRecoilBase<T>(atoms[atomName], value);
}

export function resetRecoil(atomName: TAtomList)
{
    if(atomName in storageAtoms)
    {
        localStorage.delete(atomName);
    }
    
    return resetRecoilBase(atoms[atomName]);
}

export function useRecoilState<T>(atomName: TAtomList): [T, SetterOrUpdater<T>]
{
    const [value, setValue] = useRecoilStateBase<T>(atoms[atomName]);

    // storage atom 인 경우 자동 저장
    useEffect(() => 
    {        
        if(atomName in storageAtoms)
        {
            updateValue(atomName, value);
        }
    }, [value]);

    return [value, setValue];
}

export function useRecoilValue<T>(atomName: TAtomList): T
{
    return useRecoilValueBase<T>(atoms[atomName]);
}

export default class RecoilInstance
{
    static get atoms() { return atoms; }

    static async loadFromStorage() { loadFromStorage() }
    static async saveToStorage() { saveToStorage() }
    static async resetStorage() { resetStorage() }
}