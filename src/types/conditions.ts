import { TooltipData } from "./tooltip";

interface ConditionData {
  logicItems: DropdownItem[];
  criteriaItems: DropdownItem[];
  operatorItems: { [criteriaId: string]: OperatorItem[] };
  valueItems: { [criteriaId: string]: DropdownItem[] };
}

interface DropdownItem {
  id: string;
  text: string;
  tooltip?: TooltipData;
}

interface OperatorItem extends DropdownItem {
  multiSelect: boolean;
}

interface ConditionParams {
  name: string;
  operator: string[];
  value: string[];
}

interface ConditionState {
  criteria: string;
  operator: string;
  value: string[];
  logic?: string;
  logicVisible?: boolean;
}

export type { ConditionData, ConditionParams, ConditionState, DropdownItem, OperatorItem };
