import { TooltipData } from './tooltip';

export interface ConditionData {
  logicItems: DropdownItem[];
  criteriaItems: DropdownItem[];
  operatorItems: { [criteriaId: string]: OperatorItem[] };
  valueItems: { [criteriaId: string]: DropdownItem[] };
}

export interface DropdownItem {
  id: string;
  text: string;
  fullText?: string;
  tooltip?: TooltipData;
}

export interface OperatorItem extends DropdownItem {
  multiSelect: boolean;
}

export interface ConditionParams {
  name: string;
  operator: string[];
  value: string[];
}

export interface Condition {
  logic: string;
  criteria: string;
  operator: string;
  value: string[];
}

// 새로운 간소화된 조건 타입 (백엔드 API 변경에 따름)
export interface SimplifiedCondition {
  criteria: string;
  value: string[];
}

export interface ConditionState {
  index?: number;
  conditions: Condition[];
  mean?: number;
  standard_deviation?: number;
}
