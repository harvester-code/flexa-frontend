'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Plus, Settings, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { Slider } from '@/components/ui/Slider';

interface ValueAssignmentProps {
  configType: 'nationality' | 'profile' | 'load_factor' | 'pax_arrival_patterns';
  definedProperties: string[];
  onSave: (rules: any[], defaultValues: any) => void;
}

interface Rule {
  id: string;
  conditions: Record<string, string[]>;
  values: Record<string, number>;
  name: string;
}

export default function PassengerValueAssignment({ configType, definedProperties, onSave }: ValueAssignmentProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [defaultValues, setDefaultValues] = useState<Record<string, number>>({});
  const [showPreview, setShowPreview] = useState(false);

  // 초기값 설정
  useEffect(() => {
    if (definedProperties.length > 0) {
      const initialDefault: Record<string, number> = {};
      if (configType === 'load_factor') {
        initialDefault['load_factor'] = 0.85;
      } else if (configType === 'pax_arrival_patterns') {
        initialDefault['mean'] = 120;
        initialDefault['std'] = 30;
      } else {
        // nationality, profile의 경우 균등 분배
        const equalShare = 1.0 / definedProperties.length;
        definedProperties.forEach((prop) => {
          initialDefault[prop] = equalShare;
        });
      }
      setDefaultValues(initialDefault);
    }
  }, [definedProperties, configType]);

  const addNewRule = () => {
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      conditions: {},
      values: { ...defaultValues },
      name: `Rule ${rules.length + 1}`,
    };
    setRules([...rules, newRule]);
  };

  const updateRuleValue = (ruleId: string, property: string, value: number) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === ruleId ? { ...rule, values: { ...rule.values, [property]: value } } : rule))
    );
  };

  const updateDefaultValue = (property: string, value: number) => {
    setDefaultValues((prev) => ({ ...prev, [property]: value }));
  };

  const removeRule = (ruleId: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
  };

  const calculateTotal = (values: Record<string, number>) => {
    if (configType === 'load_factor') return values.load_factor || 0;
    if (configType === 'pax_arrival_patterns') return 1; // mean, std는 총합 개념 없음
    return Object.values(values).reduce((sum, val) => sum + val, 0);
  };

  const isValidTotal = (values: Record<string, number>) => {
    if (configType === 'load_factor') {
      const val = values.load_factor || 0;
      return val >= 0 && val <= 1;
    }
    if (configType === 'pax_arrival_patterns') return true;
    const total = calculateTotal(values);
    return Math.abs(total - 1.0) < 0.001; // 오차 허용
  };

  const renderValueInputs = (
    values: Record<string, number>,
    onChange: (prop: string, val: number) => void,
    title: string
  ) => {
    if (configType === 'load_factor') {
      return (
        <div className="space-y-4">
          <h4 className="font-medium">{title}</h4>
          <div className="space-y-2">
            <label className="text-default-600 text-sm">Load Factor</label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[values.load_factor || 0.85]}
                onValueChange={([val]) => onChange('load_factor', val)}
                max={1}
                min={0}
                step={0.01}
                className="flex-1"
              />
              <Input
                type="number"
                value={values.load_factor || 0.85}
                onChange={(e) => onChange('load_factor', parseFloat(e.target.value) || 0)}
                className="w-20"
                min="0"
                max="1"
                step="0.01"
              />
              <span className="text-sm text-default-500">{((values.load_factor || 0.85) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }

    if (configType === 'pax_arrival_patterns') {
      return (
        <div className="space-y-4">
          <h4 className="font-medium">{title}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-default-600 text-sm">Average (minutes)</label>
              <Input
                type="number"
                value={values.mean || 120}
                onChange={(e) => onChange('mean', parseFloat(e.target.value) || 120)}
                placeholder="120"
                min="15"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-default-600 text-sm">Std Dev (minutes)</label>
              <Input
                type="number"
                value={values.std || 30}
                onChange={(e) => onChange('std', parseFloat(e.target.value) || 30)}
                placeholder="30"
                min="5"
                max="60"
              />
            </div>
          </div>
        </div>
      );
    }

    // nationality, profile
    const total = calculateTotal(values);
    const isValid = isValidTotal(values);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{title}</h4>
          <Badge variant={isValid ? 'default' : 'destructive'}>Total: {(total * 100).toFixed(1)}%</Badge>
        </div>

        <div className="space-y-3">
          {definedProperties.map((property) => {
            const value = values[property] || 0;
            return (
              <div key={property} className="space-y-2">
                <label className="text-default-600 text-sm capitalize">{property}</label>
                <div className="flex items-center space-x-4">
                  <Slider
                    value={[value]}
                    onValueChange={([val]) => onChange(property, val)}
                    max={1}
                    min={0}
                    step={0.01}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(property, parseFloat(e.target.value) || 0)}
                    className="w-20"
                    min="0"
                    max="1"
                    step="0.01"
                  />
                  <span className="w-12 text-sm text-default-500">{(value * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {!isValid && <div className="text-sm text-red-500">⚠️ Total must equal 100% for {configType}</div>}
      </div>
    );
  };

  if (definedProperties.length === 0) {
    return (
      <div className="py-8 text-center text-default-500">
        <Settings className="mx-auto mb-4 h-12 w-12 opacity-50" />
        <p>Please define properties in Step 1 first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Default Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏠 Default Values</CardTitle>
          <p className="text-sm text-default-500">Applied when no specific rules match</p>
        </CardHeader>
        <CardContent>{renderValueInputs(defaultValues, updateDefaultValue, 'Default Distribution')}</CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">📋 Conditional Rules</CardTitle>
              <p className="text-sm text-default-500">Apply different values based on flight conditions</p>
            </div>
            <Button onClick={addNewRule} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="py-8 text-center text-default-500">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No conditional rules yet</p>
              <p className="text-sm">Add rules to override default values for specific flights</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <Card key={rule.id} className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-md">{rule.name}</CardTitle>
                      <Button onClick={() => removeRule(rule.id)} variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-default-600 mb-2 block text-sm">Conditions (configured in Step 2)</label>
                        <div className="bg-default-50 rounded p-3 text-sm text-default-500">
                          Configure flight conditions in Step 2: Search Criteria
                        </div>
                      </div>

                      <Separator />

                      {renderValueInputs(
                        rule.values,
                        (prop, val) => updateRuleValue(rule.id, prop, val),
                        'Rule Values'
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => onSave(rules, defaultValues)} className="px-8" disabled={!isValidTotal(defaultValues)}>
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
