'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
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

interface TabPassengerScheduleParquetFilterProps {
  parquetMetadata: ParquetMetadataItem[];
}

export default function TabPassengerScheduleParquetFilter({ parquetMetadata }: TabPassengerScheduleParquetFilterProps) {
  // 새로운 상태: 컬럼별로 선택된 values 관리
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>({});
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());

  // zustand에서 selectedConditions 가져오기
  const selectedConditions = useSimulationStore((s) => s.flight.selectedConditions);

  // 컬럼명 매핑 및 카테고리 정의
  const getColumnDisplayInfo = (columnKey: string) => {
    const columnMapping: Record<string, { label: string; category: string }> = {
      // Airline & Aircraft Info
      operating_carrier_name: { label: 'Airline', category: 'Airline & Aircraft' },
      aircraft_type_icao: { label: 'Aircraft Type', category: 'Airline & Aircraft' },
      total_seats: { label: 'Total Seats', category: 'Airline & Aircraft' },
      flight_type: { label: 'Flight Type', category: 'Airline & Aircraft' },

      // Departure Info
      departure_terminal: { label: 'Departure Terminal', category: 'Departure Info' },
      scheduled_departure_local: { label: 'Departure Time', category: 'Departure Info' },
      departure_city: { label: 'Departure City', category: 'Departure Info' },
      departure_country: { label: 'Departure Country', category: 'Departure Info' },
      departure_region: { label: 'Departure Region', category: 'Departure Info' },
      departure_airport_iata: { label: 'Departure Airport', category: 'Departure Info' },

      // Arrival Info
      arrival_airport_iata: { label: 'Arrival Airport', category: 'Arrival Info' },
      arrival_terminal: { label: 'Arrival Terminal', category: 'Arrival Info' },
      scheduled_arrival_local: { label: 'Arrival Time', category: 'Arrival Info' },
      arrival_city: { label: 'Arrival City', category: 'Arrival Info' },
      arrival_country: { label: 'Arrival Country', category: 'Arrival Info' },
      arrival_region: { label: 'Arrival Region', category: 'Arrival Info' },
    };

    return (
      columnMapping[columnKey] || {
        label: columnKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        category: 'Other',
      }
    );
  };

  // 사용 가능한 컬럼 목록 추출 (카테고리별로 그룹화)
  const availableColumnsByCategory = useMemo(() => {
    const filteredColumns = parquetMetadata.filter((item) => {
      // selectedConditions의 type에 따라 컬럼 필터링
      if (selectedConditions?.type === 'departure') {
        if (item.column.startsWith('departure') && item.column !== 'departure_terminal') {
          return false;
        }
      } else if (selectedConditions?.type === 'arrival') {
        if (item.column.startsWith('arrival') && item.column !== 'arrival_terminal') {
          return false;
        }
      }
      return true;
    });

    const columnsByCategory: Record<
      string,
      Array<{
        key: string;
        label: string;
        values: string[];
        totalFlights: number;
      }>
    > = {};

    filteredColumns.forEach((item) => {
      const displayInfo = getColumnDisplayInfo(item.column);
      const columnData = {
        key: item.column,
        label: displayInfo.label,
        values: Object.keys(item.values),
        totalFlights: Object.values(item.values).reduce((sum, valueData) => sum + valueData.flights.length, 0),
      };

      if (!columnsByCategory[displayInfo.category]) {
        columnsByCategory[displayInfo.category] = [];
      }
      columnsByCategory[displayInfo.category].push(columnData);
    });

    return columnsByCategory;
  }, [parquetMetadata, selectedConditions?.type]);

  // 조건을 만족하는 항공편들 계산 (OR/AND 로직)
  const matchingFlights = useMemo(() => {
    const columnKeys = Object.keys(selectedColumns);
    if (columnKeys.length === 0) return [];

    // 각 컬럼별로 항공편 수집 (OR 조건)
    const flightSetsByColumn = columnKeys.map((columnKey) => {
      const values = selectedColumns[columnKey];
      if (values.length === 0) return new Set<string>();

      const columnData = parquetMetadata.find((item) => item.column === columnKey);
      if (!columnData) return new Set<string>();

      const flights = new Set<string>();
      values.forEach((value) => {
        columnData.values[value]?.flights.forEach((flight) => flights.add(flight));
      });
      return flights;
    });

    // 컬럼 간 AND 조건 적용
    if (flightSetsByColumn.length === 0) return [];

    let result = flightSetsByColumn[0];
    for (let i = 1; i < flightSetsByColumn.length; i++) {
      result = new Set([...result].filter((flight) => flightSetsByColumn[i].has(flight)));
    }

    return Array.from(result)
      .sort()
      .map((flight) => ({
        key: flight,
        label: flight,
      }));
  }, [parquetMetadata, selectedColumns]);

  // 컬럼/값 체크박스 토글 핸들러
  const handleColumnValueToggle = (columnKey: string, value: string) => {
    setSelectedColumns((prev) => {
      const currentValues = prev[columnKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      if (newValues.length === 0) {
        // 값이 없으면 컬럼 자체를 제거
        const { [columnKey]: removed, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [columnKey]: newValues };
      }
    });

    // 조건이 변경되면 항공편 선택 초기화
    setSelectedFlights([]);
  };

  // 항공편 체크박스 토글 핸들러
  const handleFlightToggle = (flight: string) => {
    setSelectedFlights((prev) => (prev.includes(flight) ? prev.filter((f) => f !== flight) : [...prev, flight]));
  };

  // 모든 항공편 선택/해제
  const handleSelectAllFlights = () => {
    if (selectedFlights.length === matchingFlights.length) {
      setSelectedFlights([]);
    } else {
      setSelectedFlights(matchingFlights.map((f) => f.key));
    }
  };

  // 컬럼 expand/collapse 토글
  const handleToggleColumn = (columnKey: string) => {
    setExpandedColumns((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(columnKey)) {
        newExpanded.delete(columnKey);
      } else {
        newExpanded.add(columnKey);
      }
      return newExpanded;
    });
  };

  // 모든 조건 초기화
  const handleClearAll = () => {
    setSelectedColumns({});
    setSelectedFlights([]);
    setExpandedColumns(new Set());
  };

  // 선택된 조건 요약 정보
  const selectedCriteriaSummary = useMemo(() => {
    const columnKeys = Object.keys(selectedColumns);
    if (columnKeys.length === 0) return null;

    return columnKeys.map((columnKey) => {
      const displayInfo = getColumnDisplayInfo(columnKey);
      const values = selectedColumns[columnKey];

      return {
        columnLabel: displayInfo.label,
        values: values,
        count: values.length,
      };
    });
  }, [selectedColumns]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Add Passenger Profiles</div>
            <p className="text-sm font-normal text-default-500">Set criteria to create passenger profiles</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Criteria - 상단 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-default-900">Search Criteria</h4>
            {Object.keys(selectedColumns).length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>

          {/* Column Checkboxes by Category */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {Object.keys(availableColumnsByCategory).length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm text-default-500">No columns available</div>
            ) : (
              Object.entries(availableColumnsByCategory).map(([categoryName, columns]) => (
                <div key={categoryName} className="space-y-3">
                  <h5 className="text-default-800 border-default-200 border-b pb-1 text-sm font-semibold">
                    {categoryName}
                  </h5>
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div key={column.key} className="space-y-2">
                        <div
                          className="hover:bg-default-50 flex cursor-pointer items-center justify-between rounded border p-2"
                          onClick={() => handleToggleColumn(column.key)}
                          title={`Values: ${column.values.slice(0, 5).join(', ')}${column.values.length > 5 ? `, ... and ${column.values.length - 5} more` : ''}`}
                        >
                          <div className="flex items-center space-x-2">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${expandedColumns.has(column.key) ? 'rotate-0' : '-rotate-90'}`}
                            />
                            <span className="text-sm font-medium text-default-900">{column.label}</span>
                            {selectedColumns[column.key] && (
                              <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                {selectedColumns[column.key].length}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-default-500">{column.values.length}</span>
                        </div>

                        {/* Values for this column */}
                        {expandedColumns.has(column.key) && (
                          <div className="bg-default-50 ml-6 space-y-1 rounded p-2">
                            {column.values.map((value) => (
                              <div key={`${column.key}-${value}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${column.key}-${value}`}
                                  checked={selectedColumns[column.key]?.includes(value) || false}
                                  onCheckedChange={() => handleColumnValueToggle(column.key, value)}
                                />
                                <label
                                  htmlFor={`${column.key}-${value}`}
                                  className="text-default-700 flex-1 cursor-pointer truncate text-sm"
                                  title={value}
                                >
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Criteria Summary */}
          {selectedCriteriaSummary && (
            <div className="rounded-md bg-blue-50 p-4">
              <h5 className="mb-3 text-sm font-medium text-blue-800">Selected Criteria</h5>
              <div className="grid grid-cols-1 gap-2 text-sm text-blue-700 lg:grid-cols-3">
                {selectedCriteriaSummary.map((criteria, index) => (
                  <div key={index} className="rounded bg-white p-2">
                    <div className="font-medium">{criteria.columnLabel}</div>
                    <div className="text-xs">
                      {criteria.values.join(', ')}
                      {criteria.count > 1 && <span className="text-blue-600"> (OR)</span>}
                    </div>
                  </div>
                ))}
              </div>
              {selectedCriteriaSummary.length > 1 && (
                <div className="mt-2 border-t border-blue-200 pt-2 text-center font-medium text-blue-600">
                  Criteria relationship: AND
                </div>
              )}
            </div>
          )}
        </div>

        {/* Matching Flights - 하단 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-default-900">
              Matching Flights ({selectedFlights.length} of {matchingFlights.length})
            </h4>
            {matchingFlights.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleSelectAllFlights}>
                {selectedFlights.length === matchingFlights.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {Object.keys(selectedColumns).length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
              <span className="text-default-400 text-sm">Set search criteria first</span>
            </div>
          ) : (
            <div className="max-h-60 rounded-md border">
              {matchingFlights.length === 0 ? (
                <div className="py-8 text-center text-sm text-default-500">No flights match the selected criteria</div>
              ) : (
                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto p-3 lg:grid-cols-4 xl:grid-cols-6">
                  {matchingFlights.map((flight) => (
                    <div
                      key={flight.key}
                      className="hover:bg-default-50 flex items-center space-x-2 rounded border p-2"
                    >
                      <Checkbox
                        id={`flight-${flight.key}`}
                        checked={selectedFlights.includes(flight.key)}
                        onCheckedChange={() => handleFlightToggle(flight.key)}
                      />
                      <label
                        htmlFor={`flight-${flight.key}`}
                        className="cursor-pointer truncate text-sm font-medium text-default-900"
                        title={flight.label}
                      >
                        {flight.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={Object.keys(selectedColumns).length === 0}>
            Create Passenger Profile ({selectedFlights.length > 0 ? selectedFlights.length : matchingFlights.length}{' '}
            flights)
          </Button>
          <Button variant="outline" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
