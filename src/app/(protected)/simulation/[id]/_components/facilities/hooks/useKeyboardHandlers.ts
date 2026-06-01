import { useCallback } from "react";
import React from "react";
import { HistoryAction } from "./useUndoHistory";
import type { CategoryBadge } from "../schedule-editor/types";

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

interface UseKeyboardHandlersProps {
  selectedCells: Set<string>;
  displaySelectedCells: Set<string>;
  contextMenu: {
    show: boolean;
  };
  disabledCells: Set<string>;
  setDisabledCells: React.Dispatch<React.SetStateAction<Set<string>>>;
  setCellBadges: React.Dispatch<React.SetStateAction<Record<string, CategoryBadge[]>>>;
  cellBadges: Record<string, CategoryBadge[]>;
  cellProcessTimes: Record<string, number>;
  setCellProcessTimes: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  undoHistory: {
    pushHistory: (action: HistoryAction) => void;
  };
  handleUndo: () => void;
  handleRedo: () => void;
  handleCopy: () => void;
  handlePaste: () => void;
  copiedData: CopyPasteData | null;
  showMarchingAnts: boolean;
  setShowMarchingAnts: (show: boolean) => void;
  setCopiedData: (data: CopyPasteData | null) => void;
  setSelectedCells: (cells: Set<string>) => void;
  setShiftSelectStart: (start: { row: number; col: number } | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useKeyboardHandlers({
  selectedCells,
  displaySelectedCells,
  contextMenu,
  disabledCells,
  setDisabledCells,
  setCellBadges,
  cellBadges,
  cellProcessTimes,
  setCellProcessTimes,
  undoHistory,
  handleUndo,
  handleRedo,
  handleCopy,
  handlePaste,
  copiedData,
  showMarchingAnts,
  setShowMarchingAnts,
  setCopiedData,
  setSelectedCells,
  setShiftSelectStart,
  containerRef,
}: UseKeyboardHandlersProps) {
  // 🛡️ 키보드 이벤트 핸들러 (컴포넌트 스코프로 제한)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 🚀 컨텍스트 메뉴가 열려있을 때만 특정 키 차단
      if (contextMenu.show) {
        // Input, Popover 등 다른 UI 요소가 타겟인 경우는 차단하지 않음
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.closest('[role="dialog"]') ||
          target.closest("[data-radix-popper-content-wrapper]")
        ) {
          return; // Input이나 팝업 내부에서는 키보드 이벤트 허용
        }

        if (e.code === "Escape") {
          // ESC 키만 허용 - 메뉴를 닫기 위해
          return; // DropdownMenu의 onEscapeKeyDown이 처리하도록 함
        } else {
          // 테이블 영역에서만 나머지 키는 무시
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      // 🎯 포커스 확인 및 보장
      if (document.activeElement !== containerRef.current) {
        containerRef.current?.focus({ preventScroll: true });
      }

      // Cmd/Ctrl + C: Copy
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyC") {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Cmd/Ctrl + V: Paste
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyV") {
        e.preventDefault();
        handlePaste();
        // Hide marching ants after paste but keep selection
        setShowMarchingAnts(false);
        return;
      }

      // ESC: Clear copy selection and marching ants
      if (e.code === "Escape") {
        if (showMarchingAnts) {
          setShowMarchingAnts(false);
        } else if (copiedData) {
          setCopiedData(null);
        }
        return;
      }

      // Space: Toggle disabled state for selected cells
      if (e.code === "Space") {
        e.preventDefault();
        const selectedCellsArray = Array.from(displaySelectedCells);
        if (selectedCellsArray.length === 0) return;

        // Check if all selected cells are currently disabled
        const allDisabled = selectedCellsArray.every((cellId) =>
          disabledCells.has(cellId)
        );

        // Save previous states for undo
        const previousStates = new Map<string, boolean>();
        selectedCellsArray.forEach((cellId) => {
          previousStates.set(cellId, disabledCells.has(cellId));
        });

        // Toggle disabled state
        setDisabledCells((prev: Set<string>) => {
          const newSet = new Set(prev);
          selectedCellsArray.forEach((cellId) => {
            if (allDisabled) {
              // If all are disabled, enable them
              newSet.delete(cellId);
            } else {
              // If any are enabled, disable all
              newSet.add(cellId);
            }
          });
          return newSet;
        });

        // Save new states for undo
        const newStates = new Map<string, boolean>();
        selectedCellsArray.forEach((cellId) => {
          newStates.set(cellId, !allDisabled);
        });

        // Add to undo history
        undoHistory.pushHistory({
          type: "toggleDisabled",
          cellIds: selectedCellsArray,
          previousStates,
          newStates,
        });

        return;
      }

      // Cmd/Ctrl + Z: 실행 취소
      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 재실행: Mac은 Cmd+Shift+Z, Windows/Linux는 Ctrl+Y
      if (
        (e.metaKey && e.shiftKey && e.code === "KeyZ") || // Mac
        (e.ctrlKey && e.code === "KeyY")
      ) {
        // Windows/Linux
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.code === "Escape") {
        // ESC: 모든 선택 해제
        e.preventDefault();
        setSelectedCells(new Set());
        setShiftSelectStart(null);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        // Delete/Backspace: 선택된 셀들의 뱃지 제거 (빈 상태로 만들기)
        e.preventDefault();

        if (selectedCells.size > 0) {
          const targetCells = Array.from(selectedCells);

          // 히스토리를 위한 이전 상태 저장
          const previousBadges = new Map<string, CategoryBadge[]>();
          const newBadges = new Map<string, CategoryBadge[]>();
          targetCells.forEach((cellId) => {
            previousBadges.set(
              cellId,
              cellBadges[cellId] ? [...cellBadges[cellId]] : []
            );
          });

          // 🚀 배치 업데이트로 경쟁 조건 방지 및 성능 향상
          React.startTransition(() => {
            // 뱃지 제거 (빈 상태로)
            setCellBadges((prev) => {
              const updated = { ...prev };

              targetCells.forEach((cellId) => {
                delete updated[cellId]; // 완전히 제거
                newBadges.set(cellId, []);
              });

              return updated;
            });

            // 프로세스 시간 오버라이드 제거 -> 기본값으로 복귀
            setCellProcessTimes((prev) => {
              let hasChanges = false;
              const updated = { ...prev };
              targetCells.forEach((cellId) => {
                if (Object.prototype.hasOwnProperty.call(updated, cellId)) {
                  delete updated[cellId];
                  hasChanges = true;
                }
              });

              return hasChanges ? updated : prev;
            });

            // 히스토리에 추가
            setTimeout(() => {
              undoHistory.pushHistory({
                type: "setBadges",
                cellIds: targetCells,
                previousBadges,
                newBadges,
              });
            }, 0);
          });
        }
      }
    },
    [
      selectedCells,
      displaySelectedCells,
      contextMenu.show,
      disabledCells,
      setDisabledCells,
      setCellBadges,
      cellBadges,
      setCellProcessTimes,
      undoHistory,
      handleUndo,
      handleRedo,
      handleCopy,
      handlePaste,
      copiedData,
      showMarchingAnts,
      setShowMarchingAnts,
      setCopiedData,
      setSelectedCells,
      setShiftSelectStart,
      containerRef,
    ]
  );

  return {
    handleKeyDown,
  };
}
