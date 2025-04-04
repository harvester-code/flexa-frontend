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

export const delay = (time: number) => new Promise(res=>setTimeout(res,time));

export const timeToRelativeTime = (time?: string | Dayjs) => {
  if(!time) return '';  
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