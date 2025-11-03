'use client';

import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Ban,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock4,
  Filter,
  Hash,
  History,
  Link2,
  Plane,
  StickyNote,
  XCircle,
} from 'lucide-react';
import { ScenarioData } from '@/types/homeTypes';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import HomeKpiSelector from './HomeKpiSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import Spinner from '@/components/ui/Spinner';

interface HomeScenarioProps {
  className?: string;
  data: ScenarioData[];
  scenario: ScenarioData | null;
  onSelectScenario: Dispatch<SetStateAction<ScenarioData | null>>;
  isLoading?: boolean;
  kpi: { type: 'mean' | 'top'; percentile?: number };
  onKpiChange: (kpi: { type: 'mean' | 'top'; percentile?: number }) => void;
}

// 페이지당 표시할 시나리오 개수 옵션
const PAGE_SIZE_OPTIONS = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

/**
 * 페이지네이션 범위를 계산하는 함수
 * @param currentPage 현재 페이지
 * @param totalPages 총 페이지 수
 * @param maxVisible 최대 표시할 페이지 수 (기본값: 5)
 * @returns { startPage, endPage } 표시할 페이지 범위
 */
const getPaginationRange = (currentPage: number, totalPages: number, maxVisible: number = 5) => {
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
const renderPaginationButtons = (currentPage: number, totalPages: number, onPageClick: (page: number) => void) => {
  const { startPage, endPage } = getPaginationRange(currentPage, totalPages);

  return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
    const page = startPage + i;
    return (
      <Button
        key={page}
        variant={page === currentPage ? 'primary' : 'outline'}
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

function HomeScenario({ className, data, scenario, onSelectScenario, isLoading = false, kpi, onKpiChange }: HomeScenarioProps) {
  const [isOpened, setIsOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const hasAutoOpened = useRef(false);
  const availableScenarioCount = Array.isArray(data) ? data.length : 0;

  // Airport와 Terminal 옵션 추출
  const airportOptions = useMemo(() => {
    if (!data) return [];
    const uniqueAirports = new Set<string>();
    data.forEach((scenario) => {
      if (scenario?.airport) {
        uniqueAirports.add(scenario.airport);
      }
    });
    return Array.from(uniqueAirports).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const terminalOptions = useMemo(() => {
    if (!data) return [];
    const uniqueTerminals = new Set<string>();
    data.forEach((scenario) => {
      if (scenario?.terminal) {
        uniqueTerminals.add(scenario.terminal);
      }
    });
    return Array.from(uniqueTerminals).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // 시나리오 필터링
  const filteredScenarios = useMemo(() => {
    let scenarios = data || [];

    // Airport 필터링
    if (selectedAirports.length > 0) {
      scenarios = scenarios.filter((s) => selectedAirports.includes(s.airport));
    }

    // Terminal 필터링
    if (selectedTerminals.length > 0) {
      scenarios = scenarios.filter((s) => selectedTerminals.includes(s.terminal));
    }

    return scenarios;
  }, [data, selectedAirports, selectedTerminals]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredScenarios.length / pageSize);
  const currentScenarios = filteredScenarios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectScenario = (selectedScenario: ScenarioData) => {
    onSelectScenario(selectedScenario);
    setIsOpened(false);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
  };

  const toggleAirportFilter = (airport: string) => {
    setSelectedAirports((prev) =>
      prev.includes(airport) ? prev.filter((item) => item !== airport) : [...prev, airport]
    );
    setCurrentPage(1);
  };

  const toggleTerminalFilter = (terminal: string) => {
    setSelectedTerminals((prev) =>
      prev.includes(terminal) ? prev.filter((item) => item !== terminal) : [...prev, terminal]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedAirports([]);
    setSelectedTerminals([]);
    setCurrentPage(1);
  };

  const appliedFilterCount = selectedAirports.length + selectedTerminals.length;

  useEffect(() => {
    if (!hasAutoOpened.current && !isLoading && !scenario && availableScenarioCount > 0) {
      setIsOpened(true);
      hasAutoOpened.current = true;
    }
  }, [availableScenarioCount, isLoading, scenario]);

  useEffect(() => {
    if (scenario) {
      hasAutoOpened.current = false;
    }
  }, [scenario]);

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-default-900">Selected Scenario</h2>
          <p className="text-sm text-default-600">
            Review analysis results and insights for the selected simulation scenario
          </p>
        </div>
        <Dialog open={isOpened} onOpenChange={setIsOpened}>
          <DialogTrigger asChild>
            <Button>
              <Link2 className="mr-2 h-4 w-4" />
              Select Scenario
            </Button>
          </DialogTrigger>

          <DialogContent className="h-[800px] w-full max-w-[min(100vw-4rem,72rem)] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Scenario</DialogTitle>
              <DialogDescription>Select the scenario you&apos;d like to review.</DialogDescription>
            </DialogHeader>

            <Separator />

            {/* 필터 섹션 */}
            <div className="flex items-center justify-between gap-2.5 py-4">
              <div className="flex items-center gap-2.5">
                  {/* Filter Dropdown */}
                  {(airportOptions.length > 0 || terminalOptions.length > 0) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" className="w-36 justify-between">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-default-700">
                            <Filter className="h-4 w-4" />
                            Filter
                          </span>
                          <span className="flex items-center gap-1.5">
                            {appliedFilterCount > 0 && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {appliedFilterCount}
                              </span>
                            )}
                            <ChevronDown className="h-4 w-4 text-default-500" />
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
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
                                      'px-2 py-1.5',
                                      isSelected ? 'bg-primary/10 text-primary-900' : ''
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
                                      <span className="text-sm text-default-900">{airport}</span>
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
                                      'px-2 py-1.5',
                                      isSelected ? 'bg-primary/10 text-primary-900' : ''
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
                                      <span className="text-sm text-default-900">{terminal}</span>
                                    </label>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )}
                        {appliedFilterCount > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                clearAllFilters();
                              }}
                              className="text-sm text-default-600 hover:text-default-900"
                            >
                              Clear all filters
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>

              {/* Rows per page */}
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-default-500 md:inline">Rows per page</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
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

            {/* 테이블 영역 (스크롤 가능) */}
            <div className="flex-1 overflow-auto">
              <table className="table-default">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-default-900">
                        <Hash className="h-3.5 w-3.5" />
                        Name
                      </div>
                    </th>
                    <th className="px-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-default-900">
                        <Plane className="h-3.5 w-3.5" />
                        Airport
                      </div>
                    </th>
                    <th className="px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-sm font-medium text-default-900">
                        <Building2 className="h-3.5 w-3.5" />
                        Terminal
                      </div>
                    </th>
                    <th className="px-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-default-900">
                        <Clock4 className="h-3.5 w-3.5" />
                        Last Saved
                      </div>
                    </th>
                    <th className="px-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-default-900">
                        <History className="h-3.5 w-3.5" />
                        Last Run
                      </div>
                    </th>
                    <th className="px-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-default-900">
                        <StickyNote className="h-3.5 w-3.5" />
                        Memo
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="min-h-24">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-12">
                          <Spinner size={48} className="mx-auto mb-4" />
                          <p className="text-lg font-medium">Loading scenarios...</p>
                          <p className="text-sm font-normal">Please wait while we fetch your scenarios.</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentScenarios.length > 0 ? (
                    currentScenarios.map((item) => (
                      <tr
                        key={item.scenario_id}
                        className={cn(
                          "border-b text-sm hover:bg-muted",
                          item.has_simulation_data ? "" : "opacity-50"
                        )}
                      >
                        <td className="px-3">
                          <div
                            className={cn(
                              'flex items-center gap-2.5',
                              item.has_simulation_data
                                ? 'cursor-pointer hover:font-semibold'
                                : 'cursor-not-allowed line-through'
                            )}
                            onClick={() => {
                              if (item.has_simulation_data) {
                                selectScenario(item);
                              }
                            }}
                          >
                            {item.has_simulation_data ? (
                              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                            ) : (
                              <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                            )}

                            <span className="truncate">{item.name}</span>

                            {(item as any)?.isMaster && (
                              <span className="ml-2 inline-flex flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Master
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 whitespace-nowrap">
                          {item.airport}
                        </td>

                        <td className="px-3 text-center whitespace-nowrap">
                          {item.terminal}
                        </td>

                        <td className="px-3 whitespace-nowrap">
                          {item.metadata_updated_at ? (
                            <>
                              {dayjs(item.metadata_updated_at).format('YYYY-MM-DD')}
                              <br />
                              <span className="text-xs text-default-500">
                                {dayjs(item.metadata_updated_at).format('HH:mm')}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm italic text-default-400">Never saved</span>
                          )}
                        </td>

                        <td className="px-3 whitespace-nowrap">
                          {item.simulation_start_at ? (
                            <>
                              {dayjs(item.simulation_start_at).format('YYYY-MM-DD')}
                              <br />
                              <span className="text-xs text-default-500">
                                {dayjs(item.simulation_start_at).format('HH:mm')}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm italic text-default-400">Never run</span>
                          )}
                        </td>

                        <td className="px-3 align-top">
                          <span className="block max-w-xs truncate" title={item.memo || ''}>
                            {item.memo || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-12">
                          <Ban className="mx-auto mb-4 h-12 w-12" />
                          <p className="text-lg font-medium">No data</p>
                          <p className="text-sm font-normal">There are no scenarios available at the moment.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="mt-6 flex justify-center border-t pt-4">
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
                    if (currentPage < totalPages && totalPages > 1) {
                      setCurrentPage(totalPages);
                    }
                  }}
                  type="button"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scenario Info Section */}
      {scenario && (
        <div className="rounded-md border border-input bg-muted/30 px-4 py-3">
          <div className="space-y-3">
            {/* First Row: Name, Last Saved, Last Run + KPI Selector */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Name:</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                    {scenario.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Last Saved:</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                    {scenario.metadata_updated_at ? dayjs(scenario.metadata_updated_at).format('YYYY-MM-DD HH:mm') : 'Never saved'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Last Run:</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                    {scenario.simulation_start_at ? dayjs(scenario.simulation_start_at).format('YYYY-MM-DD HH:mm') : 'Never run'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HomeKpiSelector value={kpi} onChange={onKpiChange} />
              </div>
            </div>

            {/* Second Row: Airport, Terminal, Date */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Airport:</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                  {scenario.airport}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Terminal:</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                  {scenario.terminal}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Date:</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
                  {scenario.target_flight_schedule_date ? dayjs(scenario.target_flight_schedule_date).format('YYYY-MM-DD') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeScenario;
