import { useCallback } from "react";

interface UseUndoRedoHandlersProps {
  undoHistory: {
    undo: () => any;
    redo: () => any;
  };
  setDisabledCells: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCellBadges: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

export function useUndoRedoHandlers({
  undoHistory,
  setDisabledCells,
  setCellBadges,
}: UseUndoRedoHandlersProps) {
  // 실행 취소 처리
  const handleUndo = useCallback(() => {
    const action = undoHistory.undo();
    if (!action) return;

    if (action.type === "toggleDisabled") {
      // disabledCells 상태 복원
      setDisabledCells((prev) => {
        const newSet = new Set(prev);
        action.cellIds.forEach((cellId) => {
          const previousState = action.previousStates.get(cellId);
          if (previousState) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    } else if (action.type === "setBadges") {
      // cellBadges 상태 복원
      setCellBadges((prev) => {
        const updated = { ...prev };
        action.cellIds.forEach((cellId) => {
          const previousBadges = action.previousBadges.get(cellId);
          if (previousBadges) {
            updated[cellId] = previousBadges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
    } else if (action.type === "paste") {
      // Restore previous state for paste operation
      setCellBadges((prev) => {
        const updated = { ...prev };
        action.targetCells.forEach((cellId) => {
          const prevState = action.previousStates?.get(cellId);
          if (prevState?.badges && prevState.badges.length > 0) {
            updated[cellId] = prevState.badges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
      setDisabledCells((prev) => {
        const newSet = new Set(prev);
        action.targetCells.forEach((cellId) => {
          const prevState = action.previousStates?.get(cellId);
          if (prevState?.disabled) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    }
  }, [undoHistory, setDisabledCells, setCellBadges]);

  // 재실행 처리
  const handleRedo = useCallback(() => {
    const action = undoHistory.redo();
    if (!action) return;

    if (action.type === "toggleDisabled") {
      // disabledCells 상태 재적용
      setDisabledCells((prev) => {
        const newSet = new Set(prev);
        action.cellIds.forEach((cellId) => {
          const newState = action.newStates.get(cellId);
          if (newState) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    } else if (action.type === "setBadges") {
      // cellBadges 상태 재적용
      setCellBadges((prev) => {
        const updated = { ...prev };
        action.cellIds.forEach((cellId) => {
          const newBadges = action.newBadges.get(cellId);
          if (newBadges && newBadges.length > 0) {
            updated[cellId] = newBadges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
    } else if (action.type === "paste") {
      // Reapply paste operation
      setCellBadges((prev) => {
        const updated = { ...prev };
        action.targetCells.forEach((cellId) => {
          const newState = action.newStates?.get(cellId);
          if (newState?.badges && newState.badges.length > 0) {
            updated[cellId] = newState.badges;
          } else {
            delete updated[cellId];
          }
        });
        return updated;
      });
      setDisabledCells((prev) => {
        const newSet = new Set(prev);
        action.targetCells.forEach((cellId) => {
          const newState = action.newStates?.get(cellId);
          if (newState?.disabled) {
            newSet.add(cellId);
          } else {
            newSet.delete(cellId);
          }
        });
        return newSet;
      });
    }
  }, [undoHistory, setDisabledCells, setCellBadges]);

  return {
    handleUndo,
    handleRedo,
  };
}