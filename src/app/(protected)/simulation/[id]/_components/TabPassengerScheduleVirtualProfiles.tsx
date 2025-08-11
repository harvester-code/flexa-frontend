import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, MoreHorizontal, PersonStanding, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import sampletable from './sampletable.png';

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  values: string[]; // Changed from value to values array
  logicalOperator?: 'AND' | 'OR';
}

export interface FilterGroup {
  id: string;
  logicalOperator: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
  defaultValues?: Record<string, string[]>; // Default values for each field
}

export interface FilterField {
  id: string;
  label: string;
  icon?: string;
  defaultValues?: string[]; // Default values for this field
}

export interface FilterOperator {
  id: string;
  label: string;
}

export interface FilterValue {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

// ===================================================================================
export const filterFields: FilterField[] = [
  {
    id: 'assignee',
    label: 'Engineers',
    icon: '👥',
    defaultValues: ['mary_cassatt'],
  },
  {
    id: 'type',
    label: 'Type',
    icon: '🏷️',
    defaultValues: ['task', 'bug'],
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: '⚡',
    defaultValues: ['p1', 'p2'],
  },
  {
    id: 'status',
    label: 'Status',
    icon: '📊',
    defaultValues: ['not_started', 'in_progress'],
  },
  {
    id: 'project',
    label: 'Project',
    icon: '📁',
    defaultValues: [],
  },
  {
    id: 'due_date',
    label: 'Due Date',
    icon: '📅',
    defaultValues: [],
  },
];

export const filterOperators: FilterOperator[] = [
  { id: 'is', label: 'Is' },
  { id: 'is_not', label: 'Is not' },
  { id: 'contains', label: 'Contains' },
  { id: 'does_not_contain', label: 'Does not contain' },
  { id: 'starts_with', label: 'Starts with' },
  { id: 'ends_with', label: 'Ends with' },
  { id: 'in', label: 'In' },
  { id: 'not_in', label: 'Not in' },
];

export const filterValues: Record<string, FilterValue[]> = {
  assignee: [
    { id: 'mary_cassatt', label: 'Mary Cassatt', icon: '👤' },
    { id: 'john_doe', label: 'John Doe', icon: '👤' },
    { id: 'jane_smith', label: 'Jane Smith', icon: '👤' },
    { id: 'bob_wilson', label: 'Bob Wilson', icon: '👤' },
    { id: 'alice_brown', label: 'Alice Brown', icon: '👤' },
  ],
  type: [
    { id: 'task', label: 'Task', color: '#FFC107', icon: '📝' },
    { id: 'bug', label: 'Bug', color: '#F44336', icon: '🐛' },
    { id: 'feature', label: 'Feature', color: '#4CAF50', icon: '✨' },
    { id: 'epic', label: 'Epic', color: '#9C27B0', icon: '🎯' },
    { id: 'story', label: 'Story', color: '#2196F3', icon: '📖' },
  ],
  priority: [
    { id: 'p1', label: 'P1', color: '#F44336', icon: '🔥' },
    { id: 'p2', label: 'P2', color: '#FF9800', icon: '⚡' },
    { id: 'p3', label: 'P3', color: '#FFC107', icon: '📌' },
    { id: 'p4', label: 'P4', color: '#4CAF50', icon: '📋' },
  ],
  status: [
    { id: 'not_started', label: 'Not Started', color: '#9E9E9E' },
    { id: 'in_progress', label: 'In Progress', color: '#2196F3' },
    { id: 'completed', label: 'Completed', color: '#4CAF50' },
    { id: 'blocked', label: 'Blocked', color: '#F44336' },
    { id: 'on_hold', label: 'On Hold', color: '#FF9800' },
  ],
  project: [
    { id: 'website_redesign', label: 'Website Redesign', color: '#2196F3' },
    { id: 'mobile_app', label: 'Mobile App', color: '#4CAF50' },
    { id: 'api_integration', label: 'API Integration', color: '#FF9800' },
  ],
};
// ===================================================================================

interface Option {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

interface DropdownSelectProps {
  options: Option[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DropdownSelect({
  options,
  value,
  placeholder = 'Select...',
  onChange,
  className = '',
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-left transition-all duration-150 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedOption?.icon && <span className="flex-shrink-0 text-sm">{selectedOption.icon}</span>}
          <span className="truncate text-sm">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
            >
              {option.icon && <span className="flex-shrink-0 text-sm">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================================================================
interface FilterValueChipProps {
  value: FilterValue;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function FilterValueChip({ value, selected, onClick, onRemove }: FilterValueChipProps) {
  return (
    <div
      className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-all duration-150 hover:shadow-sm ${selected ? 'ring-1 ring-blue-300' : 'hover:shadow-sm'} `}
      style={{
        backgroundColor: value.color || '#E3F2FD',
        color: value.color ? '#fff' : '#1976D2',
      }}
      onClick={onClick}
    >
      {value.icon && <span className="text-xs">{value.icon}</span>}
      <span>{value.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ===================================================================================

interface FilterConditionProps {
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
  showLogicalOperator?: boolean;
  logicalOperator?: 'AND' | 'OR';
  onLogicalOperatorChange?: (operator: 'AND' | 'OR') => void;
  level?: number;
}

export function FilterConditionComponent({
  condition,
  onChange,
  onRemove,
  showLogicalOperator = false,
  logicalOperator = 'AND',
  onLogicalOperatorChange,
  level = 0,
}: FilterConditionProps) {
  const selectedField = filterFields.find((f) => f.id === condition.field);
  const availableValues = condition.field ? filterValues[condition.field] || [] : [];

  const handleFieldChange = (fieldId: string) => {
    const field = filterFields.find((f) => f.id === fieldId);
    onChange({
      ...condition,
      field: fieldId,
      values: field?.defaultValues || [], // Use default values when field changes
    });
  };

  const handleOperatorChange = (operatorId: string) => {
    onChange({
      ...condition,
      operator: operatorId,
    });
  };

  return (
    <div className="flex items-center gap-4 py-3">
      {/* Logical Operator */}
      {showLogicalOperator && (
        <div className="flex w-16 items-center justify-center">
          <button
            type="button"
            className="min-w-[48px] rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => onLogicalOperatorChange?.(logicalOperator === 'AND' ? 'OR' : 'AND')}
          >
            {logicalOperator}
          </button>
        </div>
      )}

      {/* Spacer for alignment when no logical operator */}
      {!showLogicalOperator && <div className="w-16" />}

      {/* Filter Components Container */}
      <div className="flex flex-1 items-center gap-4">
        {/* Where Label */}
        <div className="flex w-16 items-center text-sm font-medium text-gray-600">Where</div>

        {/* Field Dropdown */}
        <div className="min-w-[140px] flex-1">
          <DropdownSelect
            options={filterFields}
            value={condition.field}
            placeholder="Select field"
            onChange={handleFieldChange}
          />
        </div>

        {/* Operator Dropdown */}
        <div className="min-w-[120px] flex-1">
          <DropdownSelect
            options={filterOperators}
            value={condition.operator}
            placeholder="Select operator"
            onChange={handleOperatorChange}
          />
        </div>

        {/* Value Display */}
        <div className="min-w-[200px] flex-1">
          <div className="flex min-h-[40px] flex-wrap items-center gap-1 rounded border border-gray-200 bg-gray-50 p-2">
            {condition.values.length > 0 ? (
              condition.values.map((valueId, index) => {
                const value = availableValues.find((v) => v.id === valueId) || { id: valueId, label: valueId };
                return <FilterValueChip key={`${valueId}-${index}`} value={value} selected />;
              })
            ) : (
              <span className="text-sm text-gray-400">Values will appear here</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="ml-2 flex items-center gap-1">
        <button
          type="button"
          className="rounded p-2 text-gray-400 transition-colors duration-150 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="hover:text-red-500 focus:text-red-500 rounded p-2 text-gray-400 transition-colors duration-150 focus:outline-none"
          onClick={onRemove}
          aria-label="Remove condition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ===================================================================================

interface Item {
  id: number;
  isActive: boolean;
  label: string;
  description: string;
  icon: string;
}

interface Section {
  id: number;
  category: string | null;
  items: Item[];
}

interface CategoryGroup {
  id: number;
  isActive: boolean;
  category: string | null;
  sections: Section[];
}

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  //   onCreateGroup: (selectedOptions: GroupOption[]) => void;
}

export function AddGroupModal({ isOpen, onClose }: AddGroupModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Section[]>([]);

  const [groupOptions, setGroupOptions] = useState<CategoryGroup[]>([
    {
      id: 0,
      isActive: true,
      category: 'Nationality',
      sections: [
        {
          id: 0,
          category: null,
          items: [
            {
              id: 0,
              isActive: false,
              label: 'Domestic',
              description: 'Local/domestic passengers and crew',
              icon: '🏠',
            },
            {
              id: 1,
              isActive: false,
              label: 'International',
              description: 'International passengers and crew',
              icon: '🌍',
            },
          ],
        },
      ],
    },
    {
      id: 1,
      isActive: true,
      category: 'Profiles',
      sections: [
        {
          id: 0,
          category: 'Job',
          items: [
            {
              id: 0,
              isActive: false,
              label: 'Cabin Crew',
              description: 'Flight attendants and cabin staff',
              icon: '👩‍✈️',
            },
            {
              id: 1,
              isActive: false,
              label: 'Pilots',
              description: 'Captains and first officers',
              icon: '👨‍✈️',
            },
            {
              id: 2,
              isActive: false,
              label: 'Ground Crew',
              description: 'Ground handling and maintenance staff',
              icon: '👷',
            },
            {
              id: 3,
              isActive: false,
              label: 'Passengers',
              description: 'Regular passengers',
              icon: '👤',
            },
          ],
        },
        {
          id: 1,
          category: 'Special Requirements',
          items: [
            {
              id: 0,
              isActive: false,
              label: 'PRM',
              description: 'Passengers with Reduced Mobility',
              icon: '♿',
            },
            {
              id: 1,
              isActive: false,
              label: 'VIP',
              description: 'VIP passengers and special guests',
              icon: '⭐',
            },
            {
              id: 2,
              isActive: false,
              label: 'Unaccompanied Minors',
              description: 'Children traveling alone',
              icon: '👶',
            },
            {
              id: 3,
              isActive: false,
              label: 'Medical Cases',
              description: 'Passengers requiring medical assistance',
              icon: '🏥',
            },
          ],
        },
        {
          id: 2,
          category: 'Service Classes',
          items: [
            {
              id: 0,
              isActive: false,
              label: 'Economy',
              description: 'Economy class passengers',
              icon: '💺',
            },
            {
              id: 1,
              isActive: false,
              label: 'Business',
              description: 'Business class passengers',
              icon: '💼',
            },
            {
              id: 2,
              isActive: false,
              label: 'First Class',
              description: 'First class passengers',
              icon: '👑',
            },
          ],
        },
      ],
    },
  ]);

  if (!isOpen) return null;

  //   const categories = Array.from(new Set(groupOptions.map((option) => option.category)));

  //   const filteredOptions = groupOptions.filter(
  //     (option) =>
  //       option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       option.description.toLowerCase().includes(searchTerm.toLowerCase())
  //   );

  //   const filteredOptions = groupOptions.flatMap((group) =>
  //     group.options.filter(
  //       (option) =>
  //         option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //         option.description.toLowerCase().includes(searchTerm.toLowerCase())
  //     )
  //   );

  // HACK: 코드 개선이 필요할 수도 있다.
  const toggleOption = (groupId: number, sectionId: number, itemId: number) => {
    setGroupOptions((prev) => {
      // 먼저 토글된 새로운 상태를 계산
      const toggledGroups = prev.map((group) =>
        group.id !== groupId
          ? { ...group, isActive: false } // 다른 그룹은 비활성화
          : {
              ...group,
              isActive: true, // 현재 그룹은 활성화
              sections: group.sections.map((section) =>
                section.id !== sectionId
                  ? section
                  : {
                      ...section,
                      items: section.items.map((item) =>
                        item.id === itemId ? { ...item, isActive: !item.isActive } : item
                      ),
                    }
              ),
            }
      );

      // 선택된 group 찾기
      const selectedGroup = toggledGroups.find((g) => g.id === groupId);
      const allItemsInactive =
        selectedGroup?.sections.every((section) => section.items.every((item) => !item.isActive)) ?? false;

      // 만약 모두 비활성이라면 모든 group을 다시 isActive: true
      if (allItemsInactive) {
        return toggledGroups.map((group) => ({ ...group, isActive: true }));
      }

      return toggledGroups;
    });
  };

  const handleCreateGroup = () => {
    // if (selectedOptions.length > 0) {
    //   onCreateGroup(selectedOptions);
    //   setSelectedOptions([]);
    //   setSearchTerm('');
    //   onClose();
    // }
  };

  const handleCancel = () => {
    setSelectedOptions([]);
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create New Group</h2>
            <p className="mt-1 text-sm text-gray-600">Select the options you want to include in this group</p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full p-2 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="border-b border-gray-200 px-6 py-4">
          <input
            type="text"
            placeholder="Search options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Selected Options Summary */}
        {/* {selectedOptions.length > 0 && (
          <div className="border-b border-blue-200 bg-blue-50 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-900">Selected ({selectedOptions.length}):</span>
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleOption(option)}
                    className="rounded-full p-0.5 hover:bg-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )} */}

        {/* Options Grid */}
        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {groupOptions.map((group) => (
            <div key={`group-${group.id}`} className="mb-6">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900">{group.category}</h3>

              <Separator className="my-4" />

              <div className="space-y-4">
                {group.sections.map((section) => (
                  <React.Fragment key={`section-${section.id}`}>
                    {section.category && (
                      <h4 className="mb-3 gap-2 text-sm font-semibold text-gray-900">
                        {section.category}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {section.items.length}
                        </span>
                      </h4>
                    )}

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {section.items.map((item) => {
                        return (
                          <div
                            key={`item-${item.id}`}
                            className={cn(
                              'relative cursor-pointer rounded-lg border p-4 transition-all duration-150',
                              !group.isActive && 'pointer-events-none rounded bg-gray-200 p-4 opacity-50',
                              item.isActive
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            )}
                            onClick={() => toggleOption(group.id, section.id, item.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 text-2xl">{item.icon}</div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate text-sm font-medium text-gray-900">{item.label}</h4>

                                  {/* {isSelected && (
                                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )} */}
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="text-sm text-gray-600">
            {selectedOptions.length} option{selectedOptions.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={selectedOptions.length === 0}
              className="rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Group ({selectedOptions.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================================
interface FilterGroupProps {
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onRemove?: () => void;
  level?: number;
}

export function FilterGroupComponent({ group, onChange, onRemove, level = 0 }: FilterGroupProps) {
  const addCondition = () => {
    // Create new condition with default field and its default values
    const defaultField = filterFields[0];
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: defaultField.id,
      operator: 'is',
      values: defaultField.defaultValues || [],
    };

    onChange({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const addGroup = () => {
    const defaultField = filterFields[0];
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      logicalOperator: 'AND',
      conditions: [
        {
          id: `condition-${Date.now()}`,
          field: defaultField.id,
          operator: 'is',
          values: defaultField.defaultValues || [],
        },
      ],
    };

    onChange({
      ...group,
      conditions: [...group.conditions, newGroup],
    });
  };

  const updateCondition = (index: number, updatedItem: FilterCondition | FilterGroup) => {
    const newConditions = [...group.conditions];
    newConditions[index] = updatedItem;
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const removeCondition = (index: number) => {
    const newConditions = group.conditions.filter((_, i) => i !== index);
    onChange({
      ...group,
      conditions: newConditions,
    });
  };

  const updateLogicalOperator = (operator: 'AND' | 'OR') => {
    onChange({
      ...group,
      logicalOperator: operator,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Conditions */}
      <div className="space-y-0">
        {group.conditions.map((item, index) => {
          const isCondition = 'field' in item;
          const showLogicalOperator = index > 0;

          if (isCondition) {
            return (
              <div
                key={item.id}
                className={`border-l-2 border-transparent ${level > 0 ? 'ml-8 border-l-gray-200 pl-4' : ''} `}
              >
                <FilterConditionComponent
                  condition={item as FilterCondition}
                  onChange={(updated) => updateCondition(index, updated)}
                  onRemove={() => removeCondition(index)}
                  showLogicalOperator={showLogicalOperator}
                  logicalOperator={group.logicalOperator}
                  onLogicalOperatorChange={updateLogicalOperator}
                  level={level}
                />
              </div>
            );
          } else {
            return (
              <div key={item.id} className="space-y-0">
                {showLogicalOperator && (
                  <div className={`flex items-center py-2 ${level > 0 ? 'ml-12' : 'ml-4'}`}>
                    <div className="flex w-16 justify-center">
                      <button
                        type="button"
                        className="min-w-[48px] rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => updateLogicalOperator(group.logicalOperator === 'AND' ? 'OR' : 'AND')}
                      >
                        {group.logicalOperator}
                      </button>
                    </div>
                  </div>
                )}
                <div className={`border-l-2 border-gray-200 ${level >= 0 ? 'ml-8 pl-4' : ''}`}>
                  <FilterGroupComponent
                    group={item as FilterGroup}
                    onChange={(updated) => updateCondition(index, updated)}
                    onRemove={() => removeCondition(index)}
                    level={level + 1}
                  />
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Add Filter Buttons */}
      <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-12' : 'ml-4'}`}>
        <button
          type="button"
          className="flex items-center gap-2 self-start rounded px-3 py-2 text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={addCondition}
        >
          <Plus className="h-4 w-4" />
          Add a filter
        </button>
      </div>

      <Image src={sampletable} alt="Description" width={0} height={0} sizes="100vw" />

      <Separator />

      {/* @@@@@@@@@@@@@@@@@@@@@@ */}
      <div>
        <p>Default Value Matrix</p>
        <Image src={sampletable} alt="Description" width={0} height={0} sizes="100vw" />
      </div>
    </div>
  );
}

// ===================================================================================

export default function TabPassengerScheduleVirtualProfiles() {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  const addGroup = () => {
    const newGroup: FilterGroup = {
      id: `group-${Date.now()}`,
      logicalOperator: 'AND',
      conditions: [],
    };
    setFilterGroups([...filterGroups, newGroup]);
  };

  const removeGroup = (index: number) => {
    const newGroups = filterGroups.filter((_, i) => i !== index);
    setFilterGroups(newGroups);
  };

  const handleApplyDefaults = (defaultData: Record<string, Record<string, number | string>>) => {
    console.log('Applying default values:', defaultData);
    // Here you could apply the default values to all  groups
    // or create new groups based on the default matrix
  };

  const handleGroupChange = (index: number, updatedGroup: FilterGroup) => {
    const newGroups = [...filterGroups];
    newGroups[index] = updatedGroup;
    setFilterGroups(newGroups);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <PersonStanding className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">Add Passenger Profiles</div>
            <p className="text-sm font-normal text-gray-600">Select airlines to create a new group</p>
          </div>
        </CardTitle>
      </CardHeader>

      {filterGroups.map((group, index) => (
        <CardContent key={group.id}>
          <div className="rounded border border-gray-200 bg-white">
            {/* Group Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-gray-900">Group {index + 1}</h2>
                <span className="rounded border bg-white px-2 py-1 text-xs text-gray-600">
                  {group.conditions.length} condition{group.conditions.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => {
                    const newGroups = [...filterGroups];
                    newGroups[index].logicalOperator = group.logicalOperator === 'AND' ? 'OR' : 'AND';
                    setFilterGroups(newGroups);
                  }}
                >
                  {group.logicalOperator}
                </button>
                {filterGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGroup(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors duration-150"
                  >
                    Remove Group
                  </button>
                )}
              </div>
            </div>

            {/* Group Content */}
            <div className="p-6">
              <FilterGroupComponent
                group={group}
                onChange={(updatedGroup) => handleGroupChange(index, updatedGroup)}
                level={0}
              />
            </div>
          </div>
        </CardContent>
      ))}

      <CardContent className="flex items-center justify-center">
        <Button onClick={() => setShowAddGroupModal(true)}>
          <Plus />
          Add Group
        </Button>
      </CardContent>

      <AddGroupModal isOpen={showAddGroupModal} onClose={() => setShowAddGroupModal(false)} />
    </Card>
  );
}
