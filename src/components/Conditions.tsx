'use client';

import React, { RefObject, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ConditionData, ConditionState, DropdownItem } from '@/types/conditions';
import Button from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useResize } from '@/hooks/useResize';
import Tooltip from './Tooltip';

interface DropdownProps {
  defaultId?: string | Array<string>;
  items: DropdownItem[];
  onChange?: (item: DropdownItem[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

interface ConditionItemProps extends ConditionData {
  condition: ConditionState;

  label?: string;

  logicVisible?: boolean;
  deletable?: boolean;

  onDelete?: () => void;
  onChange?: (states: ConditionState) => void;
}

interface ConditionsProps extends ConditionData {
  className?: string;
  initialValue?: ConditionState[];

  addCondition?: boolean;
  logicVisible?: boolean;

  labels?: string[];

  onChange?: (conditions: ConditionState[]) => void;
  onBtnApply?: (conditions: ConditionState[]) => void;
}

export function Dropdown({
  className = '',
  defaultId,
  items,
  onChange,
  multiSelect = false,
  disabled = false,
  label,
}: DropdownProps) {
  const refDropdown: RefObject<HTMLDivElement | null> = useRef(null);

  const [initialized, setInitialized] = useState(false);
  const [selItems, setSelItems] = useState<Array<DropdownItem>>([]);

  const { width } = useResize(refDropdown);

  const [openDropdownMenu, setOpenDropdownMenu] = useState(false);

  useEffect(() => {
    if (items) {
      if (defaultId) {
        const selItems: { [key: string]: boolean } = {};
        if (multiSelect && Array.isArray(defaultId) && defaultId?.length > 0) {
          for (const idCur of defaultId) selItems[idCur] = true;
        } else if (!multiSelect && defaultId?.length > 0) {
          if (Array.isArray(defaultId)) {
            selItems[defaultId[0]] = true;
          } else {
            selItems[defaultId] = true;
          }
        }
        setSelItems(items.filter((item) => item.id in selItems));
      } else {
        setSelItems([items[0]]);
        if (onChange) onChange([items[0]]);
      }
      setInitialized(true);
    }
  }, [items]);

  useEffect(() => {
    if (initialized) {
      if (!multiSelect && selItems.length > 1) {
        setSelItems([selItems[0]]);
      } else if (!multiSelect && selItems.length < 1) {
        setSelItems([items[0]]);
      }
    }
  }, [multiSelect]);

  return (
    <div className="flex flex-col">
      <DropdownMenu open={openDropdownMenu} onOpenChange={setOpenDropdownMenu}>
        <div
          ref={refDropdown}
          className={`flex cursor-pointer flex-row items-center rounded-full border border-gray-300 bg-white px-[14px] py-[6px] ${className}`}
          onClick={
            disabled || items.length <= 1
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
          {items.length <= 1 ? null : (
            <Image width={20} height={20} className="h-[20px] w-[20px]" src="/image/ico-dropdown.svg" alt="" />
          )}
        </div>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <div />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-[400px] cursor-pointer overflow-y-auto bg-white">
          {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
          {items?.map((itemCurrent: DropdownItem, index: number) => {
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
                  <span className="ml-[10px] text-base font-medium text-gray-800">{itemCurrent.text}</span>
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ConditionItem({
  condition,
  label,
  logicVisible = false,
  deletable = true,
  onDelete,
  onChange,
  logicItems,
  criteriaItems,
  operatorItems,
  valueItems,
}: ConditionItemProps) {
  const [logic, setLogic] = useState<string>(condition?.logic || logicItems?.[0]?.id);
  const [criteria, setCriteria] = useState<string>(condition?.criteria || criteriaItems?.[0]?.id);
  const [operator, setOperator] = useState<string>(condition?.operator || operatorItems?.[criteria]?.[0]?.id);
  const [value, setValue] = useState<string[]>(condition?.value || ['']);
  useEffect(() => {
    if (onChange)
      onChange({
        logic,
        criteria,
        operator,
        value,
      });
  }, [logic, criteria, operator, value]);
  const selLogicItem = logicItems?.find((val) => val?.id == logic);
  const selCriteriaItem = criteriaItems?.find((val) => val?.id == criteria);
  const selOperatorItem = operatorItems?.[criteria]?.find((val) => val?.id == operator);
  const selValueItem = valueItems?.[criteria]?.find((val) => val?.[0]?.id == value);
  return (
    <div className="flex flex-row">
      {logicVisible ? (
        <div className="flex w-[100px] flex-col">
          <div className="flex flex-row">
            <span className="text-sm font-medium text-gray-800">Logic</span>
            <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>
            {selLogicItem?.tooltip?.text ? (
              <Tooltip
                className="ml-[2px]"
                title={selLogicItem?.tooltip?.title}
                text={selLogicItem?.tooltip?.text}
              />
            ) : null}
          </div>
          <Dropdown
            defaultId={logic}
            items={logicItems}
            className="mt-[6px]"
            onChange={(items) => setLogic(items[0].id)}
          />
        </div>
      ) : label ? (
        <div className="mb-[10px] flex w-[100px] flex-col justify-end">
          <span className="text-lg font-medium text-gray-800">{label}</span>
        </div>
      ) : (
        <div className="flex w-[100px] flex-col"></div>
      )}
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Criteria</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>
          {selCriteriaItem?.tooltip?.text ? (
            <Tooltip
              className="ml-[2px]"
              title={selCriteriaItem?.tooltip?.title}
              text={selCriteriaItem?.tooltip?.text}
            />
          ) : null}
        </div>
        <Dropdown
          defaultId={criteria}
          items={criteriaItems}
          className="mt-[6px] flex-1"
          onChange={(items) => {
            const criteriaId = items[0].id;
            if (criteria != criteriaId) {
              setCriteria(criteriaId);
              setOperator(operatorItems[criteriaId][0].id);
              setValue(
                operatorItems[criteriaId][0].multiSelect === false ? [valueItems[criteriaId][0].id] : []
              );
            }
          }}
        />
      </div>
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Operator</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>
          {selOperatorItem?.tooltip?.text ? (
            <Tooltip
              className="ml-[2px]"
              title={selOperatorItem?.tooltip?.title}
              text={selOperatorItem?.tooltip?.text}
            />
          ) : null}
        </div>
        <Dropdown
          key={criteria}
          defaultId={operator}
          items={operatorItems[criteria]}
          className="mt-[6px] flex-1"
          onChange={(items) => setOperator(items[0].id)}
        />
      </div>
      <div className="ml-[20px] flex flex-1 flex-col">
        <div className="flex flex-row">
          <span className="text-sm font-medium text-gray-800">Value</span>
          <span className="ml-[2px] text-sm font-medium text-purple-600">*</span>
          {selValueItem?.tooltip?.text ? (
            <Tooltip
              className="ml-[2px]"
              title={selValueItem?.tooltip?.title}
              text={selValueItem?.tooltip?.text}
            />
          ) : null}
        </div>
        <Dropdown
          key={criteria}
          defaultId={value}
          items={valueItems[criteria]}
          className="mt-[6px] flex-1"
          multiSelect={operatorItems[criteria]?.find((val) => val.id == operator)?.multiSelect === true}
          onChange={(items) => setValue(items.map((val) => val?.id))}
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

export default function Conditions({
  className = '',

  initialValue,

  addCondition = true,

  logicVisible = true,

  labels,

  onChange,
  onBtnApply,

  logicItems,
  criteriaItems,
  operatorItems,
  valueItems,
}: ConditionsProps) {
  const defaultCriteriaId = criteriaItems[0]?.id;
  const defaultConditionItem = {
    logic: logicItems[0].id,
    criteria: defaultCriteriaId,
    operator: operatorItems[defaultCriteriaId][0].id,
    value: [valueItems[defaultCriteriaId][0].id],
  };
  const [conditionsTime, setConditionsTime] = useState(Date.now());
  const [conditions, setConditions] = useState<ConditionState[] | undefined>(initialValue);
  useEffect(() => {
    if (!conditions) {
      const newConditions = [defaultConditionItem];
      setConditions(newConditions);
      if (onChange) onChange(newConditions);
    }
  }, []);
  return (
    <div className={`flex flex-col`}>
      <div
        className={`flex flex-col gap-y-[20px] border-b border-gray-200 bg-gray-100 px-[30px] pb-[14px] pt-[30px] ${className}`}
      >
        {conditions?.map((item: ConditionState, index: number) => (
          <ConditionItem
            key={`${conditionsTime}_${index}`}
            condition={item}
            logicVisible={logicVisible == false ? false : index > 0}
            logicItems={logicItems}
            criteriaItems={criteriaItems}
            operatorItems={operatorItems}
            valueItems={valueItems}
            deletable={addCondition}
            label={labels && index < labels.length ? labels[index] : ''}
            onChange={(state) => {
              const newConditions = conditions.map((val, idx) => (idx == index ? state : val));
              setConditions(newConditions);
              if (onChange) onChange(newConditions);
            }}
            onDelete={() => {
              const newConditions = [...conditions];
              newConditions.splice(index, 1);
              setConditions(newConditions);
              setConditionsTime(Date.now());
              if (onChange) onChange(newConditions);
            }}
          />
        ))}
        {addCondition ? (
          <div className="flex flex-row items-center justify-center">
            <button
              className="px-[30px] py-[5px]"
              onClick={() => {
                const newConditions = [...(conditions || []), defaultConditionItem];
                setConditions(newConditions);
                setConditionsTime(Date.now());
                if (onChange) onChange(newConditions);
              }}
            >
              <span className="text-lg font-medium text-purple-600">+ Add Condition</span>
            </button>
          </div>
        ) : (
          <div className="h-[8px]" />
        )}
      </div>
      {onBtnApply ? (
        <div className="pb=20 flex flex-row justify-end px-[30px] py-[20px]">
          <Button
            className="btn-md btn-primary"
            iconRight={<Image width={20} height={20} src="/image/ico-check.svg" alt="" />}
            text="Apply"
            onClick={() => {
              if (onBtnApply) onBtnApply(conditions || []);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
