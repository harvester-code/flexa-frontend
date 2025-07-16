'use client';

import React, { RefObject, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Filter, FilterOptions, Option } from '@/types/scenarios';
import Button from '@/components/Button';
import Tooltip from '@/components/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useResize } from '@/hooks/useResize';

interface DropdownProps {
  defaultId?: string | Array<string>;
  items: Option[];
  multiSelect?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  onChange?: (item: Option[]) => void;
}

// TODO: 컴포넌트 이름 변경 & 분리 필요
export function Dropdown({
  multiSelect = false,
  disabled = false,
  defaultId,
  items,
  label,
  className = '',
  onChange,
}: DropdownProps) {
  const refDropdown: RefObject<HTMLDivElement | null> = useRef(null);

  const [initialized, setInitialized] = useState(false);
  const [selItems, setSelItems] = useState<Array<Option>>([]);

  const { width } = useResize(refDropdown);

  const [openDropdownMenu, setOpenDropdownMenu] = useState(false);

  useEffect(() => {
    if (items) {
      // `defaultId`가 제공된 경우, 이를 기반으로 선택된 항목 초기화
      if (defaultId) {
        const tempItems: { [key: string]: boolean } = {};

        // 다중 선택 모드 처리
        if (multiSelect && Array.isArray(defaultId) && defaultId?.length > 0) {
          // `defaultId`가 배열인 경우, 각 ID를 선택된 상태로 표시
          for (const idCur of defaultId) tempItems[idCur] = true;
        }
        // 단일 선택 모드 처리
        else if (!multiSelect && defaultId?.length > 0) {
          // `defaultId`가 배열인 경우, 첫 번째 ID를 선택
          if (Array.isArray(defaultId)) {
            tempItems[defaultId[0]] = true;
          }
          // `defaultId`가 문자열인 경우, 해당 ID를 직접 선택
          else {
            tempItems[defaultId] = true;
          }
        }

        // `items` 배열에서 선택된 항목만 필터링
        setSelItems(items.filter((item) => item.id in tempItems));
      }
      // `defaultId`가 제공되지 않은 경우, 기본적으로 첫 번째 항목 선택
      else {
        setSelItems([items[0]]);
        // `onChange` 콜백을 기본 선택 항목으로 트리거
        if (onChange) onChange([items[0]]);
      }

      // 드롭다운 초기화 완료 표시
      setInitialized(true);
    }
  }, [items]); // `items` 배열이 변경될 때마다 이 효과 재실행

  useEffect(() => {
    // 드롭다운이 초기화된 상태에서만 실행
    if (initialized) {
      // 다중 선택이 비활성화된 경우
      if (!multiSelect) {
        // 선택된 항목이 2개 이상인 경우, 첫 번째 항목만 유지
        if (selItems.length > 1) {
          setSelItems([selItems[0]]);
        }
        // 선택된 항목이 없는 경우, 기본적으로 첫 번째 항목을 선택
        else if (selItems.length < 1) {
          setSelItems([items[0]]);
        }
      }
    }
  }, [multiSelect]); // `multiSelect` 값이 변경될 때마다 이 효과 실행

  return (
    <div className="flex flex-col">
      <DropdownMenu open={openDropdownMenu} onOpenChange={setOpenDropdownMenu}>
        <div
          ref={refDropdown}
          className={`flex cursor-pointer flex-row items-center rounded-full border border-gray-300 bg-white px-[14px] py-[6px] ${className}`}
          onClick={
            disabled || items?.length <= 1
              ? undefined
              : () => {
                  setOpenDropdownMenu(true);
                }
          }
        >
          <div className="flex h-[30px] flex-row items-center">
            {selItems?.length == 1 ? (
              <span className="text-base font-medium text-gray-800">{selItems?.[0]?.text}</span>
            ) : selItems?.length > 1 ? (
              <div className="flex flex-row">
                {selItems?.slice(0, 5).map((itemCurrent, index) => {
                  return index >= 4 ? (
                    <span key={index} className="ml-[10px] text-sm font-medium text-gray-700">
                      {'...'}
                    </span>
                  ) : (
                    <button
                      key={index}
                      className={`z-50 flex flex-row rounded-full border border-gray-200 py-[2px] pl-[10px] pr-[4px] ${index > 0 ? 'ml-[8px]' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelItems = selItems.filter((item) => item.id !== itemCurrent.id);
                        setSelItems(newSelItems);
                        if (onChange) onChange(newSelItems);
                      }}
                    >
                      <span className="text-sm font-medium text-gray-700">{itemCurrent?.text || ' '}</span>
                      <Image width={16} height={16} className="ml-[2px]" src="/image/ico-close-x.svg" alt="" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-[30px]" />
            )}
          </div>

          <div className="flex-1" />

          {items?.length <= 1 ? null : (
            <Image width={20} height={20} className="h-[20px] w-[20px]" src="/image/ico-dropdown.svg" alt="" />
          )}
        </div>

        <DropdownMenuTrigger asChild disabled={disabled}>
          <div></div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="max-h-[400px] cursor-pointer overflow-y-auto bg-white">
          {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}

          {items?.map((itemCurrent: Option, index: number) => {
            const selItemCur = selItems?.find((item) => item.id === itemCurrent.id);

            return (
              <div key={index} className="flex flex-col">
                {index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  className="flex cursor-pointer flex-row px-[14px] py-[10px] pl-[14px]"
                  style={{ width }}
                  onClick={(e) => {
                    if (multiSelect) {
                      e.preventDefault();
                      if (selItemCur) {
                        const newSelItems = selItems.filter((item) => item.id !== itemCurrent.id);
                        setSelItems(newSelItems);
                        if (onChange) onChange(newSelItems);
                      } else {
                        const newSelItems = [...selItems, itemCurrent];
                        setSelItems(newSelItems);
                        if (onChange) onChange(newSelItems);
                      }
                    } else {
                      setSelItems([itemCurrent]);
                      if (onChange) onChange([itemCurrent]);
                    }
                  }}
                >
                  {selItemCur ? (
                    <div className="h-[8px] w-[8px] rounded-full bg-black" />
                  ) : (
                    <div className="h-[8px] w-[8px]" />
                  )}
                  <span className="ml-[10px] text-base font-medium text-gray-800">
                    {itemCurrent.fullText || itemCurrent.text}
                  </span>
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ConditionItemProps extends FilterOptions {
  logicVisible?: boolean;
  deletable?: boolean;
  condition: Filter;
  label?: string;
  onChange?: (payload: { what: keyof Filter; states: Option[] }) => void;
  onDelete?: () => void;
}

function ConditionItem({
  logicVisible = false,
  deletable = true,
  logicItems,
  criteriaItems,
  operatorItems,
  valueItems,
  label,
  condition,
  onChange,
  onDelete,
}: ConditionItemProps) {
  const { criteria, logic, operator, value } = condition;

  return (
    <div className="flex flex-row">
      {/* =============== Logic Items =============== */}
      {logicVisible ? (
        <div className="flex w-[100px] flex-col">
          <div className="flex flex-row">
            <span className="text-sm font-medium text-gray-800">Logic</span>
            <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>

            {/* {selLogicItem?.tooltip?.text ? (
              <Tooltip className="ml-[2px]" title={selLogicItem?.tooltip?.title} text={selLogicItem?.tooltip?.text} />
            ) : null} */}
          </div>

          <Dropdown
            // HACK: Using a random key to force re-render when criteria changes
            key={`dropdown-${Math.random().toString(36).substring(2, 9)}`}
            className="mt-[6px]"
            defaultId={logic}
            items={logicItems}
            onChange={(items) => {
              if (onChange) onChange({ what: 'logic', states: items });
            }}
          />
        </div>
      ) : label ? (
        <div className="mb-[10px] flex w-[100px] flex-col justify-end">
          <span className="text-lg font-medium text-gray-800">{label}</span>
        </div>
      ) : (
        <div className="flex w-[100px] flex-col"></div>
      )}

      {/* =============== Criteria Items =============== */}
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Criteria</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>

          {/* {selCriteriaItem?.tooltip?.text ? (
            <Tooltip className="ml-[2px]" title={selCriteriaItem?.tooltip?.title} text={selCriteriaItem?.tooltip?.text} />
          ) : null} */}
        </div>

        <Dropdown
          // HACK: Using a random key to force re-render when criteria changes
          key={`dropdown-${Math.random().toString(36).substring(2, 9)}`}
          className="mt-[6px] flex-1"
          defaultId={criteria}
          items={criteriaItems}
          onChange={(items) => {
            if (onChange) onChange({ what: 'criteria', states: items });
          }}
        />
      </div>

      {/* =============== Operator Items =============== */}
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Operator</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>

          {/* {selOperatorItem?.tooltip?.text ? (
            <Tooltip className="ml-[2px]" title={selOperatorItem?.tooltip?.title} text={selOperatorItem?.tooltip?.text} />
          ) : null} */}
        </div>

        <Dropdown
          key={criteria}
          defaultId={operator}
          items={operatorItems[criteria]}
          className="mt-[6px] flex-1"
          onChange={(items) => {
            if (onChange) onChange({ what: 'operator', states: items });
          }}
        />
      </div>

      {/* =============== Value Items =============== */}
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Value</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>

          {/* {selValueItem?.tooltip?.text ? (
            <Tooltip className="ml-[2px]" title={selValueItem?.tooltip?.title} text={selValueItem?.tooltip?.text} />
          ) : null} */}
        </div>

        <Dropdown
          key={criteria}
          className="mt-[6px] flex-1"
          defaultId={value}
          // HACK
          // items={[...valueItems[criteria]].sort((a, b) => a.id.localeCompare(b.id, 'en', { sensitivity: 'base' }))}
          items={valueItems[criteria]}
          multiSelect={operatorItems[criteria]?.find((val) => val.id == operator)?.multiSelect === true}
          onChange={(items) => {
            if (onChange) onChange({ what: 'value', states: items });
          }}
        />
      </div>

      {deletable ? (
        <div className="ml-[8px] flex flex-col justify-end pb-[10px]">
          <button
            onClick={() => {
              if (onDelete) onDelete();
            }}
          >
            <Image width={24} height={24} src="/image/ico-close-circle-x.svg" alt="" />
          </button>
        </div>
      ) : (
        <div className="w-[32px]" />
      )}
    </div>
  );
}

interface ConditionsProps extends FilterOptions {
  className?: string;
  addCondition?: boolean;
  logicVisible?: boolean;
  conditions: Filter[];
  labels?: string[];
  onAddCondition?: (filter: Filter) => void;
  onChange?: (payload: { what: keyof Filter; states: Option[]; index?: number }) => void;
  onDelete?: (index: number) => void;
}

export default function Conditions({
  className,
  addCondition = true,
  logicVisible = true,
  conditions,
  labels,
  logicItems,
  criteriaItems,
  operatorItems,
  valueItems,
  onAddCondition,
  onChange,
  onDelete,
}: ConditionsProps) {
  return (
    <div className={`flex flex-col`}>
      <div
        className={`flex flex-col gap-y-5 border-b border-gray-200 bg-gray-100 px-[30px] pb-3.5 pt-[30px] ${className}`}
      >
        {conditions?.map((condition: Filter, index: number) => {
          return (
            <ConditionItem
              key={`condition-item-${index}`}
              condition={condition}
              logicVisible={logicVisible == false ? false : index > 0}
              logicItems={logicItems}
              criteriaItems={criteriaItems}
              operatorItems={operatorItems}
              valueItems={valueItems}
              deletable={addCondition}
              label={labels && index < labels.length ? labels[index] : ''}
              onChange={({ states, what }) => {
                if (onChange) onChange({ what, states, index });
              }}
              onDelete={() => {
                if (onDelete) onDelete(index);
              }}
            />
          );
        })}

        {addCondition ? (
          <div className="flex flex-row items-center justify-center">
            <button
              className="px-[30px] py-[5px]"
              onClick={() => {
                if (!onAddCondition) return;

                const initLogic = logicItems?.[0]?.id || '';
                const initCriteria = criteriaItems?.[0]?.id || '';
                const initOperator = operatorItems?.[initCriteria]?.[0]?.id || '';
                const initValue = valueItems?.[initCriteria]?.[0]?.id || '';

                const defaultFilter: Filter = {
                  logic: initLogic,
                  criteria: initCriteria,
                  operator: initOperator,
                  value: [initValue],
                };

                onAddCondition(defaultFilter);
              }}
            >
              <span className="text-lg font-medium text-purple-600">+ Add Filter</span>
            </button>
          </div>
        ) : (
          <div className="h-[8px]" />
        )}
      </div>
    </div>
  );
}
