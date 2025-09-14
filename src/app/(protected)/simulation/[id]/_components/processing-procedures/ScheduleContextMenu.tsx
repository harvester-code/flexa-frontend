import React, { useCallback, useState } from "react";
import {
  Globe,
  MapPin,
  Navigation,
  Plane,
  Star,
  Trash2,
  Users,
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
}) => {
  // 🔍 카테고리별 검색어 관리
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

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
        .filter((option) => option.toLowerCase().includes(searchTerm))
        .sort((a, b) => a.localeCompare(b));
    },
    [searchTerms]
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
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Apply to {contextMenu.targetCells?.length || 0} selected cells
            </div>
            <DropdownMenuSeparator />
          </>
        )}

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
            <span className="font-medium">Select All</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {categoryGroups.map((group, groupIndex) => (
          <React.Fragment key={group.title}>
            {/* 🏷️ 그룹 제목 */}
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
              {group.title}
            </div>

            {/* 📋 그룹 내 카테고리들 */}
            {group.categories.map((category) => {
              const config =
                group.categoryConfigs?.[category] ||
                conditionCategories[category];
              const filteredOptions = getFilteredAndSortedOptions(
                category,
                config.options
              );
              const searchTerm = searchTerms[category] || "";

              return (
                <DropdownMenuSub key={category}>
                  <DropdownMenuSubTrigger>
                    <span className="flex items-center gap-2">
                      <config.icon size={16} className={config.textColor} />
                      <span>{category}</span>
                      {config.options.length > 10 && (
                        <span className="text-xs opacity-60">
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
                      <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border">
                        {filteredOptions.length} of {config.options.length} results
                      </div>
                    )}

                    {/* 📋 옵션 목록 */}
                    <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {filteredOptions.length > 0 ? (
                        <>
                          {filteredOptions.map((option) => {
                            const checkState = getOptionCheckState(category, option);
                            return (
                              <DropdownMenuItem
                                key={option}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  onToggleBadgeOption(category, option);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex w-full items-center gap-2">
                                  <div className="flex h-4 w-4 items-center justify-center rounded border-2 border-border">
                                    {checkState === true && (
                                      <svg
                                        className="h-3 w-3 text-primary"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                    {checkState === "indeterminate" && (
                                      <div className="h-2 w-2 rounded-sm bg-primary"></div>
                                    )}
                                  </div>
                                  <span className="truncate">{option}</span>
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
                              <span>
                                Toggle All Visible ({filteredOptions.length})
                              </span>
                            </div>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
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
            <span>Clear All Badges</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};