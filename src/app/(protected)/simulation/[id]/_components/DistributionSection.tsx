import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, Plus, Save, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import InteractivePercentageBar from './InteractivePercentageBar';

// Color palette identical to InteractivePercentageBar (excluding primary color)
const COLORS = [
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F97316', // Orange
  '#84CC16', // Lime
];

interface TabConfig {
  type: 'nationality' | 'profile';
  defaultValues: Record<string, any>;
  labels: {
    step1Title: string;
  };
}

interface DistributionSectionProps {
  config: TabConfig;
  currentValues: string[];
  newPropertyName: string;
  setNewPropertyName: (value: string) => void;
  useDefaultValues: boolean;
  setUseDefaultValues: (value: boolean) => void;
  percentageValues: Record<string, number>;
  isValid: boolean;
  setIsValid: (valid: boolean) => void;
  totalPercentage: number;
  setTotalPercentage: (total: number) => void;
  editingPropertyIndex: number | null;
  editingPropertyValue: string;
  setEditingPropertyValue: (value: string) => void;
  editingInputRef: React.RefObject<HTMLInputElement | null>;
  onAddProperty: () => void;
  onRemoveProperty: (value: string) => void;
  onStartEditing: (index: number, value: string) => void;
  onPropertyNameChange: () => void;
  onEditingKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPercentageChange: (values: Record<string, number>) => void;
  onSave: () => void;
}

export const DistributionSection: React.FC<DistributionSectionProps> = ({
  config,
  currentValues,
  newPropertyName,
  setNewPropertyName,
  useDefaultValues,
  setUseDefaultValues,
  percentageValues,
  isValid,
  setIsValid,
  totalPercentage,
  setTotalPercentage,
  editingPropertyIndex,
  editingPropertyValue,
  setEditingPropertyValue,
  editingInputRef,
  onAddProperty,
  onRemoveProperty,
  onStartEditing,
  onPropertyNameChange,
  onEditingKeyPress,
  onKeyPress,
  onPercentageChange,
  onSave,
}) => {
  return (
    <div className="space-y-4">
      <div className="border-l-4 border-primary pl-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-default-900">{config.labels.step1Title}</h3>
            <p className="text-sm text-default-500">Define what properties can be assigned</p>
          </div>
          {/* Save Button moved from bottom */}
          {currentValues.length > 0 && (
            <Button
              onClick={onSave}
              disabled={currentValues.length === 0 || (useDefaultValues && !isValid)}
              className="px-8"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4 pl-6">
        {/* Property Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter property name (e.g., domestic, international or a,b,c)..."
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            onKeyPress={onKeyPress}
            className="flex-1"
          />
          <Button size="sm" onClick={onAddProperty} disabled={!newPropertyName.trim()} className="px-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        {/* Property Tags + Switch */}
        {currentValues.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {currentValues.map((value, index) => {
                const color = COLORS[index % COLORS.length];
                const isEditing = editingPropertyIndex === index;

                return (
                  <div
                    key={`${value}_${index}`}
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white transition-all"
                    style={{ backgroundColor: color }}
                  >
                    {isEditing ? (
                      <input
                        ref={editingInputRef}
                        type="text"
                        value={editingPropertyValue}
                        onChange={(e) => setEditingPropertyValue(e.target.value)}
                        onBlur={onPropertyNameChange}
                        onKeyPress={onEditingKeyPress}
                        className="w-20 bg-transparent text-center text-white placeholder-white/70 outline-none"
                        style={{ minWidth: `${editingPropertyValue.length + 1}ch` }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer select-none"
                        onDoubleClick={() => onStartEditing(index, value)}
                        title="Double-click to edit name"
                      >
                        {value}
                      </span>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => onRemoveProperty(value)}
                        className="ml-2 rounded-full p-0.5 hover:bg-white/20 focus:outline-none"
                        title="Remove property"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-default-600 text-sm">Default</span>
              <div
                className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  useDefaultValues ? 'bg-primary' : 'bg-gray-200'
                }`}
                onClick={() => setUseDefaultValues(!useDefaultValues)}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                    useDefaultValues ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Percentage Bar - shows when there are properties */}
        {currentValues.length > 0 && (
          <div className="space-y-4">
            {/* Interactive Percentage Bar */}
            <InteractivePercentageBar
              properties={currentValues}
              values={useDefaultValues ? percentageValues : {}} // OFF일 때는 빈 객체 전달
              onChange={onPercentageChange}
              onValidationChange={setIsValid}
              onTotalChange={setTotalPercentage}
              configType={config.type}
              showValues={useDefaultValues} // 새로운 prop 추가 예정
            />

            {/* Status */}
            <div className="flex items-center gap-4">
              {useDefaultValues ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Apply to All Flights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${isValid ? 'text-green-700' : 'text-red-700'}`}>
                      Total: {Math.round(totalPercentage)}%
                    </span>
                  </div>
                  {!isValid && <div className="text-sm font-medium text-red-500">⚠️ Total must equal 100%</div>}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Apply to Selected Flights Only</span>
                </div>
              )}
            </div>
          </div>
        )}

        {currentValues.length === 0 && (
          <div className="py-8 text-center text-default-500">Enter property name and click "Add Property"</div>
        )}
      </div>
    </div>
  );
};
