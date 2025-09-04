'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useSimulationStore } from '../_stores';

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

interface PassengerProfileCriteriaProps {
  parquetMetadata: ParquetMetadataItem[];
  definedProperties?: string[];
  configType?: string;
}

export default function PassengerProfileCriteria({
  parquetMetadata,
  definedProperties = [],
  configType,
}: PassengerProfileCriteriaProps) {
  // 🎯 단순한 UI 상태만 관리
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [propertyValues, setPropertyValues] = useState<Record<string, number>>({});

  // 🎯 zustand에서 type 정보 가져오기
  const selectedConditions = useSimulationStore((state) => state.flight.selectedConditions);
  const filterType = selectedConditions?.type || 'departure'; // 기본값 departure

  // 🎯 zustand 액션들 가져오기
  const setNationalityValues = useSimulationStore((state) => state.setNationalityValues);
  const addNationalityRule = useSimulationStore((state) => state.addNationalityRule);
  const updateNationalityDistribution = useSimulationStore((state) => state.updateNationalityDistribution);
  const setProfileValues = useSimulationStore((state) => state.setProfileValues);
  const addProfileRule = useSimulationStore((state) => state.addProfileRule);
  const updateProfileDistribution = useSimulationStore((state) => state.updateProfileDistribution);
  const setPaxGenerationValues = useSimulationStore((state) => state.setPaxGenerationValues);
  const addPaxGenerationRule = useSimulationStore((state) => state.addPaxGenerationRule);
  const setPaxGenerationDefault = useSimulationStore((state) => state.setPaxGenerationDefault);

  // Show-up-Time 관련 액션들
  const addPaxArrivalPatternRule = useSimulationStore((state) => state.addPaxArrivalPatternRule);
  const updatePaxArrivalPatternRule = useSimulationStore((state) => state.updatePaxArrivalPatternRule);

  // 🎯 현재 상태 가져오기 (ruleIndex 계산용)
  const passengerData = useSimulationStore((state) => state.passenger);

  // 🎯 컬럼 분류 (올바른 카테고리로)
  const getColumnCategory = (columnKey: string): string | null => {
    if (
      columnKey === 'operating_carrier_name' ||
      columnKey === 'aircraft_type_icao' ||
      columnKey === 'total_seats' ||
      columnKey === 'flight_type'
    ) {
      return 'Airline & Aircraft';
    }

    // arrival_terminal과 scheduled_arrival_local은 항상 제외
    if (columnKey === 'arrival_terminal' || columnKey === 'scheduled_arrival_local') {
      return null;
    }

    // type에 따른 분류
    if (filterType === 'departure') {
      // departure 모드
      if (columnKey === 'departure_terminal' || columnKey === 'scheduled_departure_local') {
        return 'Departure Info';
      }
      // arrival 관련 컬럼들은 Arrival Info (arrival_terminal, scheduled_arrival_local 제외)
      if (columnKey.startsWith('arrival')) {
        return 'Arrival Info';
      }
      // 나머지 departure 관련 컬럼들은 제외 (실제로는 표시하지 않음)
      return null;
    } else {
      // arrival 모드
      // departure 관련 컬럼들은 Departure Info
      if (columnKey.startsWith('departure') || columnKey === 'scheduled_departure_local') {
        return 'Departure Info';
      }
      // 나머지 arrival 관련 컬럼들은 제외 (arrival_terminal, scheduled_arrival_local은 이미 위에서 제외됨)
      return null;
    }
  };

  const getColumnLabel = (columnKey: string) => {
    const labels: Record<string, string> = {
      operating_carrier_name: 'Airline',
      aircraft_type_icao: 'Aircraft Type',
      total_seats: 'Total Seats',
      flight_type: 'Flight Type',
      arrival_airport_iata: 'Arrival Airport',
      arrival_terminal: 'Arrival Terminal',
      arrival_city: 'Arrival City',
      arrival_country: 'Arrival Country',
      arrival_region: 'Arrival Region',
      departure_terminal: 'Departure Terminal',
      departure_airport_iata: 'Departure Airport Iata',
      departure_city: 'Departure City',
      departure_country: 'Departure Country',
      departure_region: 'Departure Region',
      scheduled_departure_local: 'Scheduled Departure Local',
      scheduled_arrival_local: 'Scheduled Arrival Local',
    };
    return labels[columnKey] || columnKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 🎯 카테고리별 그룹화 (type에 따른 필터링 포함)
  const columnsByCategory: Record<string, Array<{ key: string; label: string; values: string[] }>> = {};

  parquetMetadata.forEach((item) => {
    // 🎯 적절한 카테고리로 분류
    const category = getColumnCategory(item.column);

    // null인 경우 (표시하지 않을 컬럼) 건너뛰기
    if (!category) return;

    const columnData = {
      key: item.column,
      label: getColumnLabel(item.column),
      values: Object.keys(item.values).sort((a, b) => {
        const flightsA = item.values[a].flights.length;
        const flightsB = item.values[b].flights.length;
        return flightsB - flightsA; // 내림차순 정렬 (항공편 수가 많은 것부터)
      }),
    };

    if (!columnsByCategory[category]) {
      columnsByCategory[category] = [];
    }
    columnsByCategory[category].push(columnData);
  });

  // 🎯 실시간 매칭 항공편 계산 (기존 OR/AND 로직 동일)
  const flightCalculations = useMemo(() => {
    const selectedKeys = Object.keys(selectedItems).filter((key) => selectedItems[key]);
    const airlineColumnData = parquetMetadata.find((item) => item.column === 'operating_carrier_name');

    // 항공사별 세부 정보 계산 (항상 모든 항공사 표시)
    const airlineBreakdown: Array<{ name: string; selected: number; total: number }> = [];

    if (selectedKeys.length === 0) {
      // 아무것도 선택하지 않은 경우 - 모든 항공사를 0 / total로 표시
      if (airlineColumnData) {
        Object.keys(airlineColumnData.values).forEach((airlineName) => {
          const totalForAirline = airlineColumnData.values[airlineName].flights.length;
          airlineBreakdown.push({
            name: airlineName,
            selected: 0,
            total: totalForAirline,
          });
        });
      }
      return {
        totalSelected: 0,
        airlineBreakdown: airlineBreakdown.sort((a, b) => b.total - a.total), // 전체 항공편 수 기준 내림차순
      };
    }

    // 컬럼별로 선택된 값들을 그룹화
    const conditionsByColumn: Record<string, string[]> = {};
    selectedKeys.forEach((key) => {
      const [columnKey, value] = key.split(':');
      if (!conditionsByColumn[columnKey]) {
        conditionsByColumn[columnKey] = [];
      }
      conditionsByColumn[columnKey].push(value);
    });

    // 각 컬럼의 조건을 만족하는 항공편 세트들을 구함
    const flightSetsByColumn: Set<string>[] = [];

    Object.entries(conditionsByColumn).forEach(([columnKey, values]) => {
      const columnData = parquetMetadata.find((item) => item.column === columnKey);
      if (!columnData) return;

      // 해당 컬럼에서 선택된 값들의 항공편들을 모두 수집 (OR 조건)
      const flightsInColumn = new Set<string>();
      values.forEach((value) => {
        if (columnData.values[value]) {
          columnData.values[value].flights.forEach((flight) => {
            flightsInColumn.add(flight);
          });
        }
      });

      if (flightsInColumn.size > 0) {
        flightSetsByColumn.push(flightsInColumn);
      }
    });

    // 모든 조건을 만족하는 항공편들의 교집합 구하기 (AND 조건)
    let matchingFlights: Set<string>;

    if (flightSetsByColumn.length === 0) {
      matchingFlights = new Set();
    } else if (flightSetsByColumn.length === 1) {
      matchingFlights = flightSetsByColumn[0];
    } else {
      matchingFlights = flightSetsByColumn[0];
      for (let i = 1; i < flightSetsByColumn.length; i++) {
        matchingFlights = new Set([...matchingFlights].filter((flight) => flightSetsByColumn[i].has(flight)));
      }
    }

    // 선택된 조건이 있는 경우 - 모든 항공사에 대해 계산
    if (airlineColumnData) {
      Object.keys(airlineColumnData.values).forEach((airlineName) => {
        const airlineFlights = new Set(airlineColumnData.values[airlineName].flights);
        // 선택된 항공편과 이 항공사 항공편의 교집합
        const selectedForAirline = [...matchingFlights].filter((flight) => airlineFlights.has(flight)).length;
        const totalForAirline = airlineColumnData.values[airlineName].flights.length;

        airlineBreakdown.push({
          name: airlineName,
          selected: selectedForAirline,
          total: totalForAirline,
        });
      });
    }

    return {
      totalSelected: matchingFlights.size,
      airlineBreakdown: airlineBreakdown.sort((a, b) => b.total - a.total), // 전체 항공편 수 기준 내림차순 (순서 고정)
    };
  }, [selectedItems, parquetMetadata]);

  // 전체 항공편 수 계산 (parquetMetadata에서)
  const totalFlights = useMemo(() => {
    const allFlights = new Set<string>();
    parquetMetadata.forEach((item) => {
      Object.values(item.values).forEach((valueData) => {
        valueData.flights.forEach((flight) => {
          allFlights.add(flight);
        });
      });
    });
    return allFlights.size;
  }, [parquetMetadata]);

  // 🎯 단순한 핸들러들
  const handleItemToggle = (itemKey: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const handleColumnSelect = (columnKey: string) => {
    setSelectedColumn((prev) => (prev === columnKey ? null : columnKey));
    setSearchQuery(''); // 컬럼 변경 시 검색어 리셋
  };

  const handleClearAll = () => {
    setSelectedItems({});
  };

  // Select All 로직
  const handleSelectAllInColumn = (columnKey: string, allValues: string[]) => {
    const allItemKeys = allValues.map((value) => `${columnKey}:${value}`);
    const allSelected = allItemKeys.every((key) => selectedItems[key]);

    if (allSelected) {
      // 모두 선택되어 있으면 모두 해제
      const newSelectedItems = { ...selectedItems };
      allItemKeys.forEach((key) => {
        delete newSelectedItems[key];
      });
      setSelectedItems(newSelectedItems);
    } else {
      // 모두 선택
      const newSelectedItems = { ...selectedItems };
      allItemKeys.forEach((key) => {
        newSelectedItems[key] = true;
      });
      setSelectedItems(newSelectedItems);
    }
  };

  // 현재 컬럼의 전체 선택 상태 확인
  const isAllSelectedInColumn = (columnKey: string, allValues: string[]) => {
    if (allValues.length === 0) return false; // 검색 결과가 없으면 체크 해제
    const allItemKeys = allValues.map((value) => `${columnKey}:${value}`);
    return allItemKeys.every((key) => selectedItems[key]);
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search Criteria */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-default-900">Search Criteria</h4>
          <div className="flex items-center">
            <Button variant="outline" onClick={handleClearAll} disabled={selectedCount === 0}>
              Clear All
            </Button>
          </div>
        </div>

        {/* 좌우 구조 */}
        <div className="flex h-96 gap-4">
          {/* 좌측: 컬럼 목록 */}
          <div className="w-1/3 rounded-md border p-3">
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

          {/* 우측: 선택된 컬럼의 상세 데이터 */}
          <div className="flex-1 rounded-md border p-3">
            {selectedColumn ? (
              <div className="flex h-full flex-col">
                {(() => {
                  const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
                  if (!columnData) {
                    return <div className="text-sm text-default-500">Column data not found</div>;
                  }

                  const sortedValues = Object.keys(columnData.values).sort((a, b) => {
                    const flightsA = columnData.values[a].flights.length;
                    const flightsB = columnData.values[b].flights.length;
                    return flightsB - flightsA; // 항공편 수 기준 내림차순
                  });

                  // 검색어에 따른 필터링
                  const filteredValues = sortedValues.filter((value) =>
                    value.toLowerCase().includes(searchQuery.toLowerCase())
                  );

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
                          onChange={(e) => setSearchQuery(e.target.value)}
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
                              const flightCount = columnData.values[value].flights.length;

                              return (
                                <div key={value} className="flex items-center space-x-2 py-1 text-sm">
                                  <Checkbox
                                    id={itemKey}
                                    checked={isSelected}
                                    onCheckedChange={() => handleItemToggle(itemKey)}
                                  />
                                  <label htmlFor={itemKey} className="text-default-700 flex-1 cursor-pointer truncate">
                                    {value}
                                  </label>
                                  <span className="text-default-400 text-xs font-medium">{flightCount} flights</span>
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
        </div>
      </div>

      {/* Selected Flights - 항상 표시 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-default-900">Selected Flights</h4>

        <div className="max-h-60 rounded-md border">
          <div className="p-3">
            <div className="grid grid-cols-4 gap-2 lg:grid-cols-6 xl:grid-cols-8">
              {flightCalculations.airlineBreakdown.map((airline) => (
                <div key={airline.name} className="bg-default-50 rounded border p-2 text-center">
                  <div className="truncate text-xs font-medium text-default-900">{airline.name}</div>
                  <div className="mt-1 text-xs">
                    <span className={`font-bold ${airline.selected > 0 ? 'text-primary' : 'text-default-900'}`}>
                      {airline.selected}
                    </span>
                    <span className="font-normal text-default-900"> / {airline.total}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 뱃지와 총계를 한 줄로 표시 */}
            <div className="border-default-200 mt-3 border-t pt-2">
              <div className="flex items-center gap-4">
                {/* 뱃지 부분 (80%) */}
                <div className="min-w-0 flex-1">
                  {selectedCount > 0 ? (
                    <div className="flex flex-wrap justify-center gap-1">
                      {Object.keys(selectedItems)
                        .filter((key) => selectedItems[key])
                        .map((key) => {
                          const [, value] = key.split(':');
                          return (
                            <span
                              key={key}
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {value}
                            </span>
                          );
                        })}
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>

                {/* 총계 부분 (20%) */}
                <div className="flex-shrink-0">
                  <span className="text-sm font-medium text-default-900">
                    {flightCalculations.totalSelected} of {totalFlights} flights selected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property Value Assignment - only show if properties are defined and flights are selected */}
      {definedProperties.length > 0 && flightCalculations.totalSelected > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-default-900">
            Assign Values for Selected Flights ({flightCalculations.totalSelected} flights)
          </h4>

          <div className="rounded-md border p-4">
            <div className="grid gap-4">
              {definedProperties.map((property) => (
                <div key={property} className="flex items-center gap-3">
                  <label className="w-24 min-w-0 flex-shrink-0 text-sm font-medium text-default-900">{property}:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      max={configType === 'load_factor' ? '1' : '100'}
                      step="0.01"
                      value={propertyValues[property] || ''}
                      onChange={(e) =>
                        setPropertyValues((prev) => ({
                          ...prev,
                          [property]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-24 rounded border px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-default-500">
                      {configType === 'load_factor'
                        ? '(0.0 - 1.0)'
                        : configType === 'pax_arrival_patterns'
                          ? property === 'mean'
                            ? 'minutes'
                            : 'std'
                          : '%'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Validation message for percentages */}
              {(configType === 'nationality' || configType === 'profile') && (
                <div className="text-xs text-default-500">
                  Total percentage:{' '}
                  {Object.values(propertyValues)
                    .reduce((sum, val) => sum + (val || 0), 0)
                    .toFixed(1)}
                  %
                  {Object.values(propertyValues).reduce((sum, val) => sum + (val || 0), 0) !== 100 && (
                    <span className="text-amber-600"> (should equal 100%)</span>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                  onClick={() => {
                    try {
                      // 🎯 1. available_values 저장
                      if (configType === 'nationality') {
                        setNationalityValues(definedProperties);
                      } else if (configType === 'profile') {
                        setProfileValues(definedProperties);
                      } else if (configType === 'load_factor') {
                        setPaxGenerationValues(definedProperties);
                      }

                      // 🎯 2. 선택된 조건을 API 형태로 변환
                      const conditions: Record<string, string[]> = {};
                      Object.keys(selectedItems)
                        .filter((key) => selectedItems[key])
                        .forEach((key) => {
                          const [columnKey, value] = key.split(':');

                          // operating_carrier_name을 operating_carrier_iata로 변환
                          let apiField = columnKey;
                          let apiValue = value;

                          if (columnKey === 'operating_carrier_name') {
                            apiField = 'operating_carrier_iata';
                            // 항공사 이름을 IATA 코드로 변환 (간단한 매핑)
                            const airlineMapping: Record<string, string> = {
                              'Korean Air': 'KE',
                              'Asiana Airlines': 'OZ',
                              'Jin Air': 'LJ',
                              'Air Busan': 'BX',
                              // 필요에 따라 더 추가
                            };
                            apiValue = airlineMapping[value] || value;
                          }

                          if (!conditions[apiField]) {
                            conditions[apiField] = [];
                          }
                          if (!conditions[apiField].includes(apiValue)) {
                            conditions[apiField].push(apiValue);
                          }
                        });

                      // 🎯 3. 규칙 추가
                      if (configType === 'nationality') {
                        // 현재 rules 개수를 가져와서 새 규칙의 인덱스로 사용
                        const currentRulesLength = passengerData.pax_demographics.nationality.rules.length;
                        addNationalityRule(conditions);
                        updateNationalityDistribution(currentRulesLength, propertyValues);
                      } else if (configType === 'profile') {
                        const currentRulesLength = passengerData.pax_demographics.profile.rules.length;
                        addProfileRule(conditions);
                        updateProfileDistribution(currentRulesLength, propertyValues);
                      } else if (configType === 'load_factor') {
                        // Load Factor는 단일 값
                        const value = Object.values(propertyValues)[0] || 0;
                        addPaxGenerationRule(conditions, value);
                      } else if (configType === 'pax_arrival_patterns') {
                        // Show-up-Time은 새로운 value 구조 사용
                        const rule = {
                          conditions: conditions,
                          value: {
                            mean: propertyValues.mean || 120,
                            std: propertyValues.std || 30,
                          },
                        };
                        addPaxArrivalPatternRule(rule);
                      }

                      console.log('✅ Configuration saved successfully:', {
                        configType,
                        availableValues: definedProperties,
                        conditions,
                        values: propertyValues,
                        flights: flightCalculations.totalSelected,
                      });
                    } catch (error) {
                      console.error('❌ Failed to save configuration:', error);
                    }
                  }}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
