import { useCallback } from "react";

interface UseContextMenuHandlersProps {
  selectedCells: Set<string>;
  setSelectedCells: (cells: Set<string>) => void;
  setContextMenu: (menu: any) => void;
  generateRowCells: (rowIndex: number) => Set<string>;
  generateColumnCells: (colIndex: number) => Set<string>;
  generateAllCells: () => Set<string>;
}

export function useContextMenuHandlers({
  selectedCells,
  setSelectedCells,
  setContextMenu,
  generateRowCells,
  generateColumnCells,
  generateAllCells,
}: UseContextMenuHandlersProps) {
  // 우클릭 핸들러
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, cellId: string) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 우클릭한 셀을 먼저 선택한 후 적용
        setSelectedCells(new Set([cellId]));
        targetCells = [cellId];
      }

      setContextMenu({
        show: true,
        cellId,
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectedCells, setSelectedCells]
  );

  // 행 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 해당 행에 적용)
  const handleRowRightClick = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 해당 행을 먼저 선택한 후 적용
        const rowCellIds = generateRowCells(rowIndex);
        setSelectedCells(rowCellIds);
        targetCells = Array.from(rowCellIds);
      }

      setContextMenu({
        show: true,
        cellId: `${rowIndex}-0`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateRowCells, selectedCells, setSelectedCells]
  );

  // 열 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 해당 열에 적용)
  const handleColumnRightClick = useCallback(
    (e: React.MouseEvent, colIndex: number) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용 (기존 선택 유지)
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 해당 열을 먼저 선택한 후 적용
        const columnCellIds = generateColumnCells(colIndex);
        setSelectedCells(columnCellIds);
        targetCells = Array.from(columnCellIds);
      }

      setContextMenu({
        show: true,
        cellId: `0-${colIndex}`, // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateColumnCells, selectedCells, setSelectedCells]
  );

  // Time 헤더 우클릭 핸들러 (현재 선택된 셀들 또는 전체 셀에 적용)
  const handleTimeHeaderRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      let targetCells: string[];
      if (selectedCells.size > 0) {
        // 현재 선택된 셀이 있으면 → 모든 선택된 셀에 적용
        targetCells = Array.from(selectedCells);
      } else {
        // 아무것도 선택되지 않은 경우 → 전체 셀에 적용
        const allCellIds = generateAllCells();
        targetCells = Array.from(allCellIds);
      }

      setContextMenu({
        show: true,
        cellId: "0-0", // 첫 번째 셀을 대표로 설정
        targetCells,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [generateAllCells, selectedCells]
  );

  return {
    handleCellRightClick,
    handleRowRightClick,
    handleColumnRightClick,
    handleTimeHeaderRightClick,
  };
}