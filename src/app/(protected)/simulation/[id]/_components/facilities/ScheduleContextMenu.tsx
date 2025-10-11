import React, { useCallback, useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  Navigation,
  Plane,
  Star,
  Trash2,
  Users,
  Power,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { getBadgeStyle, getColorByIndex } from "@/styles/colors";
import { getCategoryColorIndex } from "./schedule-editor/badgeMappings";
import { LABELS } from "@/styles/columnMappings";

// 카테고리별 뱃지 타입 정의
interface CategoryBadge {
  category: string;
  options: string[];
  colorIndex: number;  // 색상 인덱스 추가
  style?: React.CSSProperties;  // 인라인 스타일 추가
}

interface ContextMenuState {
  show: boolean;
  cellId: string;
  targetCells: string[];
  x: number;
  y: number;
}

interface CategoryGroup {
  title: string;
  categories: string[];
  categoryConfigs?: Record<string, any>;
}

interface ScheduleContextMenuProps {
  contextMenu: ContextMenuState;
  onOpenChange: (open: boolean) => void;
  categoryGroups: CategoryGroup[];
  conditionCategories: Record<string, any>;
  cellBadges: Record<string, CategoryBadge[]>;
  onToggleBadgeOption: (category: string, option: string) => void;
  onSelectAllCategories: () => void;
  onClearAllBadges: () => void;
  flightAirlines?: Record<string, string> | null;
  airportCityMapping?: Record<string, string> | null;
  onToggleActivation?: () => void;
  onSetProcessTime?: (multiplier: number) => void;
  disabledCells?: Set<string>;
  currentProcessTime?: number;
}

export const ScheduleContextMenu: React.FC<ScheduleContextMenuProps> = ({
  contextMenu,
  onOpenChange,
  categoryGroups,
  conditionCategories,
  cellBadges,
  onToggleBadgeOption,
  onSelectAllCategories,
  onClearAllBadges,
  flightAirlines,
  airportCityMapping,
  onToggleActivation,
  onSetProcessTime,
  disabledCells,
  currentProcessTime = 60, // default 60 seconds
}) => {
  // 🔍 카테고리별 검색어 관리
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [processTimeInput, setProcessTimeInput] = useState<string>("");
  const [processMultiplier, setProcessMultiplier] = useState<number>(1);

  // Calculate if all selected cells are activated
  const areAllCellsActivated = useCallback(() => {
    if (!disabledCells || contextMenu.targetCells.length === 0) return true;
    return !contextMenu.targetCells.some(cellId => disabledCells.has(cellId));
  }, [disabledCells, contextMenu.targetCells]);

  // Calculate process time multiplier when input changes
  useEffect(() => {
    if (processTimeInput && currentProcessTime > 0) {
      const inputSeconds = parseFloat(processTimeInput);
      if (!isNaN(inputSeconds) && inputSeconds > 0) {
        const multiplier = currentProcessTime / inputSeconds;
        setProcessMultiplier(multiplier);
      }
    }
  }, [processTimeInput, currentProcessTime]);

  // 🔍 검색어 변경 핸들러
  const handleSearchTermChange = useCallback((category: string, term: string) => {
    setSearchTerms((prev) => ({
      ...prev,
      [category]: term,
    }));
  }, []);

  // 🔤 옵션 정렬 및 필터링 함수
  const getFilteredAndSortedOptions = useCallback(
    (category: string, options: string[]) => {
      const searchTerm = searchTerms[category]?.toLowerCase() || "";
      return options
        .filter((option) => {
          // For airlines, search by both code and name
          if (category === "Airline" && flightAirlines?.[option]) {
            const airlineName = flightAirlines[option].toLowerCase();
            return option.toLowerCase().includes(searchTerm) ||
                   airlineName.includes(searchTerm);
          }
          // For airports, search by both code and city
          if ((category === LABELS.ARRIVAL_AIRPORT || category === LABELS.DEPARTURE_AIRPORT) && airportCityMapping?.[option]) {
            const cityName = airportCityMapping[option].toLowerCase();
            return option.toLowerCase().includes(searchTerm) ||
                   cityName.includes(searchTerm);
          }
          return option.toLowerCase().includes(searchTerm);
        })
        .sort((a, b) => a.localeCompare(b));
    },
    [searchTerms, flightAirlines, airportCityMapping]
  );

  // 옵션 상태 확인 헬퍼 - 카테고리별 옵션 확인
  const getOptionCheckState = useCallback(
    (category: string, option: string) => {
      const targetCells = contextMenu.targetCells || [];
      if (targetCells.length === 0) return false;

      const cellsWithOption = targetCells.filter((cellId) => {
        const badges = cellBadges[cellId] || [];
        return badges.some(
          (badge) =>
            badge.category === category && badge.options.includes(option)
        );
      });

      if (cellsWithOption.length === 0) return false;
      if (cellsWithOption.length === targetCells.length) return true;
      return "indeterminate";
    },
    [contextMenu.targetCells, cellBadges]
  );

  return (
    <DropdownMenu
      open={contextMenu.show}
      onOpenChange={onOpenChange}
      modal={false}
    >
      {/* Invisible trigger positioned at mouse coordinates */}
      <DropdownMenuTrigger
        style={{
          position: "fixed",
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      <DropdownMenuContent
        side="right"
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onOpenChange(false)}
        onPointerDownOutside={() => onOpenChange(false)}
      >
        {/* Selected cells count info */}
        {(contextMenu.targetCells?.length || 0) > 1 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-black">
              Apply to {contextMenu.targetCells?.length || 0} selected cells
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Activate/Deactivate toggle */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            if (onToggleActivation) {
              onToggleActivation();
            }
          }}
          className="cursor-pointer"
        >
          <div className="flex w-full items-center gap-2">
            <Power size={16} className={areAllCellsActivated() ? "text-green-500" : "text-red-500"} />
            <span className="font-medium text-black">
              {areAllCellsActivated() ? "Deactivate" : "Activate"}
            </span>
          </div>
        </DropdownMenuItem>

        {/* Process Time input */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-black">Process Time</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              value={processTimeInput}
              onChange={(e) => setProcessTimeInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && onSetProcessTime && processMultiplier > 0) {
                  onSetProcessTime(processMultiplier);
                  onOpenChange(false);
                }
              }}
              placeholder={`${currentProcessTime}s`}
              className="w-20 rounded border px-2 py-1 text-xs"
              min="1"
            />
            <span className="text-xs text-gray-500">
              {processTimeInput && processMultiplier > 0 && (
                <span className={processMultiplier > 1 ? "text-green-600 font-medium" : processMultiplier < 1 ? "text-red-600 font-medium" : ""}>
                  ×{processMultiplier.toFixed(2)} {processMultiplier > 1 ? "faster" : processMultiplier < 1 ? "slower" : ""}
                </span>
              )}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />

        {/* Select All option */}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onSelectAllCategories();
          }}
          className="cursor-pointer"
        >
          <div className="flex w-full items-center gap-2">
            <Star size={16} className="text-primary" />
            <span className="font-medium text-black">Select All</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {categoryGroups.map((group, groupIndex) => (
          <React.Fragment key={group.title}>
            {/* 🏷️ 그룹 제목 */}
            <div className="px-3 py-2 text-xs font-medium text-black uppercase tracking-wide border-b border-border">
              {group.title}
            </div>

            {/* 📋 그룹 내 카테고리들 */}
            {group.categories.map((category, categoryIndexInGroup) => {
              const config =
                group.categoryConfigs?.[category] ||
                conditionCategories[category];
              const filteredOptions = getFilteredAndSortedOptions(
                category,
                config.options
              );
              const searchTerm = searchTerms[category] || "";

              // Use centralized color index for consistency
              const categoryColorIndex = getCategoryColorIndex(category);

              // Get icon color from COMPONENT_TYPICAL_COLORS
              const iconColor = getColorByIndex(categoryColorIndex);

              return (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger>
                    <span className="flex items-center gap-2">
                      <config.icon size={16} style={{ color: iconColor }} />
                      <span className="text-black">{category}</span>
                      {config.options.length > 10 && (
                        <span className="text-xs text-black opacity-60">
                          ({config.options.length})
                        </span>
                      )}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="max-h-80 w-64 overflow-hidden">
                    {/* 🔍 검색 입력창 */}
                    <div className="p-2 border-b border-border">
                      <Input
                        placeholder={`Search ${category.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) =>
                          handleSearchTermChange(category, e.target.value)
                        }
                        className="h-8 text-sm"
                        autoFocus={false}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 📝 결과 카운트 */}
                    {searchTerm && (
                      <div className="px-3 py-1 text-xs text-black border-b border-border">
                        {filteredOptions.length} of {config.options.length} results
                      </div>
                    )}

                    {/* 📋 옵션 목록 */}
                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {filteredOptions.length > 0 ? (
                        <>
                          {filteredOptions.map((option, optionIndex) => {
                            const checkState = getOptionCheckState(category, option);
                            // Use centralized color index or config's colorIndex
                            const effectiveIndex = config.colorIndex ?? categoryColorIndex;
                            const optionColor = getColorByIndex(effectiveIndex);

                            return (
                              <DropdownMenuItem
                                key={option}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  onToggleBadgeOption(category, option);
                                }}
                                className="cursor-pointer"
                                style={{
                                  backgroundColor: checkState ? `${optionColor}1A` : 'transparent',
                                }}
                              >
                                <div className="flex w-full items-center gap-2">
                                  <Checkbox
                                    checked={checkState === true || checkState === "indeterminate"}
                                    onCheckedChange={() => {}}
                                    className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                  />
                                  <span className="truncate text-black">
                                    {category === LABELS.AIRLINE && flightAirlines?.[option]
                                      ? `${option} | ${flightAirlines[option]}`
                                      : (category === LABELS.ARRIVAL_AIRPORT || category === LABELS.DEPARTURE_AIRPORT) && airportCityMapping?.[option]
                                      ? `${option} | ${airportCityMapping[option]}`
                                      : option}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            );
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              // 스마트 체크: 하나라도 체크 안 된 옵션이 있으면 모두 체크, 모두 체크되어 있으면 모두 해제
                              const uncheckedOptions = filteredOptions.filter(
                                option => !getOptionCheckState(category, option)
                              );
                              
                              if (uncheckedOptions.length > 0) {
                                // 체크 안 된 옵션들만 체크
                                uncheckedOptions.forEach((option) => {
                                  onToggleBadgeOption(category, option);
                                });
                              } else {
                                // 모두 체크되어 있으면 모두 해제
                                filteredOptions.forEach((option) => {
                                  onToggleBadgeOption(category, option);
                                });
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex w-full items-center gap-2">
                              <span className="text-black">
                                Toggle All Visible ({filteredOptions.length})
                              </span>
                            </div>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <div className="px-3 py-2 text-sm text-black">
                          No results found
                        </div>
                      )}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}

            {/* 🔹 그룹 구분선 (마지막 그룹 제외) */}
            {groupIndex < categoryGroups.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onClearAllBadges();
          }}
          className="cursor-pointer"
        >
          <div className="flex w-full items-center gap-2 text-red-600">
            <Trash2 size={16} />
            <span className="text-black">Clear All Badges</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};