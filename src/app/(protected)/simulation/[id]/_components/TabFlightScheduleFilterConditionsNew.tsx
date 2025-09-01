'use client';

import React, { useCallback, useState } from 'react';
import { ChevronDown, Filter, Loader2, Minus, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useSimulationStore } from '../_stores';

// ==================== Types ====================
// 실제 API 응답 구조에 맞춰 수정 (flight-filter.json 기준)
interface FlightFiltersApiResponse {
  airport: string;
  date: string;
  scenario_id: string;
  total_flights: number;
  airlines: Record<string, string>; // {"KE": "Korean Air", "7C": "Jeju Air"}
  filters: {
    departure: {
      total_flights: number; // ✅ 백엔드에서 계산된 값
      departure_terminal?: Record<string, FilterOption>;
      arrival_region?: Record<string, FilterOption>;
      arrival_country?: Record<string, FilterOption>;
      flight_type?: Record<string, FilterOption>;
    };
    arrival: {
      total_flights: number; // ✅ 백엔드에서 계산된 값
      arrival_terminal?: Record<string, FilterOption>;
      departure_region?: Record<string, FilterOption>;
      departure_country?: Record<string, FilterOption>;
      flight_type?: Record<string, FilterOption>;
    };
  };
}

interface FilterOption {
  total_flights: number; // ✅ 백엔드에서 계산된 값
  airlines: Record<
    string,
    {
      count: number;
      flight_numbers: number[];
    }
  >;
}

interface SelectedFilter {
  mode: 'departure' | 'arrival';
  categories: {
    flight_type?: string; // 'International' or 'Domestic'
    terminal?: string; // '1', '2', 'unknown'
    region?: string; // 'Asia', 'Europe', etc.
    country?: string; // 'Korea', 'Japan', etc.
  };
}

interface TabFlightScheduleFilterConditionsNewProps {
  loading: boolean; // 로딩 상태만 props로 (UI 상태)
  onApplyFilter: (type: string, conditions: Array<{ field: string; values: string[] }>) => Promise<any>;
  // filtersData props 제거 - zustand에서 직접 가져올 예정
}

// ==================== Component ====================
function TabFlightScheduleFilterConditionsNew({ loading, onApplyFilter }: TabFlightScheduleFilterConditionsNewProps) {
  // 🆕 zustand에서 직접 flight 데이터 구독
  const flightData = useSimulationStore((state) => state.flight);
  const setSelectedConditions = useSimulationStore((state) => state.setSelectedConditions);

  // 🆕 데이터 구조를 기존 인터페이스에 맞게 변환
  const filtersData: FlightFiltersApiResponse | null = flightData.total_flights
    ? {
        airport: useSimulationStore((s) => s.context.airport),
        date: useSimulationStore((s) => s.context.date),
        scenario_id: useSimulationStore((s) => s.context.scenarioId),
        total_flights: flightData.total_flights,
        airlines: flightData.airlines || {},
        filters: flightData.filters || { departure: {}, arrival: {} },
      }
    : null;
  // ==================== Local State ====================
  const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
    mode: 'departure', // default는 departure
    categories: {},
  });

  // ✅ Response Preview 상태 제거 (부모 컴포넌트에서 관리)

  // ==================== Helper Functions ====================

  // 카테고리 순서 정의: Type -> Terminal -> Location(Region/Country)
  const getCategoryOrder = useCallback((mode: string) => {
    // departure 모드일 때는 도착지 지역/국가를, arrival 모드일 때는 출발지 지역/국가를 필터링
    const oppositeMode = mode === 'departure' ? 'arrival' : 'departure';
    const order = ['flight_type', `${mode}_terminal`, `${oppositeMode}_region`, `${oppositeMode}_country`];
    return order;
  }, []);

  // 카테고리 표시 이름 변환 (수식어 제거)
  const getCategoryDisplayName = useCallback((category: string): string => {
    if (category.includes('terminal')) return 'Terminal';
    if (category.includes('region')) return 'Region';
    if (category.includes('country')) return 'Country';
    if (category === 'flight_type') return 'Type';
    return category;
  }, []);

  // 값 표시 이름 변환
  const getValueDisplayName = useCallback((category: string, value: string): string => {
    if (category.includes('terminal')) {
      return value === 'unknown' ? 'Unknown' : `Terminal ${value}`;
    }
    return value;
  }, []);

  // ==================== Event Handlers ====================

  // 모드 변경
  const handleModeChange = useCallback((mode: 'departure' | 'arrival') => {
    setSelectedFilter({
      mode,
      categories: {},
    });
  }, []);

  // 카테고리 값 선택/해제
  const handleCategoryValueChange = useCallback((category: string, value: string, checked: boolean) => {
    setSelectedFilter((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: checked ? value : undefined,
      },
    }));
  }, []);

  // Apply Filter 실행
  const handleApplyFilter = useCallback(async () => {
    // 선택된 조건들을 API 형식으로 변환
    const conditions: Array<{ field: string; values: string[] }> = [];

    Object.entries(selectedFilter.categories).forEach(([category, value]) => {
      if (value) {
        conditions.push({
          field: category,
          values: [value],
        });
      }
    });

    try {
      // zustand에 선택된 조건 저장
      setSelectedConditions(selectedFilter);
      console.log('💾 Selected conditions saved to zustand:', selectedFilter);

      console.log('🚀 Sending API request:', {
        type: selectedFilter.mode,
        conditions,
      });

      await onApplyFilter(selectedFilter.mode, conditions);
    } catch (error) {
      console.error('❌ API request failed:', error);
    }
  }, [selectedFilter, onApplyFilter]);

  // 초기화
  const handleClearAll = useCallback(() => {
    setSelectedFilter({
      mode: 'departure',
      categories: {},
    });
  }, []);

  // ==================== Computed Values ====================

  // 전체 항공사 정보 (이름 매핑용)
  const airlinesMapping = filtersData?.airlines || {};

  // 필터 적용 가능 여부 - 모드는 항상 선택되어 있으므로 true
  const canApplyFilter = true;

  // ==================== Render Helper ====================

  const renderFilterOptions = useCallback(
    (mode: string, modeFilters: any) => {
      if (!modeFilters) return null;

      const categoryOrder = getCategoryOrder(mode);
      const availableCategories = categoryOrder.filter((cat) => modeFilters[cat]);

      return (
        <div className="space-y-6">
          {availableCategories.map((category) => {
            const options = modeFilters[category];
            const displayName = getCategoryDisplayName(category);
            const isLocation = category.includes('region') || category.includes('country');

            return (
              <div key={category} className="space-y-3">
                <div className="border-b pb-2">
                  <Label className="text-sm font-medium">{isLocation ? 'Location' : displayName}</Label>
                  {isLocation && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {category.includes('region') ? 'By Region' : 'By Country'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(options).map(([value, option]: [string, any]) => {
                    const isSelected = selectedFilter.categories[category] === value;

                    return (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${category}-${value}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCategoryValueChange(category, value, !!checked)}
                        />
                        <Label htmlFor={`${category}-${value}`} className="cursor-pointer text-sm">
                          {getValueDisplayName(category, value)} ({option.total_flights} flights)
                        </Label>
                      </div>
                    );
                  })}
                </div>

                {/* 선택된 값의 Airlines 정보를 장바구니 스타일로 표시 */}
                {selectedFilter.categories[category] && (
                  <div className="mt-4">
                    <Label className="mb-3 block text-sm font-medium">
                      Airlines in {getValueDisplayName(category, selectedFilter.categories[category]!)}
                    </Label>

                    {/* 장바구니 스타일 UI */}
                    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-3 xl:gap-4">
                      {/* 왼쪽: 사용 가능한 항공사 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Available Airlines</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 해당 카테고리의 모든 항공사를 선택된 목록으로 이동
                              const categoryAirlines = Object.entries(
                                options[selectedFilter.categories[category]!]?.airlines || {}
                              ).map(([iataCode, _]) => ({
                                iata: iataCode,
                                name: airlinesMapping[iataCode] || 'Unknown',
                              }));
                              // 이 부분은 실제 구현 시 handleCategoryValueChange와 연동 필요
                            }}
                            className="h-6 px-2 text-xs hover:bg-primary/10"
                          >
                            Add All
                          </Button>
                        </div>
                        <div className="h-40 overflow-y-auto rounded-md border bg-muted/20 p-2 sm:h-44 lg:h-48">
                          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                            {Object.entries(options[selectedFilter.categories[category]!]?.airlines || {}).map(
                              ([iataCode, airlineData]: [string, any]) => {
                                const airlineName = airlinesMapping[iataCode] || 'Unknown Airline';

                                return (
                                  <Button
                                    key={iataCode}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // 개별 항공사를 선택된 목록으로 이동하는 로직
                                      console.log('Add airline:', iataCode, airlineName);
                                    }}
                                    className="h-8 w-full justify-between p-2 text-left transition-colors hover:bg-primary/10"
                                  >
                                    <div className="flex min-w-0 flex-1 items-center">
                                      <span className="mr-1 text-sm font-medium sm:mr-2">{iataCode}</span>
                                      <span className="truncate text-xs text-muted-foreground">- {airlineName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">{airlineData.count}</span>
                                      <Plus className="ml-1 h-3 w-3 flex-shrink-0 sm:ml-2" />
                                    </div>
                                  </Button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 오른쪽: 선택된 항공사 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Selected Airlines (0)</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // 모든 선택된 항공사를 사용 가능한 목록으로 이동
                              console.log('Remove all airlines');
                            }}
                            className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                          >
                            Remove All
                          </Button>
                        </div>
                        <div className="h-40 overflow-y-auto rounded-md border bg-primary/5 p-2 sm:h-44 lg:h-48">
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No airlines selected
                          </div>
                          {/* 선택된 항공사들이 여기에 표시될 예정 */}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    },
    [
      selectedFilter.categories,
      getCategoryOrder,
      getCategoryDisplayName,
      getValueDisplayName,
      handleCategoryValueChange,
      airlinesMapping,
    ]
  );

  // ==================== Render ====================

  // 🔄 Loading 상태 처리
  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="rounded-lg bg-primary/10 p-2">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-default-900">Filter Conditions</div>
              <p className="text-sm font-normal text-default-500">Loading filter options...</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading available filters...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 🆕 부모에서 조건부 렌더링하므로 여기서는 데이터가 항상 있다고 가정

  return (
    <Collapsible defaultOpen={true}>
      <Card className="mt-6">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50 [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-default-900">Filter Conditions</div>
                  <p className="text-sm font-normal text-default-500">
                    Select flight mode and filtering criteria ({filtersData?.total_flights || 0} total flights)
                  </p>
                </div>
              </CardTitle>
              <ChevronDown className="h-5 w-5 transition-transform duration-200" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Flight Mode를 탭으로 변경 */}
            <Tabs
              value={selectedFilter.mode}
              onValueChange={(value) => handleModeChange(value as 'departure' | 'arrival')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="departure">
                  Departure ({filtersData.filters.departure?.total_flights || 0} flights)
                </TabsTrigger>
                <TabsTrigger value="arrival">
                  Arrival ({filtersData.filters.arrival?.total_flights || 0} flights)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="departure" className="mt-6">
                {renderFilterOptions('departure', filtersData.filters.departure)}
              </TabsContent>

              <TabsContent value="arrival" className="mt-6">
                {renderFilterOptions('arrival', filtersData.filters.arrival)}
              </TabsContent>
            </Tabs>

            {/* 각 모드에 따른 옵션들이 이제 TabsContent 안에서 렌더링됨 */}

            {/* Request Body Preview */}
            {canApplyFilter && (
              <div className="mt-6 rounded-lg border bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="rounded bg-blue-100 p-1">
                    <Search className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-800">Request Body Preview</span>
                </div>
                <div className="rounded border bg-white p-3 font-mono text-sm">
                  <pre className="whitespace-pre-wrap text-slate-700">
                    {JSON.stringify(
                      {
                        airport: filtersData?.airport || '',
                        date: filtersData?.date || '',
                        type: selectedFilter.mode,
                        conditions: Object.entries(selectedFilter.categories)
                          .filter(([_, value]) => value)
                          .map(([field, value]) => ({
                            field,
                            values: [value],
                          })),
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* ✅ Response Preview 제거 - 독립 컴포넌트로 분리 */}

            {/* Selection Summary & Actions */}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Mode: <strong>{selectedFilter.mode.charAt(0).toUpperCase() + selectedFilter.mode.slice(1)}</strong>
                {Object.keys(selectedFilter.categories).length > 0 && (
                  <span className="ml-2 text-green-600">
                    • {Object.keys(selectedFilter.categories).length} filter(s) selected
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={Object.keys(selectedFilter.categories).length === 0}
                >
                  Clear All
                </Button>

                <Button size="sm" onClick={handleApplyFilter} disabled={!canApplyFilter || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Applying...</span>
                      <span className="sm:hidden">Apply</span>
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Apply Filters</span>
                      <span className="sm:hidden">Apply</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 현재 선택 상태 표시 */}
            {Object.keys(selectedFilter.categories).length > 0 && (
              <div className="rounded-lg bg-blue-50 p-3 text-sm">
                <div className="mb-1 font-medium text-blue-900">Current Selection:</div>
                <div className="space-y-1 text-blue-700">
                  <div>
                    • Mode:{' '}
                    <strong>{selectedFilter.mode.charAt(0).toUpperCase() + selectedFilter.mode.slice(1)}</strong>
                  </div>
                  {Object.entries(selectedFilter.categories).map(([category, value]) => (
                    <div key={category}>
                      • {getCategoryDisplayName(category)}: <strong>{getValueDisplayName(category, value!)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default React.memo(TabFlightScheduleFilterConditionsNew);
