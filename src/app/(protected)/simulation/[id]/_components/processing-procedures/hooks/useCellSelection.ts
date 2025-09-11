import { useCallback, useRef, useState, useEffect } from "react";

// 드래그 상태 타입 정의
type DragState = {
  type: "cell" | "row" | "column" | null;
  isActive: boolean;
  start: { row: number; col: number } | null;
  isAdditive: boolean;
  originalSelection: Set<string> | null;
};

const DEFAULT_DRAG_STATE: DragState = {
  type: null,
  isActive: false,
  start: null,
  isAdditive: false,
  originalSelection: null,
};

interface UseCellSelectionProps {
  timeSlotCount: number;
  facilityCount: number;
}

export const useCellSelection = ({ timeSlotCount, facilityCount }: UseCellSelectionProps) => {
  // 상태들
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [tempSelectedCells, setTempSelectedCells] = useState<Set<string> | null>(null);
  const [dragState, setDragState] = useState<DragState>(DEFAULT_DRAG_STATE);
  const [shiftSelectStart, setShiftSelectStart] = useState<{ row: number; col: number } | null>(null);
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null);
  const [lastSelectedCol, setLastSelectedCol] = useState<number | null>(null);

  // 실제 표시할 선택된 셀들
  const displaySelectedCells = tempSelectedCells || selectedCells;

  // 최신 상태 참조 (성능 최적화)
  const tempSelectedCellsRef = useRef<Set<string> | null>(null);
  tempSelectedCellsRef.current = tempSelectedCells;

  // 드래그 상태 헬퍼 함수들
  const resetDragState = useCallback(() => ({ ...DEFAULT_DRAG_STATE }), []);

  const createDragState = useCallback((
    type: "cell" | "row" | "column",
    start: { row: number; col: number },
    isAdditive: boolean = false,
    originalSelection: Set<string> | null = null
  ) => ({
    type,
    isActive: true,
    start,
    isAdditive,
    originalSelection,
  }), []);

  // 유틸리티 함수들
  const generateCellRange = useCallback((
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ): Set<string> => {
    const cellIds = new Set<string>();
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        cellIds.add(`${row}-${col}`);
      }
    }
    return cellIds;
  }, []);

  const generateRowCells = useCallback((rowIndex: number): Set<string> => {
    const cellIds = new Set<string>();
    for (let col = 0; col < facilityCount; col++) {
      cellIds.add(`${rowIndex}-${col}`);
    }
    return cellIds;
  }, [facilityCount]);

  const generateColumnCells = useCallback((colIndex: number): Set<string> => {
    const cellIds = new Set<string>();
    for (let row = 0; row < timeSlotCount; row++) {
      cellIds.add(`${row}-${colIndex}`);
    }
    return cellIds;
  }, [timeSlotCount]);

  const generateAllCells = useCallback(() => {
    const allCellIds = new Set<string>();
    for (let row = 0; row < timeSlotCount; row++) {
      for (let col = 0; col < facilityCount; col++) {
        allCellIds.add(`${row}-${col}`);
      }
    }
    return allCellIds;
  }, [timeSlotCount, facilityCount]);

  const generateRowRange = useCallback((
    startRow: number,
    endRow: number
  ): Set<string> => {
    const cellIds = new Set<string>();
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = 0; col < facilityCount; col++) {
        cellIds.add(`${row}-${col}`);
      }
    }
    return cellIds;
  }, [facilityCount]);

  const generateColumnRange = useCallback((
    startCol: number,
    endCol: number
  ): Set<string> => {
    const cellIds = new Set<string>();
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = 0; row < timeSlotCount; row++) {
        cellIds.add(`${row}-${col}`);
      }
    }
    return cellIds;
  }, [timeSlotCount]);

  // 스마트 토글 함수
  const toggleCellIds = useCallback((
    cellIds: Set<string>,
    currentSelection: Set<string>,
    preserveExisting: boolean = false
  ): Set<string> => {
    const newSet = preserveExisting ? new Set(currentSelection) : new Set<string>();

    const selectedCells = Array.from(cellIds).filter((cellId) => newSet.has(cellId));
    const unselectedCells = Array.from(cellIds).filter((cellId) => !newSet.has(cellId));

    if (unselectedCells.length > 0) {
      cellIds.forEach((cellId) => newSet.add(cellId));
    } else {
      cellIds.forEach((cellId) => newSet.delete(cellId));
    }

    return newSet;
  }, []);

  // 드래그 완료 처리
  const finalizeDrag = useCallback(() => {
    if (tempSelectedCells) {
      setSelectedCells(tempSelectedCells);
      setTempSelectedCells(null);
    }
    setDragState(resetDragState);
  }, [tempSelectedCells, resetDragState]);

  // 전역 마우스업 이벤트
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (tempSelectedCellsRef.current) {
        setSelectedCells(tempSelectedCellsRef.current);
        setTempSelectedCells(null);
      }
      setDragState(resetDragState);
    };

    document.addEventListener("mouseup", handleGlobalMouseUp, { passive: true });
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [resetDragState]);

  // 초기화 함수
  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setTempSelectedCells(null);
    setShiftSelectStart(null);
    setLastSelectedRow(null);
    setLastSelectedCol(null);
    setDragState(resetDragState);
  }, [resetDragState]);

  return {
    // 상태
    selectedCells,
    displaySelectedCells,
    dragState,
    shiftSelectStart,
    lastSelectedRow,
    lastSelectedCol,

    // 액션
    setSelectedCells,
    setTempSelectedCells,
    setDragState,
    setShiftSelectStart,
    setLastSelectedRow,
    setLastSelectedCol,

    // 헬퍼 함수들
    generateCellRange,
    generateRowCells,
    generateColumnCells,
    generateAllCells,
    generateRowRange,
    generateColumnRange,
    toggleCellIds,
    createDragState,
    finalizeDrag,
    clearSelection,
  };
};