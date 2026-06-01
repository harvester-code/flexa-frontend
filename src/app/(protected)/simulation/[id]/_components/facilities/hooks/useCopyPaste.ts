import { useCallback, useState, useMemo } from "react";
import {
  CategoryBadge,
  FacilityWithSchedule,
  StateUpdater,
} from "../schedule-editor/types";
import type { useUndoHistory } from "./useUndoHistory";

interface CopyPasteData {
  cells: Array<{
    row: number;
    col: number;
    badges: CategoryBadge[];
    disabled: boolean;
    processTime?: number;
  }>;
  shape: { rows: number; cols: number };
  startCell: { row: number; col: number };
}

interface UseCopyPasteProps {
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>;
  cellProcessTimes: Record<string, number>;
  timeSlots: string[];
  currentFacilities: FacilityWithSchedule[];
  setCellBadges: (badges: Record<string, CategoryBadge[]>) => void;
  setDisabledCells: (cells: Set<string>) => void;
  setCellProcessTimes: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setSelectedCells: (cells: Set<string>) => void;
  undoHistory: ReturnType<typeof useUndoHistory>;
}

export const useCopyPaste = ({
  selectedCells,
  cellBadges,
  disabledCells,
  cellProcessTimes,
  timeSlots,
  currentFacilities,
  setCellBadges,
  setDisabledCells,
  setCellProcessTimes,
  setSelectedCells,
  undoHistory,
}: UseCopyPasteProps) => {
  // Copy/Paste state management
  const [copiedData, setCopiedData] = useState<CopyPasteData | null>(null);
  const [showMarchingAnts, setShowMarchingAnts] = useState(false);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [pendingPasteData, setPendingPasteData] = useState<{
    targetCells: Set<string>;
    copiedData: CopyPasteData;
  } | null>(null);

  // Computed set of copied cells for visualization
  const copiedCells = useMemo(() => {
    if (!copiedData || !showMarchingAnts) return new Set<string>();
    return new Set(copiedData.cells.map((cell) => `${cell.row}-${cell.col}`));
  }, [copiedData, showMarchingAnts]);

  // Handle copy operation
  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return;

    const cellsArray = Array.from(selectedCells).map((cellId) => {
      const [row, col] = cellId.split("-").map(Number);
      return {
        row,
        col,
        badges: cellBadges[cellId] || [],
        disabled: disabledCells.has(cellId),
        processTime: cellProcessTimes[cellId],
      };
    });

    // Calculate shape of copied area
    const rows = cellsArray.map((c) => c.row);
    const cols = cellsArray.map((c) => c.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    setCopiedData({
      cells: cellsArray,
      shape: {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1,
      },
      startCell: { row: minRow, col: minCol },
    });

    // Show marching ants
    setShowMarchingAnts(true);
  }, [selectedCells, cellBadges, disabledCells, cellProcessTimes]);

  const executePaste = useCallback(
    (targetCells: Set<string>, pasteData: CopyPasteData) => {
      const previousStates = new Map<
        string,
        { badges: CategoryBadge[]; disabled: boolean; processTime?: number }
      >();
      const targetCellsArray = Array.from(targetCells).map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        previousStates.set(cellId, {
          badges: cellBadges[cellId] || [],
          disabled: disabledCells.has(cellId),
          processTime: cellProcessTimes[cellId],
        });
        return { row, col, cellId };
      });

      const targetMinRow = Math.min(...targetCellsArray.map((c) => c.row));
      const targetMinCol = Math.min(...targetCellsArray.map((c) => c.col));

      const newBadges = { ...cellBadges };
      const newDisabledCells = new Set(disabledCells);
      const newProcessTimes = { ...cellProcessTimes };

      targetCellsArray.forEach((target) => {
        let sourceCellData:
          | {
              row: number;
              col: number;
              badges: CategoryBadge[];
              disabled: boolean;
              processTime?: number;
            }
          | undefined = undefined;

        if (pasteData.shape.rows === 1 && pasteData.shape.cols === 1) {
          sourceCellData = pasteData.cells[0];
        } else if (pasteData.shape.rows === 1) {
          const relativeCol =
            (target.col - targetMinCol) % pasteData.shape.cols;
          sourceCellData = pasteData.cells.find(
            (c) =>
              c.row === pasteData.startCell.row &&
              c.col - pasteData.startCell.col === relativeCol
          );
        } else if (pasteData.shape.cols === 1) {
          const relativeRow =
            (target.row - targetMinRow) % pasteData.shape.rows;
          sourceCellData = pasteData.cells.find(
            (c) =>
              c.col === pasteData.startCell.col &&
              c.row - pasteData.startCell.row === relativeRow
          );
        } else {
          const relativeRow =
            (target.row - targetMinRow) % pasteData.shape.rows;
          const relativeCol =
            (target.col - targetMinCol) % pasteData.shape.cols;

          sourceCellData = pasteData.cells.find(
            (c) =>
              c.row - pasteData.startCell.row === relativeRow &&
              c.col - pasteData.startCell.col === relativeCol
          );
        }

        if (sourceCellData) {
          if (sourceCellData.badges.length > 0) {
            newBadges[target.cellId] = [...sourceCellData.badges];
          } else {
            delete newBadges[target.cellId];
          }

          if (sourceCellData.disabled) {
            newDisabledCells.add(target.cellId);
          } else {
            newDisabledCells.delete(target.cellId);
          }

          if (sourceCellData.processTime !== undefined) {
            newProcessTimes[target.cellId] = sourceCellData.processTime;
          } else {
            delete newProcessTimes[target.cellId];
          }
        }
      });

      setCellBadges(newBadges);
      setDisabledCells(newDisabledCells);
      setCellProcessTimes(newProcessTimes);
      setSelectedCells(targetCells);

      undoHistory.pushHistory({
        type: "paste",
        targetCells: Array.from(targetCells),
        previousStates,
        newStates: new Map(
          Array.from(targetCells).map((cellId) => [
            cellId,
            {
              badges: newBadges[cellId] || [],
              disabled: newDisabledCells.has(cellId),
              processTime: newProcessTimes[cellId],
            },
          ])
        ),
      });
    },
    [cellBadges, disabledCells, cellProcessTimes, setCellBadges, setDisabledCells, setCellProcessTimes, setSelectedCells, undoHistory]
  );

  // Handle paste operation
  const handlePaste = useCallback(() => {
    if (!copiedData || selectedCells.size === 0) return;

    const targetCellsArray = Array.from(selectedCells).map((cellId) => {
      const [row, col] = cellId.split("-").map(Number);
      return { row, col, cellId };
    });

    // Calculate target shape
    const targetRows = targetCellsArray.map((c) => c.row);
    const targetCols = targetCellsArray.map((c) => c.col);
    const targetMinRow = Math.min(...targetRows);
    const targetMaxRow = Math.max(...targetRows);
    const targetMinCol = Math.min(...targetCols);
    const targetMaxCol = Math.max(...targetCols);
    const targetShape = {
      rows: targetMaxRow - targetMinRow + 1,
      cols: targetMaxCol - targetMinCol + 1,
    };

    // Pattern C: Multiple cells → Single cell
    // When single cell is selected, paste the entire copied shape starting from that cell
    if (
      selectedCells.size === 1 &&
      (copiedData.shape.rows > 1 || copiedData.shape.cols > 1)
    ) {
      // Expand selection to match copied shape, trim at table boundaries
      const expandedCells = new Set<string>();
      for (let r = 0; r < copiedData.shape.rows; r++) {
        for (let c = 0; c < copiedData.shape.cols; c++) {
          const newRow = targetMinRow + r;
          const newCol = targetMinCol + c;
          // Check bounds - trim at table edges (Excel behavior)
          if (newRow < timeSlots.length && newCol < currentFacilities.length) {
            expandedCells.add(`${newRow}-${newCol}`);
          }
        }
      }
      executePaste(expandedCells, copiedData);
      return;
    }

    // Pattern B: Single cell → Multiple cells
    // When copying single cell to multiple cells, fill all selected cells
    if (copiedData.shape.rows === 1 && copiedData.shape.cols === 1) {
      executePaste(selectedCells, copiedData);
      return;
    }

    // Pattern D: Row/Column repeat
    // Check if it's a single row or column being repeated
    const isSingleRow =
      copiedData.shape.rows === 1 && copiedData.shape.cols > 1;
    const isSingleCol =
      copiedData.shape.cols === 1 && copiedData.shape.rows > 1;

    if (isSingleRow && targetShape.cols === copiedData.shape.cols) {
      // Single row copied, repeat for all selected rows
      executePaste(selectedCells, copiedData);
      return;
    }

    if (isSingleCol && targetShape.rows === copiedData.shape.rows) {
      // Single column copied, repeat for all selected columns
      executePaste(selectedCells, copiedData);
      return;
    }

    // Pattern A: 1:1 matching or exact multiples
    const isExactMatch =
      copiedData.shape.rows === targetShape.rows &&
      copiedData.shape.cols === targetShape.cols;
    const isExactMultiple =
      targetShape.rows % copiedData.shape.rows === 0 &&
      targetShape.cols % copiedData.shape.cols === 0;

    if (isExactMatch || isExactMultiple) {
      // Direct paste or pattern repeat
      executePaste(selectedCells, copiedData);
      return;
    }

    // Size mismatch - show warning
    setPendingPasteData({ targetCells: selectedCells, copiedData });
    setShowPasteWarning(true);
  }, [copiedData, selectedCells, timeSlots, currentFacilities, executePaste]);

  return {
    // State
    copiedData,
    showMarchingAnts,
    copiedCells,
    showPasteWarning,
    pendingPasteData,

    // Setters
    setCopiedData,
    setShowMarchingAnts,
    setShowPasteWarning,
    setPendingPasteData,

    // Handlers
    handleCopy,
    handlePaste,
    executePaste,
  };
};
