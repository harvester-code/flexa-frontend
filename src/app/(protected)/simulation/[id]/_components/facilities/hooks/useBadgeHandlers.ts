import { useCallback } from "react";
import { CategoryBadge, ConditionCategoriesMap, FacilityWithSchedule } from "../schedule-editor/types";
import { HistoryAction } from "./useUndoHistory";
import { getBadgeColor } from "@/styles/colors";
import { formatProcessName } from "@/lib/utils";
import { Navigation } from "lucide-react";
import type { ProcessStep } from "@/types/simulationTypes";

interface UseBadgeHandlersProps {
  contextMenu: {
    targetCells?: string[];
  };
  cellBadges: Record<string, CategoryBadge[]>;
  setCellBadges: React.Dispatch<React.SetStateAction<Record<string, CategoryBadge[]>>>;
  undoHistory: {
    pushHistory: (action: HistoryAction) => void;
  };
  CONDITION_CATEGORIES: ConditionCategoriesMap;
  selectedProcessIndex: number;
  processFlow: ProcessStep[];
}

export function useBadgeHandlers({
  contextMenu,
  cellBadges,
  setCellBadges,
  undoHistory,
  CONDITION_CATEGORIES,
  selectedProcessIndex,
  processFlow,
}: UseBadgeHandlersProps) {
  // 🔍 Process 카테고리 config 가져오기 헬퍼
  const getProcessCategoryConfig = useCallback(
    (category: string) => {
      if (selectedProcessIndex > 0 && processFlow && processFlow.length > 0) {
        const processColorIndex = Object.keys(CONDITION_CATEGORIES).length; // Process는 다른 카테고리 뒤에 위치
        for (let i = 0; i < selectedProcessIndex; i++) {
          const process = processFlow[i];
          if (process && process.zones) {
            const processName = formatProcessName(process.name);
            if (processName === category) {
              // 프로세스 이름을 기반으로 일관된 색상 인덱스 생성
              // 문자열을 해시하여 일관된 인덱스 생성
              let hash = 0;
              for (let j = 0; j < processName.length; j++) {
                hash = ((hash << 5) - hash) + processName.charCodeAt(j);
                hash = hash & hash; // Convert to 32bit integer
              }
              const consistentColorIndex = processColorIndex + (Math.abs(hash) % 10);

              return {
                icon: Navigation,
                options: Object.keys(process.zones),
                colorIndex: consistentColorIndex, // 프로세스 이름 기반 일관된 색상
              };
            }
          }
        }
      }
      return null;
    },
    [selectedProcessIndex, processFlow, CONDITION_CATEGORIES]
  );

  // 카테고리별 뱃지 토글 핸들러
  const handleToggleBadgeOption = useCallback(
    (category: string, option: string) => {
      const targetCells = contextMenu.targetCells || [];
      if (targetCells.length === 0) return;

      // Process 카테고리인지 확인
      const processCategoryConfig = getProcessCategoryConfig(category);
      const categoryConfig =
        processCategoryConfig ||
        CONDITION_CATEGORIES[category as keyof typeof CONDITION_CATEGORIES];

      if (!categoryConfig) return;

      // 히스토리를 위한 이전 상태 저장
      const previousBadges = new Map<string, CategoryBadge[]>();
      targetCells.forEach((cellId) => {
        previousBadges.set(
          cellId,
          cellBadges[cellId] ? [...cellBadges[cellId]] : []
        );
      });

      setCellBadges((prev) => {
        const updated = { ...prev };
        const newBadges = new Map<string, CategoryBadge[]>();

        targetCells.forEach((cellId) => {
          let existingBadges = [...(updated[cellId] || [])];

          // 🔄 "All" 뱃지가 있다면 개별 옵션 선택 시 제거
          const allBadgeIndex = existingBadges.findIndex(
            (badge) => badge.category === "All"
          );
          if (allBadgeIndex >= 0) {
            existingBadges = existingBadges.filter(
              (badge) => badge.category !== "All"
            );
          }

          const existingCategoryIndex = existingBadges.findIndex(
            (badge) => badge.category === category
          );

          // 각 셀별로 독립적으로 토글 처리 - updated(prev) 사용
          const currentBadges = updated[cellId] || [];
          const currentCategoryBadge = currentBadges.find(
            (badge) => badge.category === category
          );
          const hasOption = currentCategoryBadge?.options.includes(option) || false;

          if (existingCategoryIndex >= 0) {
            // 카테고리가 이미 있는 경우
            const existingCategory = { ...existingBadges[existingCategoryIndex] };
            const optionIndex = existingCategory.options.indexOf(option);

            if (hasOption) {
              // 이 셀에 옵션이 있으면 제거
              if (optionIndex >= 0) {
                const newOptions = [...existingCategory.options];
                newOptions.splice(optionIndex, 1);

                if (newOptions.length === 0) {
                  // 옵션이 없으면 카테고리 전체 제거
                  existingBadges.splice(existingCategoryIndex, 1);
                } else {
                  // 옵션만 업데이트
                  existingBadges[existingCategoryIndex] = {
                    ...existingCategory,
                    options: newOptions,
                  };
                }
              }
            } else {
              // 이 셀에 옵션이 없으면 추가
              if (optionIndex < 0) {
                existingBadges[existingCategoryIndex] = {
                  ...existingCategory,
                  options: [...existingCategory.options, option],
                };
              }
            }
          } else if (!hasOption) {
            // 카테고리가 없고 옵션도 없으면 새로 추가
            const badgeColor = getBadgeColor(categoryConfig.colorIndex);
            const newCategoryBadge: CategoryBadge = {
              category,
              options: [option],
              colorIndex: categoryConfig.colorIndex,
              style: badgeColor.style,
            };
            existingBadges.push(newCategoryBadge);
          }

          updated[cellId] = [...existingBadges];
          newBadges.set(cellId, [...existingBadges]);
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

        return updated;
      });
    },
    [
      contextMenu.targetCells,
      cellBadges,
      getProcessCategoryConfig,
      CONDITION_CATEGORIES,
      setCellBadges,
      undoHistory,
    ]
  );

  // 카테고리별 뱃지 제거 핸들러 (전체 카테고리 제거)
  const handleRemoveCategoryBadge = useCallback(
    (cellId: string, category: string) => {
      setCellBadges((prev) => ({
        ...prev,
        [cellId]: (prev[cellId] || []).filter(
          (badge) => badge.category !== category
        ),
      }));
    },
    [setCellBadges]
  );

  // 모든 뱃지 제거 핸들러 (선택된 모든 셀에서) - 빈 배열로 설정
  const handleClearAllBadges = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    // 히스토리를 위한 이전 상태 저장
    const previousBadges = new Map<string, CategoryBadge[]>();
    targetCells.forEach((cellId) => {
      previousBadges.set(
        cellId,
        cellBadges[cellId] ? [...cellBadges[cellId]] : []
      );
    });

    setCellBadges((prev) => {
      const updated = { ...prev };
      const newBadges = new Map<string, CategoryBadge[]>();

      targetCells.forEach((cellId) => {
        delete updated[cellId]; // 완전히 제거하여 메모리 최적화
        newBadges.set(cellId, []);
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

      return updated;
    });
  }, [contextMenu.targetCells, cellBadges, undoHistory, setCellBadges]);

  // 모든 카테고리 선택 핸들러 - 뱃지를 비워서 All로 표시
  const handleSelectAllCategories = useCallback(() => {
    const targetCells = contextMenu.targetCells || [];
    if (targetCells.length === 0) return;

    // 히스토리를 위한 이전 상태 저장
    const previousBadges = new Map<string, CategoryBadge[]>();
    targetCells.forEach((cellId) => {
      previousBadges.set(
        cellId,
        cellBadges[cellId] ? [...cellBadges[cellId]] : []
      );
    });

    setCellBadges((prev) => {
      const updated = { ...prev };
      const newBadges = new Map<string, CategoryBadge[]>();

      targetCells.forEach((cellId) => {
        // 뱃지를 비워서 자동으로 All 표시되도록
        delete updated[cellId];
        newBadges.set(cellId, []);
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

      return updated;
    });
  }, [contextMenu.targetCells, cellBadges, undoHistory, setCellBadges]);

  return {
    handleToggleBadgeOption,
    handleRemoveCategoryBadge,
    handleClearAllBadges,
    handleSelectAllCategories,
    getProcessCategoryConfig,
  };
}
