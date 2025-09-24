import React from "react";
import { ProcessStep } from "@/types/simulationTypes";

// Parquet Metadata 타입 정의 (SearchCriteriaSelector와 동일)
export interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

export interface OperatingScheduleEditorProps {
  processFlow: ProcessStep[];
  parquetMetadata?: ParquetMetadataItem[]; // 🆕 동적 데이터 추가
  paxDemographics?: Record<string, any>; // 🆕 승객 정보 추가
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
  options: string[];
  colorIndex: number; // 색상 인덱스 추가
  style?: React.CSSProperties; // 인라인 스타일 추가
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
  currentFacilities: any[];
  timeSlots: string[];
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>;
  copiedCells?: Set<string>; // Cells that are currently copied
  isFullScreen?: boolean;
  virtualScroll: VirtualScrollConfig;
  handlers: TableHandlers;
  isPreviousDay?: boolean;
}
