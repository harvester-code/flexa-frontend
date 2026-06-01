import React from "react";
import type { LucideProps } from "lucide-react";
import { ProcessStep } from "@/types/simulationTypes";
import { ParquetMetadataItem } from "@/types/parquet";
import type { PassengerData } from "../../../_stores/store";

export type { ParquetMetadataItem };

export type StateUpdater<T> = T | ((prev: T) => T);

export type ConditionCategoryConfig = {
  icon: React.ComponentType<LucideProps>;
  options: string[];
  colorIndex: number;
};

export type ConditionCategoriesMap = Record<string, ConditionCategoryConfig>;

export interface ProcessCategoryConfig {
  icon: React.ComponentType<LucideProps>;
  options: string[];
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export type ProcessCategoriesMap = Record<string, ProcessCategoryConfig>;

export interface ScheduleDragState {
  type: "cell" | "row" | "column" | null;
  isActive: boolean;
  start: { row: number; col: number } | null;
  isAdditive: boolean;
  originalSelection: Set<string> | null;
}

export interface ScheduleContextMenuState {
  show: boolean;
  cellId: string;
  targetCells: string[];
  x: number;
  y: number;
}

export interface OperatingScheduleEditorProps {
  processFlow: ProcessStep[];
  parquetMetadata?: ParquetMetadataItem[];
  paxDemographics?: PassengerData['pax_demographics'];
}

// 뱃지 타입 정의
export interface BadgeCondition {
  id: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

// 카테고리별 뱃지 타입 정의
export interface CategoryBadge {
  category: string;
  field?: string; // 원본 field 값 (passenger_conditions의 field)
  options: string[];
  colorIndex: number; // 색상 인덱스 추가
  style?: React.CSSProperties; // 인라인 스타일 추가
  /** true이면 현재 시나리오에 존재하지 않는 값을 포함한 뱃지 */
  isInvalid?: boolean;
}

// TimeBlock 타입 정의 (타입 안전성 향상)
export interface TimeBlock {
  period: string;
  process_time_seconds: number;
  activate?: boolean; // 활성화/비활성화 여부 (선택적 필드)
  passenger_conditions: Array<{
    field: string;
    values: string[];
  }>;
}

// Facility 타입 정의 (타입 안전성 향상)
export interface FacilityWithSchedule {
  id: string;
  operating_schedule?: {
    time_blocks: TimeBlock[];
  };
}

// 핸들러 그룹화
export interface TableHandlers {
  timeHeader: {
    onClick: (e: React.MouseEvent) => void;
    onRightClick: (e: React.MouseEvent) => void;
  };
  column: {
    onMouseDown: (colIndex: number, e: React.MouseEvent) => void;
    onMouseEnter: (colIndex: number, e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, colIndex: number) => void;
  };
  row: {
    onMouseDown: (rowIndex: number, e: React.MouseEvent) => void;
    onMouseEnter: (rowIndex: number, e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, rowIndex: number) => void;
  };
  cell: {
    onMouseDown: (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => void;
    onMouseEnter: (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => void;
    onMouseUp: () => void;
    onRightClick: (e: React.MouseEvent, cellId: string) => void;
  };
  onRemoveCategoryBadge: (cellId: string, category: string) => void;
}

// 가상화 설정
export interface VirtualScrollConfig {
  visibleTimeSlots: string[];
  startIndex: number;
  totalHeight: number;
  offsetY: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

// 엑셀 테이블 컴포넌트 분리
export interface ExcelTableProps {
  selectedZone: string;
  currentFacilities: FacilityWithSchedule[];
  timeSlots: string[];
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>;
  cellProcessTimes: Record<string, number>;
  copiedCells?: Set<string>;
  isFullScreen?: boolean;
  virtualScroll: VirtualScrollConfig;
  handlers: TableHandlers;
  isPreviousDay?: boolean;
  currentProcessTime: number;
  isDragging?: boolean;
}
