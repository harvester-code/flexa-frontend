import React from 'react';
import { pascalCase } from 'change-case';

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
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatUnit(unit: string): React.ReactNode {
  return <span className="ml-0.5 text-xs font-normal text-default-500">{unit}</span>;
}

export function formatImageSize(icon: React.ReactNode, size: number): React.ReactNode {
  return (
    <span className="flex items-center justify-center" style={{ width: size, height: size }}>
      {icon}
    </span>
  );
}

export function formatFlowChartLabel(label: string): string {
  const lastUnderscore = label.lastIndexOf('_');
  if (lastUnderscore !== -1) {
    const main = label.slice(0, lastUnderscore);
    const last = label.slice(lastUnderscore + 1);
    return `${pascalCase(main)} ${last}`;
  }
  return pascalCase(label);
}

/**
 * FlowChart(Sankey)용 라벨 및 레이어 타이틀 생성 함수 - 새로운 계층 구조 지원
 * @param data 백엔드에서 받은 새로운 구조 데이터
 * @returns { nodeLabels: string[], layerTitles: string[], processInfo: any }
 */
export function formatFlowChartLayout(data: any): { nodeLabels: string[]; layerTitles: string[]; processInfo: any } {
  // 이전 버전과의 호환성 체크
  if (Array.isArray(data)) {
    // 기존 방식 (label 배열)
    const labels = data;
    const nodeLabels = labels.map((label) => {
      const lastUnderscore = label.lastIndexOf('_');
      if (lastUnderscore !== -1) {
        return label.slice(lastUnderscore + 1);
      }
      return label;
    });
    const seen = new Set<string>();
    const layerTitles: string[] = [];
    labels.forEach((label) => {
      const lastUnderscore = label.lastIndexOf('_');
      const main = lastUnderscore !== -1 ? label.slice(0, lastUnderscore) : label;
      const title = pascalCase(main);
      if (!seen.has(title)) {
        seen.add(title);
        layerTitles.push(title);
      }
    });
    return { nodeLabels, layerTitles, processInfo: null };
  }

  // 새로운 계층 구조 방식
  const nodeLabels: string[] = [];
  const layerTitles: string[] = [];
  const processInfo: any = {};

  // 각 프로세스별로 처리
  Object.keys(data).forEach((processKey) => {
    if (processKey === 'times') return; // times는 건너뛰기

    const process = data[processKey];
    if (process && process.process_name && process.facilities) {
      // 레이어 타이틀 추가
      layerTitles.push(process.process_name);

      // 프로세스 정보 저장
      processInfo[processKey] = process;

      // 노드 라벨 추가 (facilities)
      process.facilities.forEach((facility: string) => {
        // Skip 노드는 특별 처리
        if (facility === 'Skip') {
          nodeLabels.push(`${process.process_name} (Skip)`);
        } else {
          nodeLabels.push(facility);
        }
      });
    }
  });

  return { nodeLabels, layerTitles, processInfo };
}
