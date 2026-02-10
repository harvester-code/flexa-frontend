"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Hash,
  Plane,
  Building2,
  Clock4,
  History,
  NotebookPen,
  StickyNote,
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
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/DropdownMenu";
import { useToast } from "@/hooks/useToast";
import Spinner from "@/components/ui/Spinner";
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

// 정렬 가능한 필드 타입
type SortField =
  | "name"
  | "airport"
  | "terminal"
  | "metadata_updated_at"
  | "simulation_end_at"
  | "memo"
  | "updated_at";
type SortOrder = "asc" | "desc";

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
interface ScenarioNavigationOptions {
  scenarioName?: string;
  airport?: string;
}

function useScenarioNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navigateToScenario = (
    scenarioId: string,
    options?: ScenarioNavigationOptions
  ) => {
    const params = new URLSearchParams();

    if (options?.scenarioName) {
      params.set("name", options.scenarioName);
    }

    if (options?.airport) {
      params.set("airport", options.airport);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${pathname}/${scenarioId}?${queryString}`
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const airportOptions = React.useMemo(() => {
    if (!scenarios) return [];

    const uniqueAirports = new Set<string>();
    scenarios.forEach((scenario) => {
      if (scenario?.airport) {
        uniqueAirports.add(scenario.airport);
      }
    });

    return Array.from(uniqueAirports).sort((a, b) => a.localeCompare(b));
  }, [scenarios]);

  const terminalOptions = React.useMemo(() => {
    if (!scenarios) return [];

    const uniqueTerminals = new Set<string>();
    scenarios.forEach((scenario) => {
      if (scenario?.terminal) {
        uniqueTerminals.add(scenario.terminal);
      }
    });

    return Array.from(uniqueTerminals).sort((a, b) => a.localeCompare(b));
  }, [scenarios]);

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드를 클릭하면 순서 반전
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 다른 필드를 클릭하면 해당 필드로 오름차순
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 정렬 아이콘 렌더링 (고정된 너비로 공간 확보)
  const renderSortIcon = (field: SortField) => {
    return (
      <span className="inline-flex w-3.5 ml-1">
        {sortField === field && (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        )}
      </span>
    );
  };

  // 필터링 및 정렬된 시나리오 계산
  const filteredScenarios = React.useMemo(() => {
    if (!scenarios) return [];

    let filtered = [...scenarios];

    // 검색어 필터링 (Name, Airport, Terminal, Memo)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((scenario) => {
        const name = (scenario.name || "").toLowerCase();
        const airport = (scenario.airport || "").toLowerCase();
        const terminal = (scenario.terminal || "").toLowerCase();
        const memo = (scenario.memo || "").toLowerCase();
        return (
          name.includes(query) ||
          airport.includes(query) ||
          terminal.includes(query) ||
          memo.includes(query)
        );
      });
    }

    // 필터링
    if (selectedAirports.length > 0) {
      filtered = filtered.filter((scenario) =>
        selectedAirports.includes(scenario.airport)
      );
    }

    if (selectedTerminals.length > 0) {
      filtered = filtered.filter((scenario) =>
        selectedTerminals.includes(scenario.terminal)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // null/undefined 처리
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // 날짜 필드 처리
      if (
        sortField === "metadata_updated_at" ||
        sortField === "simulation_end_at" ||
        sortField === "updated_at"
      ) {
        // null/undefined/"Never saved"/"Never run" 값은 가장 마지막으로
        const aIsEmpty = !aValue;
        const bIsEmpty = !bValue;

        if (aIsEmpty && bIsEmpty) return 0;
        if (aIsEmpty) return 1;
        if (bIsEmpty) return -1;

        const aTime = new Date(aValue).getTime();
        const bTime = new Date(bValue).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }

      // 문자열 비교
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [scenarios, searchQuery, selectedAirports, selectedTerminals, sortField, sortOrder]);

  useEffect(() => {
    if (selectedAirports.length === 0) return;

    const validSelections = selectedAirports.filter((airport) =>
      airportOptions.includes(airport)
    );

    if (validSelections.length !== selectedAirports.length) {
      setSelectedAirports(validSelections);
    }
  }, [airportOptions, selectedAirports]);

  useEffect(() => {
    if (selectedTerminals.length === 0) return;

    const validSelections = selectedTerminals.filter((terminal) =>
      terminalOptions.includes(terminal)
    );

    if (validSelections.length !== selectedTerminals.length) {
      setSelectedTerminals(validSelections);
    }
  }, [terminalOptions, selectedTerminals]);

  useEffect(() => {
    if (!filteredScenarios || filteredScenarios.length < 1) return;
    setIsScenarioSelected(Array(filteredScenarios.length).fill(false));
    setCurrentPage(1); // 필터링이 변경되면 첫 페이지로 리셋
  }, [filteredScenarios]);

  // 페이지네이션 계산
  const rawTotalPages = Math.ceil((filteredScenarios?.length || 0) / pageSize);
  const totalPages = Math.max(1, rawTotalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  const currentScenarios =
    filteredScenarios?.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    ) || [];

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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

  const toggleAirportFilter = (airport: string) => {
    setSelectedAirports((prev) =>
      prev.includes(airport)
        ? prev.filter((item) => item !== airport)
        : [...prev, airport]
    );
  };

  const toggleTerminalFilter = (terminal: string) => {
    setSelectedTerminals((prev) =>
      prev.includes(terminal)
        ? prev.filter((item) => item !== terminal)
        : [...prev, terminal]
    );
  };

  const clearAllFilters = () => {
    setSelectedAirports([]);
    setSelectedTerminals([]);
  };

  const appliedFilterCount = selectedAirports.length + selectedTerminals.length;

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

  const handleScenarioClick = (
    scenarioId: string,
    scenarioName?: string,
    airport?: string
  ) => {
    setNavigatingToId(scenarioId);
    navigateToScenario(scenarioId, { scenarioName, airport });
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
      const nameToSend =
        copyName && copyName.trim() ? copyName.trim() : undefined;
      const response = await copyScenario(
        copyingScenario.scenario_id,
        nameToSend
      );

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
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-default-900">Simulation Scenarios</h2>
          <p className="text-sm text-default-600">Create and manage passenger flow simulation scenarios for different airport configurations</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
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
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-4">
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 justify-between"
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-default-700">
                  <Filter className="h-4 w-4" />
                  Filter
                </span>
                <span className="flex items-center gap-1.5 ml-2">
                  {(appliedFilterCount > 0 || searchQuery.trim()) && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {appliedFilterCount + (searchQuery.trim() ? 1 : 0)}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-default-500" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {/* Search */}
              <div className="px-2 py-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-default-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        setFilterOpen(false);
                      }
                    }}
                    className="h-8 pl-7 text-sm"
                  />
                </div>
              </div>
              <DropdownMenuSeparator />

              {airportOptions.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="justify-between">
                    <span className="flex items-center gap-1.5">
                      <Plane className="h-3.5 w-3.5 text-default-500" />
                      Airport
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {airportOptions.map((airport) => {
                      const isSelected = selectedAirports.includes(airport);
                      return (
                        <DropdownMenuItem
                          key={airport}
                          onSelect={(event) => {
                            event.preventDefault();
                          }}
                          className={cn(
                            "px-2 py-1.5",
                            isSelected ? "bg-primary/10 text-primary-900" : ""
                          )}
                        >
                          <label
                            htmlFor={`filter-airport-${airport}`}
                            className="flex w-full cursor-pointer items-center gap-2"
                          >
                            <Checkbox
                              id={`filter-airport-${airport}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleAirportFilter(airport)}
                            />
                            <span className="text-sm text-default-900">
                              {airport}
                            </span>
                          </label>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {terminalOptions.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-default-500" />
                      Terminal
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {terminalOptions.map((terminal) => {
                      const isSelected = selectedTerminals.includes(terminal);
                      return (
                        <DropdownMenuItem
                          key={terminal}
                          onSelect={(event) => {
                            event.preventDefault();
                          }}
                          className={cn(
                            "px-2 py-1.5",
                            isSelected ? "bg-primary/10 text-primary-900" : ""
                          )}
                        >
                          <label
                            htmlFor={`filter-terminal-${terminal}`}
                            className="flex w-full cursor-pointer items-center gap-2"
                          >
                            <Checkbox
                              id={`filter-terminal-${terminal}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleTerminalFilter(terminal)}
                            />
                            <span className="text-sm text-default-900">
                              {terminal}
                            </span>
                          </label>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {(appliedFilterCount > 0 || searchQuery.trim()) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      clearAllFilters();
                      setSearchQuery("");
                    }}
                    className="text-sm text-default-600 hover:text-default-900"
                  >
                    Clear all
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-default-500">
            {filteredScenarios.length} scenarios
          </span>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm text-default-500 md:inline">
              Rows per page
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-24 justify-between">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        className="mt-2 overflow-x-auto"
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
                                if (
                                  i >= currentPageStartIdx &&
                                  i < currentPageEndIdx
                                ) {
                                  return !!checked;
                                }
                                return selected;
                              })
                            );
                          }}
                        />
                </div>
              </th>
              <th className="px-3 text-left whitespace-nowrap">
                <div
                  className="flex items-center gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <Hash className="h-3.5 w-3.5" />
                  Name
                  {renderSortIcon("name")}
                </div>
              </th>
              <th className="px-3 text-left whitespace-nowrap">
                <div
                  className="flex items-center gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("airport")}
                >
                  <Plane className="h-3.5 w-3.5" />
                  Airport
                  {renderSortIcon("airport")}
                </div>
              </th>
              <th className="px-3 text-center whitespace-nowrap">
                <div
                  className="flex items-center justify-center gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("terminal")}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Terminal
                  {renderSortIcon("terminal")}
                </div>
              </th>
              <th className="px-3 text-right whitespace-nowrap">
                <div
                  className="flex items-center justify-end gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("metadata_updated_at")}
                >
                  <Clock4 className="h-3.5 w-3.5" />
                  Last Saved
                  {renderSortIcon("metadata_updated_at")}
                </div>
              </th>
              <th className="px-3 text-right whitespace-nowrap">
                <div
                  className="flex items-center justify-end gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("simulation_end_at")}
                >
                  <History className="h-3.5 w-3.5" />
                  Last Run
                  {renderSortIcon("simulation_end_at")}
                </div>
              </th>
              <th className="px-3 text-right whitespace-nowrap">
                <div
                  className="flex items-center justify-end gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("updated_at")}
                >
                  <NotebookPen className="h-3.5 w-3.5" />
                  Updated At
                  {renderSortIcon("updated_at")}
                </div>
              </th>
              <th className="px-3 text-left whitespace-nowrap">
                <div
                  className="flex items-center gap-1 text-sm font-medium text-default-900 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("memo")}
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  Memo
                  {renderSortIcon("memo")}
                </div>
              </th>
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
                      isScenarioSelected[(currentPage - 1) * pageSize + idx]
                        ? "active"
                        : ""
                    )}
                  >
                    <td className="w-10">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          id={`check-${idx}`}
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

                    <td className="px-3">
                      {isEditing ? (
                        <Input
                          value={editingScenario?.name || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "name",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="flex-none w-56 max-w-sm px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex cursor-pointer items-center gap-1.5 hover:font-semibold"
                          onClick={() =>
                            handleScenarioClick(
                              scenario.scenario_id,
                              scenario.name,
                              scenario.airport
                            )
                          }
                        >
                          <span className="flex items-center gap-1.5 overflow-hidden">
                            {navigatingToId === scenario.scenario_id && (
                              <Spinner size={16} className="shrink-0" />
                            )}
                            <span className="truncate">{scenario.name}</span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 whitespace-nowrap">
                      {isEditing ? (
                        <Input
                          value={editingScenario?.airport || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "airport",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="flex-none w-32 px-2 py-1"
                        />
                      ) : (
                        scenario.airport
                      )}
                    </td>

                    <td className="px-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <Input
                          value={editingScenario?.terminal || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "terminal",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="flex-none w-20 px-2 py-1 text-center"
                        />
                      ) : (
                        scenario.terminal
                      )}
                    </td>

                    <td className="px-3 text-right whitespace-nowrap">
                      {scenario.metadata_updated_at ? (
                        <div className="flex flex-col items-end leading-4">
                          <span className="text-xs">
                            {dayjs(scenario.metadata_updated_at).format(
                              "YYYY-MM-DD"
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {dayjs(scenario.metadata_updated_at).format(
                              "HH:mm"
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">
                          Never saved
                        </span>
                      )}
                    </td>
                    <td className="px-3 text-right whitespace-nowrap">
                      {scenario.simulation_end_at ? (
                        <div className="flex flex-col items-end leading-4">
                          <span className="text-xs">
                            {dayjs(scenario.simulation_end_at).format(
                              "YYYY-MM-DD"
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {dayjs(scenario.simulation_end_at).format("HH:mm")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">
                          {scenario.simulation_status === "processing"
                            ? "In progress"
                            : "Never run"}
                        </span>
                      )}
                    </td>

                    <td className="px-3 text-right whitespace-nowrap">
                      {scenario.updated_at ? (
                        <div className="flex flex-col items-end leading-4">
                          <span className="text-xs">
                            {dayjs(scenario.updated_at).format("YYYY-MM-DD")}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {dayjs(scenario.updated_at).format("HH:mm")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">-</span>
                      )}
                    </td>

                    <td className="px-3 align-top">
                      {isEditing ? (
                        <Input
                          value={editingScenario?.memo || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "memo",
                              (e.target as HTMLInputElement).value
                            )
                          }
                          onKeyDown={handleKeyDown}
                          className="flex-none w-64 max-w-md px-2 py-1"
                        />
                      ) : (
                        <span
                          className="block max-w-xs truncate"
                          title={scenario.memo || ""}
                        >
                          {scenario.memo || "-"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 text-center">
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
            {totalPages > 0
              ? renderPaginationButtons(currentPage, totalPages, setCurrentPage)
              : null}
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
            <AlertDialogAction onClick={handleCopyConfirm} disabled={isCopying}>
              {isCopying ? (
                <>
                  <Spinner size={16} className="mr-2" />
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
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-default-900">Simulation Scenarios</h2>
              <p className="text-sm text-default-600">Create and manage passenger flow simulation scenarios for different airport configurations</p>
            </div>
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
