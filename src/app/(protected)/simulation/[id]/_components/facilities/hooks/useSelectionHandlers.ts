import { useCallback } from "react";
import { useThrottle } from "./useThrottle";
import type { ScheduleDragState } from "../schedule-editor/types";

interface UseSelectionHandlersProps {
  selectedCells: Set<string>;
  setSelectedCells: React.Dispatch<React.SetStateAction<Set<string>>>;
  setTempSelectedCells: (cells: Set<string>) => void;
  shiftSelectStart: { row: number; col: number } | null;
  setShiftSelectStart: (start: { row: number; col: number } | null) => void;
  lastSelectedRow: number | null;
  setLastSelectedRow: (row: number | null) => void;
  lastSelectedCol: number | null;
  setLastSelectedCol: (col: number | null) => void;
  dragState: ScheduleDragState;
  setDragState: (state: ScheduleDragState) => void;
  createDragState: (
    type: "cell" | "row" | "column",
    start: { row: number; col: number },
    isAdditive?: boolean,
    originalSelection?: Set<string> | null
  ) => ScheduleDragState;
  finalizeDrag: () => void;
  generateCellRange: (startRow: number, endRow: number, startCol: number, endCol: number) => Set<string>;
  generateRowCells: (rowIndex: number) => Set<string>;
  generateColumnCells: (colIndex: number) => Set<string>;
  generateRowRange: (startRow: number, endRow: number) => Set<string>;
  generateColumnRange: (startCol: number, endCol: number) => Set<string>;
  generateAllCells: () => Set<string>;
  toggleCellIds: (
    cellIds: Set<string>,
    prev: Set<string>,
    isAdditive: boolean
  ) => Set<string>;
}

export function useSelectionHandlers({
  selectedCells,
  setSelectedCells,
  setTempSelectedCells,
  shiftSelectStart,
  setShiftSelectStart,
  lastSelectedRow,
  setLastSelectedRow,
  lastSelectedCol,
  setLastSelectedCol,
  dragState,
  setDragState,
  createDragState,
  finalizeDrag,
  generateCellRange,
  generateRowCells,
  generateColumnCells,
  generateRowRange,
  generateColumnRange,
  generateAllCells,
  toggleCellIds,
}: UseSelectionHandlersProps) {
  // 범위 선택 함수
  const selectCellRange = useCallback(
    (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const rangeCells = generateCellRange(startRow, endRow, startCol, endCol);
      setSelectedCells(rangeCells);
    },
    [generateCellRange, setSelectedCells]
  );

  // Time 헤더 클릭 핸들러 (전체 선택)
  const handleTimeHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      // 전체 셀 선택
      const allCellIds = generateAllCells();
      setSelectedCells((prev: Set<string>) =>
        toggleCellIds(allCellIds, prev, e.ctrlKey || e.metaKey)
      );

      // Shift 선택 시작점을 첫 번째 셀로 설정
      setShiftSelectStart({ row: 0, col: 0 });
    },
    [generateAllCells, toggleCellIds, setSelectedCells, setShiftSelectStart]
  );

  // 셀 클릭 핸들러 (Shift, Ctrl 클릭 지원)
  const handleCellClick = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && shiftSelectStart) {
        // Shift + 클릭: 범위 선택
        selectCellRange(
          shiftSelectStart.row,
          shiftSelectStart.col,
          rowIndex,
          colIndex
        );
      } else if (e.ctrlKey || e.metaKey) {
        // Cmd/Ctrl + 클릭: 개별 셀 토글
        setSelectedCells((prev: Set<string>) => {
          const newSet = new Set(prev);
          if (newSet.has(cellId)) {
            newSet.delete(cellId);
          } else {
            newSet.add(cellId);
          }
          return newSet;
        });
        // 새로운 Shift 선택 시작점 설정
        setShiftSelectStart({ row: rowIndex, col: colIndex });
      } else {
        // 일반 클릭: 단일 셀 선택
        setSelectedCells(new Set([cellId]));
        // 새로운 Shift 선택 시작점 설정
        setShiftSelectStart({ row: rowIndex, col: colIndex });
      }
    },
    [shiftSelectStart, selectCellRange, setSelectedCells, setShiftSelectStart]
  );

  // 드래그 이벤트 핸들러들 - Cell
  const handleCellMouseDown = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleCellClick(cellId, rowIndex, colIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;

      // 🚀 드래그 시작: 임시 선택 상태 초기화 (성능 최적화)
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, cellId])
        : new Set([cellId]);

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "cell",
          { row: rowIndex, col: colIndex },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setShiftSelectStart({ row: rowIndex, col: colIndex });
    },
    [handleCellClick, selectedCells, setTempSelectedCells, setDragState, createDragState, setShiftSelectStart]
  );

  // 드래그 성능 최적화를 위한 throttled 버전
  const handleCellMouseEnterRaw = useCallback(
    (
      cellId: string,
      rowIndex: number,
      colIndex: number,
      e: React.MouseEvent
    ) => {
      e.preventDefault();
      if (dragState.isActive && dragState.type === "cell" && dragState.start) {
        const rangeCells = generateCellRange(
          dragState.start.row,
          rowIndex,
          dragState.start.col,
          colIndex
        );

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCells,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCells);
        }
      }
    },
    [dragState, generateCellRange, setTempSelectedCells]
  );

  const handleCellMouseEnter = useThrottle(handleCellMouseEnterRaw, 16); // ~60fps

  const handleCellMouseUp = useCallback(() => {
    // 드래그 종료 시 즉시 최종 상태 확정
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  // 열 전체 선택/해제 핸들러 (클릭용)
  const handleColumnClick = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedCol !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 열부터 현재 열까지)
        const rangeCellIds = generateColumnRange(lastSelectedCol, colIndex);
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 열의 모든 셀 ID 생성
        const columnCellIds = generateColumnCells(colIndex);

        setSelectedCells((prev: Set<string>) =>
          toggleCellIds(columnCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 열 기록
      setLastSelectedCol(colIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: 0, col: colIndex });
    },
    [
      generateColumnRange,
      generateColumnCells,
      toggleCellIds,
      setSelectedCells,
      setLastSelectedCol,
      setShiftSelectStart,
      lastSelectedCol,
    ]
  );

  // 열 드래그 핸들러들
  const handleColumnMouseDown = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleColumnClick(colIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;
      const columnCellIds = generateColumnCells(colIndex);

      // 🚀 드래그 시작: 임시 선택 상태 사용
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, ...columnCellIds])
        : columnCellIds;

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "column",
          { row: 0, col: colIndex },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setLastSelectedCol(colIndex);
    },
    [
      generateColumnCells,
      selectedCells,
      setTempSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedCol,
      handleColumnClick,
    ]
  );

  const handleColumnMouseEnterRaw = useCallback(
    (colIndex: number, e: React.MouseEvent) => {
      if (
        dragState.isActive &&
        dragState.type === "column" &&
        dragState.start
      ) {
        e.preventDefault();

        // 드래그 범위의 모든 열 선택
        const rangeCellIds = generateColumnRange(dragState.start.col, colIndex);

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateColumnRange, setTempSelectedCells]
  );

  const handleColumnMouseEnter = useThrottle(handleColumnMouseEnterRaw, 16);

  const handleColumnMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  // 행 전체 선택/해제 핸들러 (클릭용)
  const handleRowClick = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.shiftKey && lastSelectedRow !== null) {
        // Shift + 클릭: 범위 선택 (이전 선택 행부터 현재 행까지)
        const rangeCellIds = generateRowRange(lastSelectedRow, rowIndex);
        setSelectedCells(rangeCellIds);
      } else {
        // 해당 행의 모든 셀 ID 생성
        const rowCellIds = generateRowCells(rowIndex);

        setSelectedCells((prev: Set<string>) =>
          toggleCellIds(rowCellIds, prev, e.ctrlKey || e.metaKey)
        );
      }

      // 마지막 선택 행 기록
      setLastSelectedRow(rowIndex);
      // Shift 선택 시작점 설정
      setShiftSelectStart({ row: rowIndex, col: 0 });
    },
    [
      generateRowRange,
      generateRowCells,
      toggleCellIds,
      setSelectedCells,
      setLastSelectedRow,
      setShiftSelectStart,
      lastSelectedRow,
    ]
  );

  // 행 드래그 핸들러들
  const handleRowMouseDown = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      // Shift 키는 클릭 처리
      if (e.shiftKey) {
        handleRowClick(rowIndex, e);
        return;
      }

      e.preventDefault();

      const isAdditive = e.ctrlKey || e.metaKey;
      const rowCellIds = generateRowCells(rowIndex);

      // 🚀 드래그 시작: 임시 선택 상태 사용
      const newTempSelection = isAdditive
        ? new Set([...selectedCells, ...rowCellIds])
        : rowCellIds;

      setTempSelectedCells(newTempSelection);

      setDragState(
        createDragState(
          "row",
          { row: rowIndex, col: 0 },
          isAdditive,
          isAdditive ? new Set(selectedCells) : null
        )
      );
      setLastSelectedRow(rowIndex);
    },
    [
      generateRowCells,
      selectedCells,
      setTempSelectedCells,
      setDragState,
      createDragState,
      setLastSelectedRow,
      handleRowClick,
    ]
  );

  const handleRowMouseEnterRaw = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      if (dragState.isActive && dragState.type === "row" && dragState.start) {
        e.preventDefault();

        // 드래그 범위의 모든 행 선택
        const rangeCellIds = generateRowRange(dragState.start.row, rowIndex);

        // 🚀 드래그 중: 임시 선택 상태만 업데이트 (성능 최적화)
        if (dragState.isAdditive && dragState.originalSelection) {
          // Cmd + 드래그: 기존 선택 + 새 드래그 영역
          const combinedCells = new Set([
            ...dragState.originalSelection,
            ...rangeCellIds,
          ]);
          setTempSelectedCells(combinedCells);
        } else {
          // 일반 드래그: 드래그 영역만 선택
          setTempSelectedCells(rangeCellIds);
        }
      }
    },
    [dragState, generateRowRange, setTempSelectedCells]
  );

  const handleRowMouseEnter = useThrottle(handleRowMouseEnterRaw, 16);

  const handleRowMouseUp = useCallback(() => {
    requestAnimationFrame(() => {
      finalizeDrag();
    });
  }, [finalizeDrag]);

  return {
    selectCellRange,
    handleTimeHeaderClick,
    handleCellClick,
    handleCellMouseDown,
    handleCellMouseEnter,
    handleCellMouseUp,
    handleColumnClick,
    handleColumnMouseDown,
    handleColumnMouseEnter,
    handleColumnMouseUp,
    handleRowClick,
    handleRowMouseDown,
    handleRowMouseEnter,
    handleRowMouseUp,
  };
}