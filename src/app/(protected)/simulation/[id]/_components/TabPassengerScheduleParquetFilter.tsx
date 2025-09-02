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
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);

  // zustand에서 selectedConditions 가져오기
  const selectedConditions = useSimulationStore((s) => s.flight.selectedConditions);

  // 사용 가능한 컬럼 목록 추출 (type에 따라 필터링)
  const availableColumns = useMemo(() => {
    return parquetMetadata
      .filter((item) => {
        // selectedConditions의 type에 따라 컬럼 필터링
        if (selectedConditions?.type === 'departure') {
          // departure로 시작하는 컬럼 제외 (단, departure_terminal은 예외)
          if (item.column.startsWith('departure') && item.column !== 'departure_terminal') {
            return false;
          }
        } else if (selectedConditions?.type === 'arrival') {
          // arrival로 시작하는 컬럼 제외 (단, arrival_terminal은 예외)
          if (item.column.startsWith('arrival') && item.column !== 'arrival_terminal') {
            return false;
          }
        }
        return true;
      })
      .map((item) => ({
        key: item.column,
        label: item.column.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // 예쁘게 표시
      }));
  }, [parquetMetadata, selectedConditions?.type]);

  // 선택된 컬럼의 사용 가능한 값들
  const availableValues = useMemo(() => {
    if (!selectedColumn) return [];

    const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
    if (!columnData) return [];

    return Object.keys(columnData.values).map((value) => ({
      key: value,
      label: value,
      flightCount: columnData.values[value].flights.length,
    }));
  }, [parquetMetadata, selectedColumn]);

  // 선택된 값들의 사용 가능한 항공편들
  const availableFlights = useMemo(() => {
    if (!selectedColumn || selectedValues.length === 0) return [];

    const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
    if (!columnData) return [];

    // 선택된 값들의 모든 항공편을 수집
    const allFlights = new Set<string>();
    selectedValues.forEach((value) => {
      columnData.values[value]?.flights.forEach((flight) => allFlights.add(flight));
    });

    return Array.from(allFlights)
      .sort()
      .map((flight) => ({
        key: flight,
        label: flight,
      }));
  }, [parquetMetadata, selectedColumn, selectedValues]);

  // 컬럼 선택 핸들러
  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
    setSelectedValues([]); // 컬럼 변경시 선택된 값들 초기화
    setSelectedFlights([]); // 컬럼 변경시 선택된 항공편들도 초기화
  };

  // 값 체크박스 토글 핸들러
  const handleValueToggle = (value: string) => {
    setSelectedValues((prev) => {
      const newValues = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      // 값이 변경되면 항공편 선택도 초기화
      setSelectedFlights([]);
      return newValues;
    });
  };

  // 항공편 체크박스 토글 핸들러
  const handleFlightToggle = (flight: string) => {
    setSelectedFlights((prev) => (prev.includes(flight) ? prev.filter((f) => f !== flight) : [...prev, flight]));
  };

  // 모든 값 선택/해제
  const handleSelectAll = () => {
    if (selectedValues.length === availableValues.length) {
      setSelectedValues([]);
      setSelectedFlights([]); // 값 선택 해제 시 항공편도 초기화
    } else {
      setSelectedValues(availableValues.map((v) => v.key));
      setSelectedFlights([]); // 값 선택 변경 시 항공편도 초기화
    }
  };

  // 모든 항공편 선택/해제
  const handleSelectAllFlights = () => {
    if (selectedFlights.length === availableFlights.length) {
      setSelectedFlights([]);
    } else {
      setSelectedFlights(availableFlights.map((f) => f.key));
    }
  };

  // 선택된 항공편 수 계산
  const selectedFlightCount = useMemo(() => {
    if (!selectedColumn || selectedValues.length === 0) return 0;

    const columnData = parquetMetadata.find((item) => item.column === selectedColumn);
    if (!columnData) return 0;

    const uniqueFlights = new Set<string>();
    selectedValues.forEach((value) => {
      columnData.values[value]?.flights.forEach((flight) => uniqueFlights.add(flight));
    });

    return uniqueFlights.size;
  }, [parquetMetadata, selectedColumn, selectedValues]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Add Passenger Profiles</div>
            <p className="text-sm font-normal text-default-500">Select flight criteria to filter passengers</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Column, Values, and Flights Selection - 한 줄로 배치 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Column Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-default-900">Select Column</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={availableColumns.length === 0}>
                  {selectedColumn
                    ? availableColumns.find((col) => col.key === selectedColumn)?.label
                    : 'Choose a column...'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {availableColumns.map((column) => (
                  <DropdownMenuItem key={column.key} onClick={() => handleColumnSelect(column.key)}>
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Values Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-default-900">
                Select Values ({selectedValues.length} of {availableValues.length})
              </h4>
              {selectedColumn && (
                <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={availableValues.length === 0}>
                  {selectedValues.length === availableValues.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {!selectedColumn ? (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
                <span className="text-default-400 text-sm">Select a column first</span>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                {availableValues.length === 0 ? (
                  <div className="py-4 text-center text-sm text-default-500">No values available for this column</div>
                ) : (
                  availableValues.map((value) => (
                    <div key={value.key} className="flex items-center space-x-3">
                      <Checkbox
                        id={`value-${value.key}`}
                        checked={selectedValues.includes(value.key)}
                        onCheckedChange={() => handleValueToggle(value.key)}
                      />
                      <label
                        htmlFor={`value-${value.key}`}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {value.label}
                      </label>
                      <span className="bg-default-100 rounded px-2 py-1 text-xs text-default-500">
                        {value.flightCount} flights
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Flights Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-default-900">
                Select Flight ({selectedFlights.length} of {availableFlights.length})
              </h4>
              {selectedValues.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllFlights}
                  disabled={availableFlights.length === 0}
                >
                  {selectedFlights.length === availableFlights.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {selectedValues.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed">
                <span className="text-default-400 text-sm">Select values first</span>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                {availableFlights.length === 0 ? (
                  <div className="py-4 text-center text-sm text-default-500">
                    No flights available for selected values
                  </div>
                ) : (
                  availableFlights.map((flight) => (
                    <div key={flight.key} className="flex items-center space-x-3">
                      <Checkbox
                        id={`flight-${flight.key}`}
                        checked={selectedFlights.includes(flight.key)}
                        onCheckedChange={() => handleFlightToggle(flight.key)}
                      />
                      <label
                        htmlFor={`flight-${flight.key}`}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {flight.label}
                      </label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selection Summary */}
        {selectedColumn && selectedValues.length > 0 && (
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Filter Summary</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Column: <strong>{availableColumns.find((col) => col.key === selectedColumn)?.label}</strong>
                  </p>
                  <p>
                    Values: <strong>{selectedValues.join(', ')}</strong>
                  </p>
                  {selectedFlights.length > 0 && (
                    <p>
                      Selected Flights: <strong>{selectedFlights.join(', ')}</strong>
                    </p>
                  )}
                  <p>
                    {selectedFlights.length > 0 ? 'Selected' : 'Available'} Flights:{' '}
                    <strong>{selectedFlights.length > 0 ? selectedFlights.length : selectedFlightCount}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={selectedValues.length === 0}>
            Apply Filter ({selectedFlights.length > 0 ? selectedFlights.length : selectedFlightCount} flights)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedColumn('');
              setSelectedValues([]);
              setSelectedFlights([]);
            }}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
