'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

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

  // 사용 가능한 컬럼 목록 추출
  const availableColumns = useMemo(() => {
    return parquetMetadata.map((item) => ({
      key: item.column,
      label: item.column.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // 예쁘게 표시
    }));
  }, [parquetMetadata]);

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

  // 컬럼 선택 핸들러
  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
    setSelectedValues([]); // 컬럼 변경시 선택된 값들 초기화
  };

  // 값 체크박스 토글 핸들러
  const handleValueToggle = (value: string) => {
    setSelectedValues((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  // 모든 값 선택/해제
  const handleSelectAll = () => {
    if (selectedValues.length === availableValues.length) {
      setSelectedValues([]);
    } else {
      setSelectedValues(availableValues.map((v) => v.key));
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
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 019 17v-5.586L4.293 6.707A1 1 0 014 6V4z" />
            </svg>
          </div>
          Parquet Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Column Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Select Column</h4>
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
        {selectedColumn && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                Select Values ({selectedValues.length} of {availableValues.length})
              </h4>
              <Button variant="ghost" size="sm" onClick={handleSelectAll} disabled={availableValues.length === 0}>
                {selectedValues.length === availableValues.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
              {availableValues.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">No values available for this column</div>
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
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      {value.flightCount} flights
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

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
                  <p>
                    Total Flights: <strong>{selectedFlightCount}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={selectedValues.length === 0}>
            Apply Filter ({selectedFlightCount} flights)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedColumn('');
              setSelectedValues([]);
            }}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
