import { type ClassValue, clsx } from 'clsx';
import dayjs, { Dayjs } from 'dayjs';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createObjectWithNewKeyFromArray(arr: Array<object>, newKey: string = 'ID') {
  if (arr == null) return {};

  const newObj = {};

  for (let i = 0; i < arr.length; i++) {
    const itemCur = arr[i];

    newObj[itemCur[newKey] + ''] = itemCur;
  }

  return newObj;
}

export const replaceAll = (str: string, searchStr: string, replaceStr: string) => {
  return str.split(searchStr).join(replaceStr);
};

export const randInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const createRandomString = (
  length: number = 5,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) => {
  let text = '';

  for (let i = 0; i < length; i++) {
    const randIndex = randInt(0, chars.length - 1);

    text += chars.charAt(randIndex);
  }

  return text;
};

export const numberWithCommas = (x: number) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const delay = (time: number) => new Promise((res) => setTimeout(res, time));

export const timeToRelativeTime = (time?: string | Dayjs) => {
  if (!time) return '';
  const timeCurrent = dayjs(time);
  const minutes = dayjs().diff(timeCurrent, 'minute');
  const hours = minutes / 60;
  const days = hours / 24;
  const months = days / 30;
  const years = days / 365;
  const selDiff = [
    [Math.floor(years), ' year'],
    [Math.floor(months), ' month'],
    [Math.floor(days), ' day'],
    [Math.floor(hours), ' hour'],
    [Math.floor(minutes), ' minute'],
  ].find((val) => Number(val[0]) >= 1);
  return (selDiff ? `${selDiff[0]}${selDiff[1]}${selDiff[0] == 1 ? '' : 's'}` : 'a few minutes') + ' ago';
};

export const deepCompare = (obj1: any, obj2: any) => {
  if (obj1 == obj2) return true;
  if (!obj1 || !obj2) return false;
  if (typeof obj1 != typeof obj2) return false;

  try {
    if (Array.isArray(obj1)) {
      if (!Array.isArray(obj2) || obj1.length != obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepCompare(obj1[i], obj2[i])) return false;
      }
    } else if (typeof obj1 == 'object') {
      if (typeof obj2 != 'object' || Object.keys(obj1).length != Object.keys(obj2).length) return false;
      for (const keyCur in obj1) {
        if (!deepCompare(obj1[keyCur], obj2[keyCur])) return false;
      }
    } else {
      if (obj1 != obj2) return false;
    }
  } catch (e) {
    return false;
  }

  return true;
};
