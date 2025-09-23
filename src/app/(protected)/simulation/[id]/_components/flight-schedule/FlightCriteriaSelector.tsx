'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

interface ParquetMetadataItem {
  column: string;
  values: Record<
    string,
    {
      flights: string[];
      indices: number[];
    }
  >;
}

// 🆕 추가 메타데이터 타입 정의 (pax_demographics용)
interface AdditionalMetadataItem {
  [key: string]: {
    available_values: string[];
    // 다른 필드들은 무시
  };
}

interface FlightCriteriaSelectorProps {
  parquetMetadata: ParquetMetadataItem[];
  additionalMetadata?: AdditionalMetadataItem; // 🆕 pax_demographics 데이터
  onSelectionChange?: (selectedItems: Record<string, boolean>) => void;
  onClearAll?: () => void;
  initialSelectedItems?: Record<string, boolean>;
  initialSelectedColumn?: string | null;
  title?: string; // 🆕 제목을 props로 받기
  icon?: React.ReactNode; // 🆕 아이콘/이모지를 props로 받기
  flightAirlines?: Record<string, string> | null; // 항공사 코드-이름 매핑
}

export default function FlightCriteriaSelector({
  parquetMetadata,
  additionalMetadata = {}, // 🆕 pax_demographics 데이터
  onSelectionChange,
  onClearAll,
  initialSelectedItems = {},
  initialSelectedColumn = null,
  title = 'Search Criteria', // 🆕 기본값 설정
  icon, // 🆕 아이콘 props 추가
  flightAirlines, // 항공사 코드-이름 매핑
}: FlightCriteriaSelectorProps) {
  // UI 상태 관리
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(initialSelectedItems);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(initialSelectedColumn);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 컬럼을 카테고리별로 그룹화
  const columnsByCategory = useMemo(() => {
    const categories: Record<string, Array<{ key: string; label: string }>> = {};

    // 🎯 1단계: 기존 parquetMetadata 처리 (하드코딩된 카테고리)
    parquetMetadata.forEach((item) => {
      let categoryName = '';
      let labelName = '';

      switch (item.column) {
        case 'operating_carrier_name':
        case 'operating_carrier_iata':
          categoryName = 'Airline & Aircraft';
          labelName = 'Airline';
          break;
        case 'aircraft_type_icao':
          categoryName = 'Airline & Aircraft';
          labelName = 'Aircraft Type';
          break;
        case 'flight_type':
          categoryName = 'Airline & Aircraft';
          labelName = 'Flight Type';
          break;
        case 'total_seats':
          categoryName = 'Airline & Aircraft';
          labelName = 'Total Seats';
          break;
        case 'arrival_airport_iata':
        case 'arrival_city':
        case 'arrival_country':
        case 'arrival_region':
        case 'arrival_terminal':
          categoryName = 'Arrival Info';
          labelName = item.column
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          break;
        case 'departure_airport_iata':
        case 'departure_city':
        case 'departure_country':
        case 'departure_region':
        case 'departure_terminal':
          categoryName = 'Departure Info';
          labelName = item.column
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          break;
        case 'nationality':
          categoryName = 'Passenger Demographics';
          labelName = 'Nationality';
          break;
        case 'profile':
          categoryName = 'Passenger Demographics';
          labelName = 'Passenger Profile';
          break;
        default:
          // 🆕 승객 관련 컬럼들 패턴 매칭
          if (
            item.column.startsWith('pax_') ||
            item.column.startsWith('passenger_') ||
            item.column.includes('demographics') ||
            item.column.includes('nationality') ||
            item.column.includes('profile')
          ) {
            categoryName = 'Passenger Demographics';
            labelName = item.column
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } else {
            categoryName = 'Other';
            labelName = item.column
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          }
          break;
      } // switch 문 닫기

      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }

      categories[categoryName].push({
        key: item.column,
        label: labelName,
      });
    });

    // 🎯 2단계: additionalMetadata 처리 (자동으로 "Passenger Demographics"로 분류)
    Object.entries(additionalMetadata).forEach(([key, data]) => {
      const categoryName = 'Passenger Demographics';
      const labelName =
        key === 'nationality'
          ? 'Nationality'
          : key === 'profile'
            ? 'Profile'
            : key
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }

      categories[categoryName].push({
        key: key,
        label: labelName,
      });
    });

    // 🎯 3단계: 카테고리 우선 정렬 (Passenger Demographics를 맨 위로)
    const sortedCategories: Record<string, Array<{ key: string; label: string }>> = {};

    // 1단계: additionalMetadata에서 생성된 "Passenger Demographics" 먼저 추가
    if (categories['Passenger Demographics']) {
      sortedCategories['Passenger Demographics'] = categories['Passenger Demographics'];
    }

    // 2단계: 나머지 기본 카테고리들 추가 (기존 순서 유지)
    const defaultCategoryOrder = ['Airline & Aircraft', 'Departure Info', 'Arrival Info', 'Other'];
    defaultCategoryOrder.forEach((category) => {
      if (categories[category] && !sortedCategories[category]) {
        sortedCategories[category] = categories[category];
      }
    });

    // 3단계: 혹시 빠진 카테고리들 마지막에 추가
    Object.entries(categories).forEach(([category, items]) => {
      if (!sortedCategories[category]) {
        sortedCategories[category] = items;
      }
    });

    return sortedCategories;
  }, [parquetMetadata, additionalMetadata]);

  // 컬럼 라벨 가져오기 함수
  const getColumnLabel = (columnKey: string): string => {
    for (const columns of Object.values(columnsByCategory)) {
      const column = columns.find((col) => col.key === columnKey);
      if (column) return column.label;
    }
    return columnKey;
  };

  // 항공편 계산 (선택된 항목들을 기반으로)
  const flightCalculations = useMemo(() => {
    if (Object.values(selectedItems).filter(Boolean).length === 0) {
      return {
        totalSelected: 0,
        totalFlights: 186, // 고정값 또는 props로 받을 수 있음
        airlineBreakdown: [],
      };
    }

    // 실제 계산 로직 (간소화)
    let totalSelected = 0;
    const airlineBreakdown: Array<{ name: string; selected: number; total: number }> = [];

    // 선택된 아이템들로부터 항공편 수 계산
    Object.entries(selectedItems).forEach(([itemKey, isSelected]) => {
      if (isSelected) {
        const [columnKey, value] = itemKey.split(':');
        const columnData = parquetMetadata.find((item) => item.column === columnKey);
        if (columnData && columnData.values[value]) {
          totalSelected += columnData.values[value].flights.length;
        }
      }
    });

    // 항공사별 breakdown 계산 (Korean Air, Asiana Airlines 예시)
    const airlines = ['Korean Air', 'Asiana Airlines'];
    airlines.forEach((airline) => {
      let selected = 0;
      let total = 0;

      // 간소화된 계산
      if (airline === 'Korean Air') {
        total = 114;
        selected = totalSelected > 0 ? Math.min(totalSelected, 114) : 0;
      } else if (airline === 'Asiana Airlines') {
        total = 70;
        selected = totalSelected > 114 ? Math.min(totalSelected - 114, 70) : 0;
      }

      airlineBreakdown.push({ name: airline, selected, total });
    });

    return {
      totalSelected,
      totalFlights: 186,
      airlineBreakdown,
    };
  }, [selectedItems, parquetMetadata]);

  // 이벤트 핸들러들
  const handleColumnSelect = (columnKey: string) => {
    setSelectedColumn(columnKey);
    setSearchQuery(''); // 컬럼 변경 시 검색어 초기화
  };

  const handleItemToggle = (itemKey: string) => {
    const newSelectedItems = {
      ...selectedItems,
      [itemKey]: !selectedItems[itemKey],
    };
    setSelectedItems(newSelectedItems);
    onSelectionChange?.(newSelectedItems);
  };

  const handleClearAll = () => {
    setSelectedItems({});
    setSelectedColumn(null);
    setSearchQuery('');
    onSelectionChange?.({});
    onClearAll?.();
  };

  // 컬럼 내 전체 선택/해제
  const isAllSelectedInColumn = (columnKey: string, values: string[]): boolean => {
    return values.every((value) => selectedItems[`${columnKey}:${value}`]);
  };

  const handleSelectAllInColumn = (columnKey: string, values: string[]) => {
    const isAllSelected = isAllSelectedInColumn(columnKey, values);
    const newSelectedItems = { ...selectedItems };

    values.forEach((value) => {
      const itemKey = `${columnKey}:${value}`;
      if (isAllSelected) {
        delete newSelectedItems[itemKey]; // 전체 해제
      } else {
        newSelectedItems[itemKey] = true; // 전체 선택
      }
    });

    setSelectedItems(newSelectedItems);
    onSelectionChange?.(newSelectedItems);
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center text-sm font-medium text-default-900">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h4>
        <div className="flex items-center">
          <Button variant="outline" onClick={handleClearAll} disabled={selectedCount === 0}>
            Clear All
          </Button>
        </div>
      </div>

      {/* 3열 구조 */}
      <div className="flex h-96 gap-4">
        {/* 첫번째: 컬럼 목록 */}
        <div className="w-[40%] rounded-md border p-3">
          <div className="max-h-full space-y-4 overflow-y-auto">
            {Object.keys(columnsByCategory).length === 0 ? (
              <div className="py-8 text-center text-sm text-default-500">No columns available</div>
            ) : (
              Object.entries(columnsByCategory).map(([categoryName, columns]) => (
                <div key={categoryName} className="space-y-2">
                  {/* 카테고리 제목 */}
                  <div className="text-sm font-semibold text-default-900">{categoryName}</div>
                  <div className="border-default-200 mb-2 border-b"></div>

                  {/* 컬럼 목록 */}
                  <div className="ml-2 space-y-1">
                    {columns.map((column) => (
                      <div
                        key={column.key}
                        className={`hover:bg-default-50 flex cursor-pointer items-center justify-between rounded px-2 py-1.5 transition-colors ${
                          selectedColumn === column.key ? 'bg-primary/10 text-primary' : ''
                        }`}
                        onClick={() => handleColumnSelect(column.key)}
                      >
                        <span className="truncate text-sm">{column.label}</span>
                        <ChevronDown className="h-3 w-3 -rotate-90" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 두번째: 선택된 컬럼의 상세 데이터 */}
        <div className="w-[40%] rounded-md border p-3">
          {selectedColumn ? (
            <div className="flex h-full flex-col">
              {(() => {
                // 🎯 parquetMetadata 또는 additionalMetadata에서 데이터 찾기
                const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
                const additionalData = additionalMetadata[selectedColumn];

                let sortedValues: string[] = [];

                if (columnData) {
                  // parquetMetadata에서 온 데이터 처리
                  sortedValues = Object.keys(columnData.values).sort((a, b) => {
                    const flightsA = columnData.values[a].flights.length;
                    const flightsB = columnData.values[b].flights.length;
                    return flightsB - flightsA; // 항공편 수 기준 내림차순
                  });
                } else if (additionalData) {
                  // additionalMetadata에서 온 데이터 처리 (flights 계산 생략)
                  sortedValues = [...additionalData.available_values].sort(); // 🔧 배열 복사 후 정렬
                } else {
                  return <div className="text-sm text-default-500">Column data not found</div>;
                }

                // 검색어에 따른 필터링
                const filteredValues = sortedValues.filter((value) => {
                  const searchLower = searchQuery.toLowerCase();
                  // Airline의 경우 코드와 이름 모두로 검색
                  if (selectedColumn === 'operating_carrier_iata' && flightAirlines?.[value]) {
                    return value.toLowerCase().includes(searchLower) ||
                           flightAirlines[value].toLowerCase().includes(searchLower);
                  }
                  return value.toLowerCase().includes(searchLower);
                });

                const isAllSelected = isAllSelectedInColumn(selectedColumn, filteredValues);

                return (
                  <>
                    {/* 헤더와 Select All */}
                    <div className="mb-3 flex items-center justify-between border-b pb-2">
                      <h6 className="text-sm font-semibold text-default-900">{getColumnLabel(selectedColumn)}</h6>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`select-all-${selectedColumn}`}
                          checked={isAllSelected}
                          onCheckedChange={() => handleSelectAllInColumn(selectedColumn, filteredValues)}
                        />
                        <label
                          htmlFor={`select-all-${selectedColumn}`}
                          className="text-default-700 cursor-pointer text-xs font-medium"
                        >
                          Select All
                        </label>
                      </div>
                    </div>

                    {/* 검색창 */}
                    <div className="relative mb-2">
                      <Search className="text-default-400 absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                        className="border-default-200/60 placeholder:text-default-400 w-full border-b bg-transparent py-1.5 pl-8 pr-3 text-xs focus:outline-none"
                      />
                    </div>

                    {/* 목록 */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="space-y-1">
                        {filteredValues.length === 0 && searchQuery ? (
                          <div className="py-4 text-center text-sm text-default-500">
                            No results found for "{searchQuery}"
                          </div>
                        ) : (
                          filteredValues.map((value) => {
                            const itemKey = `${selectedColumn}:${value}`;
                            const isSelected = selectedItems[itemKey] || false;

                            // 🎯 flights count 계산 (parquetMetadata vs additionalMetadata)
                            let flightInfo = '';
                            if (columnData) {
                              // parquetMetadata에서 온 데이터
                              const flightCount = columnData.values[value].flights.length;
                              flightInfo = `${flightCount} flights`;
                            } else if (additionalData) {
                              // additionalMetadata에서 온 데이터 (flights 생략)
                              flightInfo = ''; // 빈 문자열로 표시
                            }

                            return (
                              <div key={value} className="flex items-center space-x-2 py-1 text-sm">
                                <Checkbox
                                  id={itemKey}
                                  checked={isSelected}
                                  onCheckedChange={() => handleItemToggle(itemKey)}
                                />
                                <label htmlFor={itemKey} className="text-default-700 flex-1 cursor-pointer truncate">
                                  {selectedColumn === 'operating_carrier_iata' && flightAirlines?.[value]
                                    ? `(${value}) ${flightAirlines[value]}`
                                    : value}
                                </label>
                                {flightInfo && (
                                  <span className="text-default-400 text-xs font-medium">{flightInfo}</span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-default-500">
              Select a column to view details
            </div>
          )}
        </div>

        {/* 세번째: Selected Flights */}
        <div className="w-[30%] rounded-md border p-3">
          <div className="flex h-full flex-col">
            <h4 className="mb-3 text-sm font-bold text-default-900">Flights</h4>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {flightCalculations.airlineBreakdown.map((airline) => (
                  <div key={airline.name} className="rounded border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-default-900">{airline.name}</span>
                      <span className="text-sm">
                        <span className={`font-bold ${airline.selected > 0 ? 'text-primary' : 'text-default-600'}`}>
                          {airline.selected}
                        </span>
                        <span className="text-default-900"> / {airline.total}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
