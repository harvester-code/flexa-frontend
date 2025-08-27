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

/**
 * 프로세스 이름을 사용자 친화적인 형태로 변환
 * @param processName - 변환할 프로세스 이름 (예: "visa_check", "security-screening")
 * @returns 변환된 프로세스 이름 (예: "Visa Check", "Security Screening")
 */
export const formatProcessName = (processName: string): string => {
  if (!processName || typeof processName !== 'string') return '';

  // Handle unknown or empty values
  if (processName.toLowerCase() === 'unknown') {
    return 'Process';
  }

  return (
    processName
      .toLowerCase()
      // 언더스코어와 하이픈을 공백으로 변경
      .replace(/[_-]/g, ' ')
      // 각 단어의 첫 글자를 대문자로 변경 (Title Case)
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim()
  );
};
