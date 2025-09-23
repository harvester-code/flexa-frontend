import { useCallback, useState, useMemo } from "react";
import { CategoryBadge } from "../types";

interface CopyPasteData {
  cells: Array<{
    row: number;
    col: number;
    badges: CategoryBadge[];
    disabled: boolean;
  }>;
  shape: { rows: number; cols: number };
  startCell: { row: number; col: number };
}

interface UseCopyPasteProps {
  selectedCells: Set<string>;
  cellBadges: Record<string, CategoryBadge[]>;
  disabledCells: Set<string>;
  timeSlots: string[];
  currentFacilities: any[];
  setCellBadges: (badges: Record<string, CategoryBadge[]>) => void;
  setDisabledCells: (cells: Set<string>) => void;
  undoHistory: any;
}

export const useCopyPaste = ({
  selectedCells,
  cellBadges,
  disabledCells,
  timeSlots,
  currentFacilities,
  setCellBadges,
  setDisabledCells,
  undoHistory,
}: UseCopyPasteProps) => {
  // Copy/Paste state management
  const [copiedData, setCopiedData] = useState<CopyPasteData | null>(null);
  const [showMarchingAnts, setShowMarchingAnts] = useState(false);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [pendingPasteData, setPendingPasteData] = useState<{
    targetCells: Set<string>;
    copiedData: any;
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
  }, [selectedCells, cellBadges, disabledCells]);

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
  }, [copiedData, selectedCells, timeSlots, currentFacilities]);

  // Execute the paste operation
  const executePaste = useCallback(
    (targetCells: Set<string>, copiedData: any) => {
      const previousStates = new Map<
        string,
        { badges: CategoryBadge[]; disabled: boolean }
      >();
      const targetCellsArray = Array.from(targetCells).map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        previousStates.set(cellId, {
          badges: cellBadges[cellId] || [],
          disabled: disabledCells.has(cellId),
        });
        return { row, col, cellId };
      });

      // Calculate offsets
      const targetMinRow = Math.min(...targetCellsArray.map((c) => c.row));
      const targetMinCol = Math.min(...targetCellsArray.map((c) => c.col));

      // Apply paste
      const newBadges = { ...cellBadges };
      const newDisabledCells = new Set(disabledCells);

      targetCellsArray.forEach((target) => {
        let sourceCellData:
          | {
              row: number;
              col: number;
              badges: CategoryBadge[];
              disabled: boolean;
            }
          | undefined = undefined;

        // Pattern B: Single cell copy - use the same cell for all targets
        if (copiedData.shape.rows === 1 && copiedData.shape.cols === 1) {
          sourceCellData = copiedData.cells[0];
        }
        // Pattern D: Single row repeat
        else if (copiedData.shape.rows === 1) {
          const relativeCol =
            (target.col - targetMinCol) % copiedData.shape.cols;
          sourceCellData = copiedData.cells.find(
            (c) =>
              c.row === copiedData.startCell.row &&
              c.col - copiedData.startCell.col === relativeCol
          );
        }
        // Pattern D: Single column repeat
        else if (copiedData.shape.cols === 1) {
          const relativeRow =
            (target.row - targetMinRow) % copiedData.shape.rows;
          sourceCellData = copiedData.cells.find(
            (c) =>
              c.col === copiedData.startCell.col &&
              c.row - copiedData.startCell.row === relativeRow
          );
        }
        // Pattern A & C: Normal grid paste with wrapping
        else {
          const relativeRow =
            (target.row - targetMinRow) % copiedData.shape.rows;
          const relativeCol =
            (target.col - targetMinCol) % copiedData.shape.cols;

          sourceCellData = copiedData.cells.find(
            (c) =>
              c.row - copiedData.startCell.row === relativeRow &&
              c.col - copiedData.startCell.col === relativeCol
          );
        }

        if (sourceCellData) {
          // Apply badges
          if (sourceCellData.badges.length > 0) {
            newBadges[target.cellId] = [...sourceCellData.badges];
          } else {
            delete newBadges[target.cellId];
          }

          // Apply disabled state
          if (sourceCellData.disabled) {
            newDisabledCells.add(target.cellId);
          } else {
            newDisabledCells.delete(target.cellId);
          }
        }
      });

      // Update states
      setCellBadges(newBadges);
      setDisabledCells(newDisabledCells);

      // Don't clear selection - keep the target cells selected
      // Only hide marching ants (handled in handleKeyDown)

      // Add to history
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
            },
          ])
        ),
      });
    },
    [cellBadges, disabledCells, setCellBadges, setDisabledCells, undoHistory]
  );

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
