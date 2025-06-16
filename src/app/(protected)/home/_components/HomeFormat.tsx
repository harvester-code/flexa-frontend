import React from 'react';

export function formatNumberWithComma(value: number | string): string {
  if (typeof value === 'number') return value.toLocaleString();
  if (!isNaN(Number(value))) return Number(value).toLocaleString();
  return value;
}

export function formatPercent(value: number | string): string {
  if (typeof value === 'number') return `${Math.round(value)}%`;
  if (!isNaN(Number(value))) return `${Math.round(Number(value))}%`;
  return value as string;
}

export function formatTimeTaken(time?: { hour?: number; minute?: number; second?: number }): React.ReactNode {
  if (!time) return '';
  const { hour = 0, minute = 0, second = 0 } = time;
  return (
    <>
      {hour > 0 && (
        <>
          {hour}
          {formatUnit('h')}{' '}
        </>
      )}
      {(minute > 0 || hour > 0) && (
        <>
          {minute}
          {formatUnit('m')}{' '}
        </>
      )}
      {second}
      {formatUnit('s')}
    </>
  );
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatUnit(unit: string): React.ReactNode {
  return <span style={{ fontSize: '0.6em', marginLeft: '1px' }}>{unit}</span>;
}

export function formatImageSize(icon: React.ReactNode, size: number): React.ReactNode {
  return (
    <span style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </span>
  );
}
