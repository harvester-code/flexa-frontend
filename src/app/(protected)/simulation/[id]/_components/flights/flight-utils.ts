/**
 * 터미널-항공사 조합 데이터 처리 유틸리티
 *
 * 프론트엔드 체크박스 UI에서는 "터미널_항공사" 형태로 저장하지만,
 * API 요청 시에는 항공사 코드만 전송하도록 변환
 */

// ==================== Types ====================

/** 터미널-항공사 조합 문자열 (예: "2_KE", "1_LJ", "unknown_AA") */
export type TerminalAirlineCombo = string;

/** 터미널-항공사 조합이 분리된 형태 */
export interface TerminalAirlinePair {
  terminal: string;
  airline: string;
}

// ==================== 유틸리티 함수들 ====================

/** 터미널명과 항공사 코드를 조합하여 문자열 생성 */
export const createTerminalAirlineCombo = (terminal: string, airline: string): TerminalAirlineCombo => {
  return `${terminal}_${airline}`;
};

/** 터미널-항공사 조합 문자열을 분리하여 객체로 변환 */
export const parseTerminalAirlineCombo = (combo: TerminalAirlineCombo): TerminalAirlinePair | null => {
  const parts = combo.split('_');
  if (parts.length >= 2) {
    const [terminal, ...airlineParts] = parts;
    const airline = airlineParts.join('_'); // 항공사 코드에 '_'가 있을 수 있음 (예: "AA_B")
    return { terminal, airline };
  }
  return null;
};

/** 터미널-항공사 조합 배열에서 특정 터미널에 속한 것들만 필터링 */
export const filterCombosByTerminal = (combos: TerminalAirlineCombo[], terminal: string): TerminalAirlineCombo[] => {
  return combos.filter((combo) => combo.startsWith(`${terminal}_`));
};

/** 터미널-항공사 조합 배열에서 특정 터미널에 속한 것들 제거 */
export const removeCombosByTerminal = (combos: TerminalAirlineCombo[], terminal: string): TerminalAirlineCombo[] => {
  return combos.filter((combo) => !combo.startsWith(`${terminal}_`));
};

/** 터미널-항공사 조합 배열에서 특정 조합 제거 */
export const removeCombo = (
  combos: TerminalAirlineCombo[],
  comboToRemove: TerminalAirlineCombo
): TerminalAirlineCombo[] => {
  return combos.filter((combo) => combo !== comboToRemove);
};

/** 터미널 데이터에서 모든 가능한 터미널-항공사 조합 생성 */
export const createAllCombosForTerminal = (terminal: string, airlineCodes: string[]): TerminalAirlineCombo[] => {
  return airlineCodes.map((airline) => createTerminalAirlineCombo(terminal, airline));
};

// ==================== API 변환 함수들 ====================

/**
 * UI 상태를 API 요청 body로 변환
 * terminal_airlines 조합을 operating_carrier_iata 배열로 변환
 */
export const convertTerminalAirlinesToApiCondition = (
  combos: TerminalAirlineCombo[]
): {
  field: string;
  values: string[];
} | null => {
  // 터미널-항공사 조합에서 항공사 코드만 추출 (중복 제거)
  const airlines = new Set<string>();
  combos.forEach((combo) => {
    const parsed = parseTerminalAirlineCombo(combo);
    if (parsed) {
      airlines.add(parsed.airline);
    }
  });

  const airlineArray = Array.from(airlines);
  if (airlineArray.length === 0) return null;

  return {
    field: 'operating_carrier_iata',
    values: airlineArray,
  };
};
