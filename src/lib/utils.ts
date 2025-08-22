import { type ClassValue, clsx } from 'clsx';
import dayjs, { Dayjs } from 'dayjs';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



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
  return (selDiff ? `${selDiff[0]}${selDiff[1]}${selDiff[0] == 1 ? '' : 's'}` : '1 minute') + ' ago';
};


