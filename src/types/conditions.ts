interface IConditionData {
  logicItems: IDropdownItem[];
  criteriaItems: IDropdownItem[];
  operatorItems: { [criteriaId: string]: IOperatorItem[] };
  valueItems: { [criteriaId: string]: IDropdownItem[] };
}

interface IDropdownItem {
  id: string;
  text: string;
}

interface IOperatorItem extends IDropdownItem {
  multiSelect: boolean;
}

interface IConditionParams {
  name: string;
  operator: string[];
  value: string[];
}

interface IConditionState {
  criteria: string;
  operator: string;
  value: string[];
  logic?: string;
  logicVisible?: boolean;
}

export type { IConditionData, IConditionParams, IConditionState, IDropdownItem, IOperatorItem };
