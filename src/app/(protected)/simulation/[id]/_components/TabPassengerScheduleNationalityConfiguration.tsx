'use client';

import React, { useState } from 'react';
import { Globe, Plus, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useSimulationUIStore } from '../_stores';

interface TabPassengerScheduleNationalityConfigurationProps {
  simulationId: string;
}

export default function TabPassengerScheduleNationalityConfiguration({
  simulationId,
}: TabPassengerScheduleNationalityConfigurationProps) {
  
  // UI Store에서 parquet metadata 가져오기
  const parquetMetadata = useSimulationUIStore((state) => state.passengerSchedule.parquetMetadata);

  // 로컬 상태 관리 (나중에 zustand와 연결 예정)
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // parquetMetadata에서 컬럼 목록 추출
  const availableColumns = parquetMetadata?.columns || [];
  
  // 선택된 컬럼의 unique values 추출
  const selectedColumnData = availableColumns.find(col => col.name === selectedColumn);
  const availableValues = selectedColumnData?.unique_values || [];

  // 컬럼 선택 핸들러
  const handleColumnChange = (columnName: string) => {
    setSelectedColumn(columnName);
    setSelectedValues([]); // 컬럼 변경시 선택된 값들 초기화
  };

  // 값 선택/해제 핸들러
  const handleValueToggle = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-default-900">Passenger Nationality Configuration</div>
            <p className="text-sm font-normal text-default-500">
              Set domestic vs foreigner distribution rules by airline
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!parquetMetadata ? (
          <div className="py-8 text-center text-default-500">
            Please load flight schedule data first to configure nationality rules
          </div>
        ) : (
          <div className="space-y-6">
            {/* 조건 추가 섹션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-default-900">Add New Condition</h3>
              
              {/* 컬럼 선택 드롭다운 */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-default-700">
                  Select Column
                </label>
                <Select value={selectedColumn} onValueChange={handleColumnChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a column to filter by..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column.name} value={column.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{column.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {column.count} values
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 컬럼의 값들 표시 */}
              {selectedColumn && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-default-700">
                    Select Values for "{selectedColumn}"
                  </label>
                  <div className="rounded-lg border p-3 bg-default-50">
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {availableValues.map((value) => (
                        <Badge
                          key={value}
                          variant={selectedValues.includes(value) ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            selectedValues.includes(value) 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-default-100'
                          }`}
                          onClick={() => handleValueToggle(value)}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                    
                    {availableValues.length === 0 && (
                      <div className="text-xs text-default-500 text-center py-2">
                        No values available for this column
                      </div>
                    )}
                  </div>
                  
                  {/* 선택된 값들 요약 */}
                  {selectedValues.length > 0 && (
                    <div className="text-xs text-default-600">
                      Selected: {selectedValues.length} / {availableValues.length} values
                    </div>
                  )}
                </div>
              )}

              {/* 조건 추가 버튼 */}
              {selectedColumn && selectedValues.length > 0 && (
                <Button 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => {
                    // TODO: zustand와 연결
                    console.log('Adding condition:', { 
                      column: selectedColumn, 
                      values: selectedValues 
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              )}
            </div>

            {/* 디버그 정보 (접을 수 있게) */}
            <details className="text-xs">
              <summary className="cursor-pointer text-default-600 hover:text-default-800">
                🔍 Debug Info ({availableColumns.length} columns available)
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                <pre>{JSON.stringify({ selectedColumn, selectedValues }, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
