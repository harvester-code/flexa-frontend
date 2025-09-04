'use client';

import React, { useState } from 'react';
import { Edit, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { useSimulationStore } from '../_stores';
import PassengerProfileCriteria from './PassengerProfileCriteria';

interface TabVariable {
  name: string;
  type: 'number' | 'percentage';
  defaultValue?: number;
}

interface TabConfig {
  type: 'load_factor' | 'nationality' | 'profile' | 'pax_arrival_patterns';
  defaultValues: Record<string, any>;
  labels: {
    step1Title: string;
    step3Title: string;
  };
}

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

interface PassengerConfigTabProps {
  config: TabConfig;
  parquetMetadata: ParquetMetadataItem[];
}

export default function PassengerConfigTab({ config, parquetMetadata }: PassengerConfigTabProps) {
  const [definedProperties, setDefinedProperties] = useState<string[]>([]);
  const [newPropertyName, setNewPropertyName] = useState<string>('');

  // Default Values 설정 상태
  const [defineDefault, setDefineDefault] = useState<boolean>(false);
  const [defaultValues, setDefaultValues] = useState<Record<string, number>>({});

  // Dialog 상태 관리
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState<boolean>(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // Zustand 액션들
  const setNationalityDefault = useSimulationStore((state) => state.setNationalityDefault);
  const setProfileDefault = useSimulationStore((state) => state.setProfileDefault);
  const setPaxGenerationDefault = useSimulationStore((state) => state.setPaxGenerationDefault);

  // 저장된 rules 가져오기
  const passengerData = useSimulationStore((state) => state.passenger);
  const removeNationalityRule = useSimulationStore((state) => state.removeNationalityRule);
  const removeProfileRule = useSimulationStore((state) => state.removeProfileRule);
  const removePaxGenerationRule = useSimulationStore((state) => state.removePaxGenerationRule);

  const handleAddProperty = () => {
    if (newPropertyName.trim() && !definedProperties.includes(newPropertyName.trim())) {
      const newProperty = newPropertyName.trim();
      setDefinedProperties([...definedProperties, newProperty]);
      setNewPropertyName('');

      // 새 property 추가시 defaultValues에도 0으로 초기화
      if (defineDefault && (config.type === 'nationality' || config.type === 'profile')) {
        setDefaultValues((prev) => ({ ...prev, [newProperty]: 0 }));
      }
    }
  };

  const handleRemoveProperty = (propertyName: string) => {
    setDefinedProperties(definedProperties.filter((p) => p !== propertyName));

    // Property 제거시 defaultValues에서도 제거
    setDefaultValues((prev) => {
      const newDefaults = { ...prev };
      delete newDefaults[propertyName];
      return newDefaults;
    });
  };

  // Default Values 관련 헬퍼 함수들
  const calculateTotal = () => {
    if (config.type === 'load_factor') {
      return defaultValues.load_factor || 0;
    }
    return Object.values(defaultValues).reduce((sum, val) => sum + val, 0);
  };

  const handleAutoEqual = () => {
    if (definedProperties.length === 0) return;

    const equalValue = config.type === 'load_factor' ? 0.5 : 1 / definedProperties.length; // UI 편의상 50%로 시작
    const newDefaults: Record<string, number> = {};

    if (config.type === 'load_factor') {
      newDefaults.load_factor = equalValue;
    } else {
      definedProperties.forEach((prop) => {
        newDefaults[prop] = equalValue;
      });
    }

    setDefaultValues(newDefaults);
  };

  const handleDefaultValueChange = (property: string, value: number) => {
    setDefaultValues((prev) => ({ ...prev, [property]: value }));
  };

  const handleSaveDefaults = () => {
    if (!defineDefault) {
      // Skip default values - 빈 객체로 설정
      if (config.type === 'nationality') {
        setNationalityDefault({});
      } else if (config.type === 'profile') {
        setProfileDefault({});
      } else if (config.type === 'load_factor') {
        setPaxGenerationDefault(null); // 하드코딩 제거, 빈값으로 설정
      }
    } else {
      // Save default values
      if (config.type === 'nationality') {
        setNationalityDefault(defaultValues);
      } else if (config.type === 'profile') {
        setProfileDefault(defaultValues);
      } else if (config.type === 'load_factor') {
        setPaxGenerationDefault(defaultValues.load_factor || null);
      }
    }

    console.log('✅ Default values saved:', {
      configType: config.type,
      defineDefault,
      defaultValues: defineDefault ? defaultValues : {},
    });
  };

  // Rule 관리 헬퍼 함수들
  const getCurrentRules = () => {
    if (config.type === 'nationality') {
      return passengerData.pax_demographics.nationality.rules || [];
    } else if (config.type === 'profile') {
      return passengerData.pax_demographics.profile.rules || [];
    } else if (config.type === 'load_factor') {
      return passengerData.pax_generation.rules || [];
    } else if (config.type === 'pax_arrival_patterns') {
      return passengerData.pax_arrival_patterns.rules || [];
    }
    return [];
  };

  const handleDeleteRule = (index: number) => {
    if (config.type === 'nationality') {
      removeNationalityRule(index);
    } else if (config.type === 'profile') {
      removeProfileRule(index);
    } else if (config.type === 'load_factor') {
      removePaxGenerationRule(index);
    }
  };

  const handleEditRule = (index: number) => {
    setEditingRuleIndex(index);
    setIsRuleDialogOpen(true);
  };

  const handleAddRule = () => {
    setEditingRuleIndex(null);
    setIsRuleDialogOpen(true);
  };

  // Rule 요약 텍스트 생성
  const getRuleSummary = (rule: any) => {
    const conditions = Object.entries(rule.conditions || {})
      .map(([key, values]: [string, any]) => `${key}: ${Array.isArray(values) ? values.join(', ') : values}`)
      .join(' | ');

    let values = '';
    if (config.type === 'load_factor') {
      values = `Load Factor: ${((rule.value?.load_factor || 0) * 100).toFixed(1)}%`;
    } else if (config.type === 'pax_arrival_patterns') {
      values = `Mean: ${rule.value?.mean || 0}min, Std: ${rule.value?.std || 0}min`;
    } else {
      // nationality, profile
      const valueEntries = Object.entries(rule.value || {})
        .map(([key, value]: [string, any]) => `${key}: ${((value || 0) * 100).toFixed(1)}%`)
        .join(', ');
      values = valueEntries;
    }

    return { conditions, values };
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Property Definition */}
      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h3 className="text-lg font-semibold text-default-900">{config.labels.step1Title}</h3>
          <p className="text-sm text-default-500">Define what properties can be assigned</p>
        </div>

        <div className="space-y-4 pl-6">
          {/* Add Property Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter property name..."
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddProperty();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddProperty}
              disabled={!newPropertyName.trim() || definedProperties.includes(newPropertyName.trim())}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Property
            </Button>
          </div>

          {/* Defined Properties as Badges */}
          <div className="flex flex-wrap gap-2">
            {definedProperties.map((property) => (
              <span
                key={property}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
              >
                {property}
                <button
                  onClick={() => handleRemoveProperty(property)}
                  className="ml-2 rounded-full hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          {definedProperties.length === 0 && (
            <div className="py-8 text-center text-default-500">Enter property name and click "Add Property"</div>
          )}

          {/* Default Values 설정 (Properties가 정의된 후에만 표시) */}
          {definedProperties.length > 0 &&
            (config.type === 'nationality' || config.type === 'profile' || config.type === 'load_factor') && (
              <Card className="border-2 border-dashed border-primary/20">
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Default Values 체크박스 */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="define-default"
                        checked={defineDefault}
                        onCheckedChange={(checked) => setDefineDefault(checked as boolean)}
                      />
                      <label htmlFor="define-default" className="text-sm font-medium">
                        Set Default Values (Optional)
                      </label>
                    </div>

                    {/* 설명 텍스트 */}
                    <p className="text-xs text-default-500">
                      {defineDefault
                        ? 'These values will be used when no specific rules match'
                        : 'Skip default values (empty default will be used)'}
                    </p>

                    {/* Default Values 입력 섹션 */}
                    {defineDefault && (
                      <div className="bg-default-50 space-y-4 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Default Distribution</h4>
                          <Button size="sm" variant="outline" onClick={handleAutoEqual}>
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Auto Equal
                          </Button>
                        </div>

                        {/* Load Factor 전용 UI */}
                        {config.type === 'load_factor' && (
                          <div className="space-y-2">
                            <label className="text-default-600 text-xs">Load Factor</label>
                            <div className="flex items-center space-x-3">
                              <Slider
                                value={[defaultValues.load_factor || 0]}
                                onValueChange={([val]) => handleDefaultValueChange('load_factor', val)}
                                max={1}
                                min={0}
                                step={0.01}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={defaultValues.load_factor || 0}
                                onChange={(e) =>
                                  handleDefaultValueChange('load_factor', parseFloat(e.target.value) || 0)
                                }
                                className="w-20"
                                min="0"
                                max="1"
                                step="0.01"
                              />
                              <span className="w-12 text-xs text-default-500">
                                {((defaultValues.load_factor || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Nationality/Profile 전용 UI */}
                        {(config.type === 'nationality' || config.type === 'profile') && (
                          <div className="space-y-3">
                            {definedProperties.map((property) => {
                              const value = defaultValues[property] || 0;
                              return (
                                <div key={property} className="space-y-2">
                                  <label className="text-default-600 text-xs capitalize">{property}</label>
                                  <div className="flex items-center space-x-3">
                                    <Slider
                                      value={[value]}
                                      onValueChange={([val]) => handleDefaultValueChange(property, val)}
                                      max={1}
                                      min={0}
                                      step={0.01}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      value={value}
                                      onChange={(e) =>
                                        handleDefaultValueChange(property, parseFloat(e.target.value) || 0)
                                      }
                                      className="w-16"
                                      min="0"
                                      max="1"
                                      step="0.01"
                                    />
                                    <span className="w-12 text-xs text-default-500">{(value * 100).toFixed(1)}%</span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Total 표시 */}
                            <div className="border-t pt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-default-600">Total:</span>
                                <span
                                  className={`font-medium ${Math.abs(calculateTotal() - 1.0) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}
                                >
                                  {(calculateTotal() * 100).toFixed(1)}%
                                  {Math.abs(calculateTotal() - 1.0) >= 0.01 && ' (should equal 100%)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Save Default Values 버튼 */}
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            onClick={handleSaveDefaults}
                            disabled={
                              (config.type === 'nationality' || config.type === 'profile') &&
                              Math.abs(calculateTotal() - 1.0) >= 0.01
                            }
                          >
                            Save Default Values
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Skip 안내 */}
                    {!defineDefault && (
                      <div className="rounded bg-blue-50 p-3 text-xs text-blue-800">
                        💡 Default values will be empty (default: {'{}'}) - only specific rules will apply
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* Step 2: Search Criteria */}
      <div className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-default-900">Search Criteria</h3>
              <p className="text-sm text-default-500">Select flight conditions and assign values</p>
            </div>
            <Button onClick={handleAddRule} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Rules
            </Button>
          </div>
        </div>

        <div className="space-y-3 pl-6">
          {getCurrentRules().length === 0 ? (
            <div className="py-8 text-center text-default-500">
              <p>No rules created yet.</p>
              <p className="text-sm">Click "Add Rules" to create your first rule.</p>
            </div>
          ) : (
            getCurrentRules().map((rule, index) => {
              const { conditions, values } = getRuleSummary(rule);
              return (
                <Card key={index} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            Rule {index + 1}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-default-600">Conditions: </span>
                            <span className="font-medium">{conditions || 'All flights'}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-default-600">Values: </span>
                            <span className="font-medium">{values}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEditRule(index)} className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRule(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Rule Creation/Edit Dialog */}
        <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRuleIndex !== null ? `Edit Rule ${editingRuleIndex + 1}` : 'Create New Rule'}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              <PassengerProfileCriteria
                parquetMetadata={parquetMetadata}
                definedProperties={definedProperties}
                configType={config.type}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
