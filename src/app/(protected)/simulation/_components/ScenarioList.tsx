"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Pencil,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { modifyScenario, copyScenario } from "@/services/simulationService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarComponent } from "@/components/ui/Calendar";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import SimulationLoading from "./SimulationLoading";

interface EditingScenario {
  id: string;
  scenario_id: string;
  name: string;
  airport: string;
  terminal: string;
  memo: string;
}

interface ScenarioListProps {
  scenarios: any[];
  isLoading: boolean;
  onCreateScenario: () => void;
  onDeleteScenario: (selectedIds: string[]) => void;
}

// 페이지당 표시할 시나리오 개수 옵션
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

// 테이블의 최소 높이 계산 (헤더 + 행)
const TABLE_HEADER_HEIGHT = 60; // 헤더 행 높이
const TABLE_ROW_HEIGHT = 64; // 각 행의 높이 (p-3 패딩 포함)

/**
 * 페이지네이션 범위를 계산하는 함수
 * @param currentPage 현재 페이지
 * @param totalPages 총 페이지 수
 * @param maxVisible 최대 표시할 페이지 수 (기본값: 5)
 * @returns { startPage, endPage } 표시할 페이지 범위
 */
const getPaginationRange = (
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
) => {
  // 총 페이지가 최대 표시 개수보다 적으면 모든 페이지 표시
  if (totalPages <= maxVisible) {
    return { startPage: 1, endPage: totalPages };
  }

  // 현재 페이지가 최대 표시 개수 이하면 처음부터 고정 표시
  if (currentPage <= maxVisible) {
    return { startPage: 1, endPage: maxVisible };
  }

  // 슬라이딩 구간: 현재 페이지가 마지막에 오도록
  return {
    startPage: currentPage - maxVisible + 1,
    endPage: currentPage,
  };
};

/**
 * 페이지네이션 버튼들을 생성하는 함수
 * @param currentPage 현재 페이지
 * @param totalPages 총 페이지 수
 * @param onPageClick 페이지 클릭 핸들러
 * @returns JSX.Element[] 페이지 버튼 배열
 */
const renderPaginationButtons = (
  currentPage: number,
  totalPages: number,
  onPageClick: (page: number) => void
) => {
  const { startPage, endPage } = getPaginationRange(currentPage, totalPages);

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
    const page = startPage + i;
    return (
      <Button
        key={page}
        variant={page === currentPage ? "primary" : "outline"}
        size="sm"
        onClick={() => onPageClick(page)}
        type="button"
        className="transition-colors"
      >
        {page}
      </Button>
    );
  });
};

// Custom hook for navigation that uses pathname and router
function useScenarioNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navigateToScenario = (scenarioId: string, scenarioName?: string) => {
    const url = scenarioName
      ? `${pathname}/${scenarioId}?name=${encodeURIComponent(scenarioName)}`
      : `${pathname}/${scenarioId}`;
    router.push(url);
  };

  return navigateToScenario;
}

const ScenarioListContent: React.FC<ScenarioListProps> = ({
  scenarios,
  isLoading,
  onCreateScenario,
  onDeleteScenario,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigateToScenario = useScenarioNavigation();

  const [isScenarioSelected, setIsScenarioSelected] = useState<boolean[]>([]);
  const [editingScenario, setEditingScenario] =
    useState<EditingScenario | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyingScenario, setCopyingScenario] = useState<any>(null);
  const [copyName, setCopyName] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [navigatingToId, setNavigatingToId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // 필터링된 시나리오 계산
  const filteredScenarios = React.useMemo(() => {
    if (!scenarios) return [];

    let filtered = [...scenarios];

    // 날짜 필터링
    if (selectedDate) {
      const selectedDateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      filtered = filtered.filter(
        (s) =>
          s.created_at &&
          dayjs(s.created_at).format("YYYY-MM-DD") === selectedDateStr
      );
    }

    // 검색 필터링
    if (searchKeyword) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          s.airport.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          s.terminal.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (s.memo && s.memo.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }

    return filtered;
  }, [scenarios, searchKeyword, selectedDate]);

  useEffect(() => {
    if (!filteredScenarios || filteredScenarios.length < 1) return;
    setIsScenarioSelected(Array(filteredScenarios.length).fill(false));
    setCurrentPage(1); // 필터링이 변경되면 첫 페이지로 리셋
  }, [filteredScenarios]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(
    (filteredScenarios?.length || 0) / pageSize
  );
  const currentScenarios =
    filteredScenarios?.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    ) || [];

  // 검색 핸들러
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
  };

  // 그룹 단위 페이지네이션 (5개씩)
  const currentGroup = Math.floor((currentPage - 1) / 5);
  const totalGroups = Math.ceil(totalPages / 5);

  const selRowCount = isScenarioSelected.filter(Boolean).length;

  // 현재 페이지의 선택 상태
  const currentPageStartIdx = (currentPage - 1) * pageSize;
  const currentPageEndIdx = currentPageStartIdx + currentScenarios.length;
  const currentPageSelected = isScenarioSelected.slice(
    currentPageStartIdx,
    currentPageEndIdx
  );
  const isCurrentPageAllSelected =
    currentPageSelected.length > 0 && currentPageSelected.every(Boolean);

  const onDeleteMulti = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    const selIds = isScenarioSelected
      .map((selected, i) => selected && filteredScenarios[i]?.scenario_id)
      .filter(Boolean) as string[];

    await onDeleteScenario(selIds);
    setShowDeleteDialog(false);
    setIsScenarioSelected(Array(filteredScenarios.length).fill(false));
  };

  const startEdit = (scenario: any) => {
    setEditingScenario({
      id: scenario.scenario_id, // scenario_id를 id로 사용
      scenario_id: scenario.scenario_id,
      name: scenario.name,
      airport: scenario.airport,
      terminal: scenario.terminal,
      memo: scenario.memo || "",
    });
  };

  const cancelEdit = () => {
    setEditingScenario(null);
  };

  const saveEdit = async () => {
    if (!editingScenario) return;

    // 원본 시나리오 찾기
    const originalScenario = filteredScenarios.find(
      (s) => s.scenario_id === editingScenario.id
    );
    if (!originalScenario) return;

    // 🔧 변경사항 확인 - 안전한 비교 로직
    const normalize = (value: string | null | undefined) =>
      (value || "").trim();

    const hasChanges =
      normalize(editingScenario.name) !== normalize(originalScenario.name) ||
      normalize(editingScenario.airport) !==
        normalize(originalScenario.airport) ||
      normalize(editingScenario.terminal) !==
        normalize(originalScenario.terminal) ||
      normalize(editingScenario.memo) !== normalize(originalScenario.memo);

    if (!hasChanges) {
      cancelEdit();
      return;
    }

    // 확인 다이얼로그 표시
    setShowUpdateDialog(true);
  };

  const executeUpdateScenario = async () => {
    if (!editingScenario) return;

    try {
      await modifyScenario(
        {
          name: editingScenario.name,
          airport: editingScenario.airport,
          terminal: editingScenario.terminal,
          memo: editingScenario.memo,
        },
        editingScenario.scenario_id
      );

      toast({
        title: "Update Complete",
        description: "Scenario updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setEditingScenario(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowUpdateDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    }
  };

  const updateEditingField = (
    field: keyof Omit<EditingScenario, "id">,
    value: string
  ) => {
    if (!editingScenario) return;
    setEditingScenario({
      ...editingScenario,
      [field]: value,
    });
  };

  const handleScenarioClick = (scenarioId: string, scenarioName?: string) => {
    setNavigatingToId(scenarioId);
    navigateToScenario(scenarioId, scenarioName);
  };

  const handleCopyClick = (scenario: any) => {
    setCopyingScenario(scenario);
    setCopyName(`${scenario.name} (Copy)`);
    setShowCopyDialog(true);
  };

  const handleCopyConfirm = async () => {
    if (!copyingScenario) return;

    setIsCopying(true);
    try {
      // 이름이 입력되었으면 전달, 아니면 undefined
      const nameToSend = copyName && copyName.trim() ? copyName.trim() : undefined;
      const response = await copyScenario(copyingScenario.scenario_id, nameToSend);

      toast({
        title: "Copy Complete",
        description: "Scenario copied successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setShowCopyDialog(false);
      setCopyName("");
      setCopyingScenario(null);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy scenario. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      <div className="flex justify-between">
        <h2 className="title-sm">Scenario List</h2>
        <div className="flex items-center gap-2.5">
          {selRowCount > 0 && (
            <Button variant="destructive" onClick={onDeleteMulti}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selRowCount})
            </Button>
          )}

          <Button onClick={onCreateScenario}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Scenario
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="mt-4 flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-default-500">
            Showing{" "}
            {currentScenarios.length > 0
              ? (currentPage - 1) * pageSize + 1
              : 0}
            -{Math.min(currentPage * pageSize, filteredScenarios.length)} of{" "}
            {filteredScenarios.length} scenarios
          </div>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2.5">
          <Popover modal>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Target Date{" "}
                {selectedDate &&
                  `(${dayjs(selectedDate).format("MMM-DD-YYYY")})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="z-50 w-auto p-0"
              align="end"
              side="bottom"
              sideOffset={4}
              alignOffset={0}
              avoidCollisions={false}
              sticky="always"
            >
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
              {selectedDate && (
                <div className="border-t p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateSelect(undefined)}
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex max-w-72 items-center border-b p-2.5">
            <Input
              className="max-h-6 border-none shadow-none focus-visible:ring-transparent"
              placeholder="Search"
              value={searchKeyword}
              onChange={(e) =>
                handleSearch((e.target as HTMLInputElement).value)
              }
            />
            <Search className="ml-1 h-4 w-4" />
          </div>
        </div>
      </div>

      <div
        className="table-container mt-4"
        style={{ minHeight: `${TABLE_HEADER_HEIGHT + pageSize * TABLE_ROW_HEIGHT}px` }}
      >
        <table className="table-default">
          <thead>
            <tr className="border-b">
              <th className="w-10">
                <div className="flex items-center justify-center">
                  <Checkbox
                    id="selectAll"
                    checked={isCurrentPageAllSelected}
                    onCheckedChange={(checked) => {
                      setIsScenarioSelected((prev) =>
                        prev.map((selected, i) => {
                          if (i >= currentPageStartIdx && i < currentPageEndIdx) {
                            return !!checked;
                          }
                          return selected;
                        })
                      );
                    }}
                    className="checkbox text-sm"
                  />
                </div>
              </th>
              <th className="w-48 text-left">Name</th>
              <th className="w-28 text-left">Airport</th>
              <th className="w-28 text-center">Terminal</th>
              <th className="w-28 text-left">Editor</th>
              <th className="w-32 text-left">Created at</th>
              <th className="w-32 text-left">Updated at</th>
              <th className="!pl-5 text-left">Memo</th>
              <th className="w-20"></th>
            </tr>
          </thead>

          <tbody className="min-h-24">
            {isLoading ? (
              <tr>
                <td colSpan={9}>
                  <SimulationLoading size={50} minHeight="h-64" />
                </td>
              </tr>
            ) : currentScenarios && currentScenarios.length > 0 ? (
              currentScenarios.map((scenario, idx) => {
                const isEditing = editingScenario?.id === scenario.scenario_id;

                return (
                  <tr
                    key={scenario.scenario_id}
                    className={cn(
                      "border-b text-sm hover:bg-muted",
                      isScenarioSelected[
                        (currentPage - 1) * pageSize + idx
                      ]
                        ? "active"
                        : ""
                    )}
                  >
                    <td className="w-10">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          id={`check-${idx}`}
                          className="checkbox text-sm"
                          checked={
                            isScenarioSelected[
                              (currentPage - 1) * pageSize + idx
                            ] || false
                          }
                          onCheckedChange={() => {
                            const actualIndex =
                              (currentPage - 1) * pageSize + idx;
                            setIsScenarioSelected((prev) =>
                              prev.map((selected, i) =>
                                i === actualIndex ? !selected : selected
                              )
                            );
                          }}
                        />
                      </div>
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingScenario?.name || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "name",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex cursor-pointer items-center gap-2 hover:font-semibold"
                          onClick={() =>
                            handleScenarioClick(
                              scenario.scenario_id,
                              scenario.name
                            )
                          }
                        >
                          <span className="flex items-center gap-2 overflow-hidden">
                            {navigatingToId === scenario.scenario_id && (
                              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                            )}
                            <span className="truncate">{scenario.name}</span>
                          </span>
                        </div>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingScenario?.airport || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "airport",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        scenario.airport
                      )}
                    </td>

                    <td className="text-center">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingScenario?.terminal || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "terminal",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        scenario.terminal
                      )}
                    </td>

                    <td>{scenario.editor}</td>
                    <td>
                      {dayjs(scenario.created_at).format("MMM-DD-YYYY HH:mm")}
                    </td>
                    <td>
                      {dayjs(scenario.updated_at).format("MMM-DD-YYYY HH:mm")}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingScenario?.memo || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "memo",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="w-full rounded border px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        scenario.memo || "-"
                      )}
                    </td>

                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="link"
                          className="btn-more rounded p-2 transition-colors hover:bg-blue-50"
                          title={isEditing ? "Cancel" : "Edit"}
                          onClick={() =>
                            isEditing ? cancelEdit() : startEdit(scenario)
                          }
                        >
                          <Pencil
                            className={cn(
                              "size-4",
                              isEditing ? "text-default-500" : "text-primary"
                            )}
                          />
                        </Button>
                        {!isEditing && (
                          <Button
                            variant="link"
                            className="btn-more rounded p-2 transition-colors hover:bg-blue-50"
                            title="Copy"
                            onClick={() => handleCopyClick(scenario)}
                          >
                            <Copy className="size-4 text-primary" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="flex flex-1 flex-col items-center justify-center">
                    <p className="text-sm text-default-500">
                      No scenarios found.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 - 항상 고정된 위치 유지 */}
      <div className="mt-6 flex justify-center">
        {scenarios && scenarios.length > pageSize ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPage > 1) setCurrentPage(1);
              }}
              type="button"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* 슬라이딩 페이지 번호 (최대 5개) */}
            <div className="flex items-center justify-center gap-2">
              {renderPaginationButtons(currentPage, totalPages, setCurrentPage)}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                }
              }}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentPage < totalPages && totalPages > 1)
                  setCurrentPage(totalPages);
              }}
              type="button"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="h-8"></div> // 페이지네이션이 없을 때도 같은 높이 유지
        )}
      </div>

      {/* Delete Scenario Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete Scenario{selRowCount > 1 ? "s" : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selRowCount} scenario
              {selRowCount > 1 ? "s" : ""}?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Scenario Confirmation Dialog */}
      <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this scenario?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeUpdateScenario}>
              Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Copy Scenario Dialog */}
      <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for the copied scenario (optional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Scenario name"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              disabled={isCopying}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Leave empty to use the default name format.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowCopyDialog(false);
                setCopyName("");
                setCopyingScenario(null);
              }}
              disabled={isCopying}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCopyConfirm}
              disabled={isCopying}
            >
              {isCopying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                "Copy"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Wrapper component with Suspense boundary
const ScenarioList: React.FC<ScenarioListProps> = (props) => {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="flex justify-between">
            <h2 className="title-sm">Scenario List</h2>
            <Button onClick={props.onCreateScenario}>Create Scenario</Button>
          </div>
          <div className="py-8 text-center">
            <p className="text-default-500">Loading scenarios...</p>
          </div>
        </div>
      }
    >
      <ScenarioListContent {...props} />
    </Suspense>
  );
};

export default ScenarioList;
