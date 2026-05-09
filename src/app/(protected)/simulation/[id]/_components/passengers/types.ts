export interface PassengerRuleBase {
  id: string;
  name: string;
  conditions: string[];
  flightCount: number;
  originalConditions?: Record<string, string[]>;
  isExpanded?: boolean;
}
