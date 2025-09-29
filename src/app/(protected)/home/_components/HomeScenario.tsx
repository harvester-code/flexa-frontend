'use client';

import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import {
  Ban,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link2,
  Loader2,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import { ScenarioData } from '@/types/homeTypes';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';

interface HomeScenarioProps {
  className?: string;
  data: ScenarioData[];
  scenario: ScenarioData | null;
  onSelectScenario: Dispatch<SetStateAction<ScenarioData | null>>;
  isLoading?: boolean;
}

// 페이지당 표시할 시나리오 개수 (이 값을 변경하면 팝업 크기가 자동으로 조정됩니다)
const ITEMS_PER_PAGE = 5;

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
        className={page === currentPage ? 'transition-colors' : 'transition-colors hover:bg-muted'}
      >
        {page}
      </Button>
    );
  });
};

function HomeScenario({ className, data, scenario, onSelectScenario, isLoading = false }: HomeScenarioProps) {
  const router = useRouter();
  const [isOpened, setIsOpened] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // 시나리오 필터링 (검색 키워드 및 날짜) - 단순화된 로직
  const filteredScenarios = useMemo(() => {
    let scenarios = data || [];

    // 날짜 필터링
    if (selectedDate) {
      const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      scenarios = scenarios.filter(
        (s) => s.simulation_start_at && dayjs(s.simulation_start_at).format('YYYY-MM-DD') === selectedDateStr
      );
    }

    // 검색 필터링
    if (searchKeyword) {
      scenarios = scenarios.filter(
        (s) =>
          s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          s.airport.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          s.terminal.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (s.memo && s.memo.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }

    return scenarios;
  }, [data, searchKeyword, selectedDate]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredScenarios.length / ITEMS_PER_PAGE);
  const currentScenarios = filteredScenarios.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selectScenario = (selectedScenario: ScenarioData) => {
    onSelectScenario(selectedScenario);
    setIsOpened(false);
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setCurrentPage(1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleNewScenario = () => {
    router.push('/simulation');
  };

  // 고정된 팝업 높이 계산 (ITEMS_PER_PAGE 기준)
  const getDialogHeight = () => {
    const headerHeight = 120; // 헤더 영역
    const filterHeight = 80; // 필터 영역
    const tableHeaderHeight = 50; // 테이블 헤더
    const rowHeight = 60; // 각 행의 높이
    const paginationHeight = 80; // 페이지네이션 높이
    const padding = 40; // 여백

    return headerHeight + filterHeight + tableHeaderHeight + ITEMS_PER_PAGE * rowHeight + paginationHeight + padding;
  };

  return (
    <div
      className={cn(
        'flex min-h-20 flex-col rounded-md border border-input px-4 py-2.5 text-sm font-normal md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Name:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {scenario?.name || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Airport:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {scenario?.airport || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Terminal:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {scenario?.terminal || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Date:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {scenario?.target_flight_schedule_date ? dayjs(scenario.target_flight_schedule_date).format('MM/DD') : 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Updated:</span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-sm font-medium">
              {scenario?.updated_at ? dayjs(scenario.updated_at).format('MM/DD HH:mm') : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex w-full justify-center md:mt-0 md:w-auto md:justify-end">
        <Dialog open={isOpened} onOpenChange={setIsOpened}>
          <DialogTrigger asChild>
            <Button>
              <Link2 className="mr-2 h-4 w-4" />
              Select Scenario
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Scenario</DialogTitle>
              <DialogDescription>Select the scenario you&apos;d like to review.</DialogDescription>
            </DialogHeader>

            <Separator />

            {/* 고정된 필터 섹션 */}
            <div className="flex-shrink-0" style={{ height: '80px' }}>
              <div className="flex h-full items-center justify-between">
                <div className="text-sm font-normal text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredScenarios.length)} of {filteredScenarios.length}{' '}
                  scenarios
                </div>

                <div className="flex items-center gap-2.5">
                  <Popover modal>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Calendar className="mr-2 h-4 w-4" />
                        Target Date {selectedDate && `(${dayjs(selectedDate).format('MMM-DD-YYYY')})`}
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
                            className="w-full"
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
                      onChange={(e) => handleSearch((e.target as HTMLInputElement).value)}
                    />
                    <Search className="ml-1 h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* 테이블 영역 (고정 높이, 스크롤 없음) */}
            <div className="flex-1 overflow-hidden" style={{ height: `${ITEMS_PER_PAGE * 60 + 50}px` }}>
              <table className="w-full table-fixed">
                <thead
                  className="sticky top-0 z-10 border-b border-primary bg-muted text-left text-sm font-medium"
                  style={{ height: '50px' }}
                >
                  <tr>
                    <th className="w-[30%] px-3 py-3 font-medium">Name</th>
                    <th className="w-[12%] px-3 py-3 font-medium">Airport</th>
                    <th className="w-[12%] px-3 py-3 font-medium">Terminal</th>
                    <th className="w-[16%] px-3 py-3 font-medium">Created at</th>
                    <th className="w-[16%] px-3 py-3 font-medium">Updated at</th>
                    <th className="w-[14%] px-3 py-3 font-medium">Memo</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}>
                      <td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">
                        <div
                          className="flex flex-col items-center justify-center"
                          style={{ height: `${ITEMS_PER_PAGE * 60}px` }}
                        >
                          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                          <p className="text-lg font-medium">Loading scenarios...</p>
                          <p className="text-sm font-normal">Please wait while we fetch your scenarios.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredScenarios.length > 0 ? (
                    Array.from({ length: ITEMS_PER_PAGE }, (_, index) => {
                      const item = currentScenarios[index];
                      if (!item) {
                        // 빈 행으로 채워서 높이 일정하게 유지
                        return (
                          <tr key={`empty-${index}`} className="border-b border-gray-100" style={{ height: '60px' }}>
                            <td colSpan={6} className="px-3 py-3 text-sm font-normal">
                              &nbsp;
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={item.scenario_id}
                          className="border-b border-gray-100 hover:bg-muted"
                          style={{ height: '60px' }}
                        >
                          <td className="px-3 py-3 text-sm font-normal">
                            <div
                              className={cn(
                                'flex cursor-pointer items-center gap-2.5',
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

                          <td className="truncate px-3 py-3 text-sm font-normal">{item.airport}</td>

                          <td className="truncate px-3 py-3 text-sm font-normal">
                            <i>{item.terminal}</i>
                          </td>

                          <td className="truncate px-3 py-3 text-sm font-normal">
                            {dayjs(item.created_at).format('MMM-DD-YYYY HH:mm')}
                          </td>

                          <td className="truncate px-3 py-3 text-sm font-normal">
                            {dayjs(item.updated_at).format('MMM-DD-YYYY HH:mm')}
                          </td>

                          <td className="px-3 py-3 text-sm font-normal">
                            <span className="block truncate" title={item.memo || ''}>
                              {item.memo || '-'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}>
                      <td colSpan={6} className="px-3 py-3 text-center text-muted-foreground">
                        <div
                          className="flex flex-col items-center justify-center"
                          style={{ height: `${ITEMS_PER_PAGE * 60}px` }}
                        >
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

            {/* 고정된 페이지네이션 */}
            <div className="flex flex-shrink-0 justify-center border-t" style={{ height: '80px' }}>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) setCurrentPage(1);
                  }}
                  type="button"
                  className="transition-colors hover:bg-muted"
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
                  className="transition-colors hover:bg-muted"
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
                  className="transition-colors hover:bg-muted"
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
                  className="transition-colors hover:bg-muted"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default HomeScenario;
