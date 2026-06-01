import React from 'react';
import { pascalCase } from 'change-case';
import clsx from 'clsx';
import type { HomeSankeyDiagramData } from '@/types/api/homes';

type FlowChartProcessEntry = NonNullable<HomeSankeyDiagramData['process_info']>[string] & {
  process_name?: string;
  facilities?: string[];
};

type FlowChartLayoutInput =
  | string[]
  | (Record<string, FlowChartProcessEntry | string[] | undefined> & { times?: string[] });

export interface FlowChartLayoutResult {
  nodeLabels: string[];
  layerTitles: string[];
  processInfo: Record<string, FlowChartProcessEntry> | null;
}

type UnitSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
const UNIT_SIZE_CLASS_MAP: Record<UnitSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export function formatNumberWithComma(value: number | string): string {
  if (typeof value === 'number') return value.toLocaleString();
  if (!isNaN(Number(value))) return Number(value).toLocaleString();
  return value;
}


export function formatTimeTaken(
  time?: { hour?: number; minute?: number; second?: number },
  variant: 'default' | 'histogram' = 'default',
  unitSize?: UnitSize
): React.ReactNode {
  if (!time) return '';
  const { hour = 0, minute = 0, second = 0 } = time;

  // 모든 variant에서 동일한 형식 사용
  return (
    <>
      {hour > 0 && (
        <>
          {hour}
          {formatUnit('h', variant, unitSize)}
          {' '}
        </>
      )}
      {(minute > 0 || hour > 0) && (
        <>
          {minute}
          {formatUnit('m', variant, unitSize)}
          {' '}
        </>
      )}
      {second}
      {formatUnit('s', variant, unitSize)}
    </>
  );
}

export { titleCaseWords as capitalizeFirst } from '@/lib/string';

export function formatUnit(
  unit: string,
  variant: 'default' | 'histogram' = 'default',
  size?: UnitSize
): React.ReactNode {
  const resolvedSize = size ?? (variant === 'histogram' ? 'lg' : 'sm');
  const baseClasses =
    variant === 'histogram'
      ? 'ml-0.5 font-medium text-white'
      : 'ml-0.5 font-normal text-default-500';

  return <span className={clsx(baseClasses, UNIT_SIZE_CLASS_MAP[resolvedSize])}>{unit}</span>;
}

export function formatImageSize(icon: React.ReactNode, size: number): React.ReactNode {
  return (
    <span className="flex items-center justify-center" style={{ width: size, height: size }}>
      {icon}
    </span>
  );
}

/**
 * FlowChart(Sankey)용 라벨 및 레이어 타이틀 생성 함수 - 새로운 계층 구조 지원
 * @param data 백엔드에서 받은 새로운 구조 데이터
 * @returns { nodeLabels: string[], layerTitles: string[], processInfo: FlowChartProcessEntry | null }
 */
export function formatFlowChartLayout(data: FlowChartLayoutInput): FlowChartLayoutResult {
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
  const processInfo: Record<string, FlowChartProcessEntry> = {};

  // 각 프로세스별로 처리
  Object.keys(data).forEach((processKey) => {
    if (processKey === 'times') return; // times는 건너뛰기

    const process = data[processKey] as FlowChartProcessEntry | undefined;
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
