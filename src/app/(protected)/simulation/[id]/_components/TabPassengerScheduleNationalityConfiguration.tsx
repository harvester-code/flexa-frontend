'use client';

import React, { useState } from 'react';
import { Edit, Globe, Plus, Save, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { usePassengerScheduleStore } from '../_stores';

interface TabPassengerScheduleNationalityConfigurationProps {
  simulationId: string;
}

export default function TabPassengerScheduleNationalityConfiguration({
  simulationId,
}: TabPassengerScheduleNationalityConfigurationProps) {
  // UI Store에서 parquet metadata 가져오기

  // Passenger Schedule Store에서 nationality 관련 데이터와 액션들 가져오기
  const pax_demographics = usePassengerScheduleStore((state) => state.pax_demographics);
  const setNationalityValues = usePassengerScheduleStore((state) => state.setNationalityValues);
  const addNationalityRule = usePassengerScheduleStore((state) => state.addNationalityRule);
  const removeNationalityRule = usePassengerScheduleStore((state) => state.removeNationalityRule);
  const updateNationalityDistribution = usePassengerScheduleStore((state) => state.updateNationalityDistribution);

  // 1단계: available_values 정의용 로컬 상태
  const [valueInput, setValueInput] = useState<string>('');

  // 2단계: 조건 추가용 로컬 상태
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // 3단계: distribution 설정용 로컬 상태
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [distributionInputs, setDistributionInputs] = useState<Record<string, number>>({});

  // 하드코딩된 컬럼 목록 (parquetMetadata 대신 사용)
  const availableColumns = [
    { name: 'nationality', unique_values: ['US', 'KR', 'CN', 'JP', 'TW', 'SG', 'TH', 'VN', 'MY'], count: 9 },
    { name: 'passenger_type', unique_values: ['business', 'economy', 'first'], count: 3 },
  ];

  // 선택된 컬럼의 unique values 추출
  const selectedColumnData = availableColumns.find((col) => col.name === selectedColumn);
  const availableValues = selectedColumnData?.unique_values || [];

  // Helper: available_values가 정의되어 있는지 확인
  const hasAvailableValues = (pax_demographics.nationality.available_values?.length || 0) > 0;

  // 1단계: available_values 관리 핸들러들
  const handleAddValue = () => {
    if (!valueInput.trim()) return;

    const currentValues = pax_demographics.nationality.available_values || [];
    if (!currentValues.includes(valueInput.trim())) {
      setNationalityValues([...currentValues, valueInput.trim()]);
    }
    setValueInput('');
  };

  const handleRemoveValue = (valueToRemove: string) => {
    const currentValues = pax_demographics.nationality.available_values || [];
    setNationalityValues(currentValues.filter((v) => v !== valueToRemove));
  };

  // 2단계: 조건 관리 핸들러들
  const handleColumnChange = (columnName: string) => {
    setSelectedColumn(columnName);
    setSelectedValues([]);
  };

  const handleValueToggle = (value: string) => {
    setSelectedValues((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleSaveCondition = () => {
    if (!selectedColumn || selectedValues.length === 0) return;

    const conditions = {
      [selectedColumn]: selectedValues,
    };

    addNationalityRule(conditions);

    setSelectedColumn('');
    setSelectedValues([]);
  };

  // 3단계: distribution 관리 핸들러들
  const handleStartEditDistribution = (ruleIndex: number) => {
    setEditingRuleIndex(ruleIndex);
    const availableValues = pax_demographics.nationality.available_values || [];
    const initialDistribution: Record<string, number> = {};
    availableValues.forEach((value) => {
      initialDistribution[value] = 0;
    });
    setDistributionInputs(initialDistribution);
  };

  const handleDistributionChange = (value: string, percentage: number) => {
    setDistributionInputs((prev) => ({
      ...prev,
      [value]: percentage / 100, // UI에서는 퍼센트로 입력받지만 저장할 때는 소수점으로
    }));
  };

  const handleSaveDistribution = () => {
    if (editingRuleIndex === null) return;

    // 비율 합계 검증 (1.0이어야 함)
    const total = Object.values(distributionInputs).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      alert('Total percentage must equal 100%');
      return;
    }

    updateNationalityDistribution(editingRuleIndex, distributionInputs);
    setEditingRuleIndex(null);
    setDistributionInputs({});
  };

  const handleCancelDistribution = () => {
    setEditingRuleIndex(null);
    setDistributionInputs({});
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
        <div className="space-y-6">
          {/* Step 1: Define Available Values */}
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="text-sm font-semibold text-default-900">Step 1: Define Nationality Values</h3>
              <p className="text-sm text-default-500">
                First, define what nationality values can be assigned
                {!hasAvailableValues && (
                  <span className="font-medium text-orange-600"> (Required to proceed to next steps)</span>
                )}
              </p>
            </div>

            {/* 값 입력 */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter nationality value (e.g., domestic)"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAddValue} disabled={!valueInput.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>

            {/* 현재 정의된 값들 표시 */}
            {pax_demographics.nationality.available_values?.length > 0 && (
              <div className="space-y-2">
                <div className="text-default-700 text-sm">
                  Available Values ({pax_demographics.nationality.available_values.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {pax_demographics.nationality.available_values.map((value) => (
                    <Badge
                      key={value}
                      variant="default"
                      className="cursor-pointer transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveValue(value)}
                    >
                      {value}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 다음 단계 안내 메시지 */}
            {!hasAvailableValues && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="text-sm text-orange-800">
                  <strong>Next:</strong> Add at least one nationality value above to proceed to Step 2 (Add Condition
                  Rules)
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Add Rules (available_values가 정의된 후에만 표시) */}
          {hasAvailableValues && (
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-sm font-semibold text-default-900">Step 2: Add Condition Rules</h3>
                <p className="text-sm text-default-500">
                  Define which passengers get this nationality based on flight data
                </p>
              </div>

              {/* 컬럼 선택 */}
              <div className="space-y-2">
                <label className="text-default-700 text-sm font-medium">Select Column</label>
                <Select value={selectedColumn} onValueChange={handleColumnChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a column to filter by..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column.name} value={column.name}>
                        <div className="flex w-full items-center justify-between">
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

              {/* 값 선택 */}
              {selectedColumn && (
                <div className="space-y-2">
                  <label className="text-default-700 text-sm font-medium">Select Values for "{selectedColumn}"</label>
                  <div className="bg-default-50 rounded-lg border p-3">
                    <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                      {availableValues.map((value) => (
                        <Badge
                          key={value}
                          variant={selectedValues.includes(value) ? 'default' : 'outline'}
                          className="cursor-pointer transition-all"
                          onClick={() => handleValueToggle(value)}
                        >
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedValues.length > 0 && (
                    <Button size="sm" className="w-full" onClick={handleSaveCondition}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Rule
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2 완료 후 Step 3 안내 */}
          {hasAvailableValues && (pax_demographics.nationality?.rules?.length || 0) === 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm text-blue-800">
                <strong>Next:</strong> Add at least one condition rule above to proceed to Step 3 (Set Distribution)
              </div>
            </div>
          )}

          {/* Step 3: Saved Rules & Distribution Setting */}
          {hasAvailableValues && (pax_demographics.nationality?.rules?.length || 0) > 0 && (
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-sm font-semibold text-default-900">Step 3: Set Distribution</h3>
                <p className="text-sm text-default-500">Configure percentage distribution for each rule</p>
              </div>

              <div className="space-y-3">
                {pax_demographics.nationality.rules.map((rule, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-medium text-default-900">Rule #{index + 1}</div>
                      <div className="flex items-center gap-2">
                        {editingRuleIndex === index ? (
                          <>
                            <Button size="sm" variant="outline" onClick={handleSaveDistribution}>
                              <Save className="mr-1 h-3 w-3" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancelDistribution}>
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEditDistribution(index)}
                              disabled={!pax_demographics.nationality.available_values?.length}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Set Distribution
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => removeNationalityRule(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 조건 표시 */}
                    <div className="mb-3 space-y-2">
                      {Object.entries(rule.conditions).map(([column, values]) => (
                        <div key={column} className="text-sm">
                          <span className="text-default-700 font-medium">{column}:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {values.map((value) => (
                              <Badge key={value} variant="secondary" className="text-xs">
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Distribution 편집/표시 */}
                    {editingRuleIndex === index ? (
                      <div className="bg-default-50 space-y-3 rounded-lg p-3">
                        <div className="text-sm font-medium text-default-900">Set Distribution Percentages</div>
                        {pax_demographics.nationality.available_values.map((value) => (
                          <div key={value} className="flex items-center gap-3">
                            <label className="text-default-700 w-20 text-sm">{value}</label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={Math.round((distributionInputs[value] || 0) * 100)}
                              onChange={(e) => handleDistributionChange(value, Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-default-600 text-sm">%</span>
                          </div>
                        ))}
                        <div className="text-default-600 text-sm">
                          Total:{' '}
                          {Math.round(Object.values(distributionInputs).reduce((sum, val) => sum + val, 0) * 100)}%
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.keys(rule.distribution).length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-default-700 text-sm font-medium">Distribution:</div>
                            {Object.entries(rule.distribution).map(([value, percentage]) => (
                              <div key={value} className="flex items-center justify-between text-sm">
                                <span className="text-default-600">{value}</span>
                                <span className="text-default-700 font-medium">{Math.round(percentage * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Distribution not set yet</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 디버그 정보 */}
          <details className="text-xs">
            <summary className="text-default-600 hover:text-default-800 cursor-pointer">Debug Info</summary>
            <div className="bg-default-50 mt-2 rounded p-2 text-xs">
              <pre>
                {JSON.stringify(
                  {
                    available_values: pax_demographics.nationality.available_values,
                    rules_count: pax_demographics.nationality.rules?.length || 0,
                    selectedColumn,
                    selectedValues,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
