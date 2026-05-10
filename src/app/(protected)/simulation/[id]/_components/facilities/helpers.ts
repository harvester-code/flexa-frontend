// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD HH:MM:SS" 문자열 → Date 객체 (UTC 기준 파싱 방지) */
function parseDatetimeLocal(s: string): Date {
  const [datePart, timePart] = s.trim().split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = (timePart || "00:00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second || 0);
}

/** Date → "YYYY-MM-DD HH:MM:SS" */
function formatDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * "YYYY-MM-DD HH:MM:SS-YYYY-MM-DD HH:MM:SS" 형식의 period를
 * [startMs, endMs] 으로 파싱합니다.
 * 날짜 없는 레거시 형식은 null을 반환합니다.
 */
function parsePeriodMs(period: string): [number, number] | null {
  if (!period.includes(" ")) return null;
  const sepIdx = period.indexOf("-", period.indexOf(" "));
  if (sepIdx === -1) return null;
  const start = parseDatetimeLocal(period.slice(0, sepIdx));
  const end = parseDatetimeLocal(period.slice(sepIdx + 1));
  return [start.getTime(), end.getTime()];
}

/**
 * 프리셋 전체에서 비행일(D)을 찾습니다.
 * period 종료 시각이 00:00:00인 경우, 그것은 "전날 끝"을 의미하므로 하루 빼서 D를 구합니다.
 * 예) "2025-10-04 00:00:00" → D = 2025-10-03
 */
function findPresetFlightDate(processFlow: any[]): string | null {
  let latestMs = -Infinity;
  let latestDate: string | null = null;

  processFlow.forEach((process) => {
    Object.values(process.zones || {}).forEach((zone: any) => {
      (zone.facilities || []).forEach((facility: any) => {
        (facility.operating_schedule?.time_blocks || []).forEach((block: any) => {
          const parsed = parsePeriodMs(block.period || "");
          if (!parsed) return;
          const endDate = new Date(parsed[1]);
          // 종료가 자정(00:00:00)이면 실제 비행일은 하루 전
          if (
            endDate.getHours() === 0 &&
            endDate.getMinutes() === 0 &&
            endDate.getSeconds() === 0
          ) {
            endDate.setDate(endDate.getDate() - 1);
          }
          endDate.setHours(0, 0, 0, 0);
          if (endDate.getTime() > latestMs) {
            latestMs = endDate.getTime();
            const pad = (n: number) => String(n).padStart(2, "0");
            latestDate = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
          }
        });
      });
    });
  });

  return latestDate;
}

/** 날짜만 offset일 이동 (로컬 날짜 기준 — toISOString()은 UTC 변환으로 시차 오류 발생) */
function shiftDateStr(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** period 문자열 전체의 날짜 부분을 offsetDays 만큼 이동 */
function shiftPeriod(period: string, offsetDays: number): string {
  if (!period.includes(" ") || offsetDays === 0) return period;
  const sepIdx = period.indexOf("-", period.indexOf(" "));
  if (sepIdx === -1) return period;

  const remapToken = (token: string): string => {
    const m = token.trim().match(/^(\d{4}-\d{2}-\d{2})(\s.+)$/);
    if (!m) return token;
    return `${shiftDateStr(m[1], offsetDays)}${m[2]}`;
  };

  return `${remapToken(period.slice(0, sepIdx))}-${remapToken(period.slice(sepIdx + 1))}`;
}

/**
 * 운영 윈도우([windowStartMs, windowEndMs]) 안의 모든 슬롯을 생성합니다.
 * 각 슬롯은 intervalMinutes 간격이며 [slotStartMs, slotEndMs] 쌍입니다.
 */
function generateSlots(
  windowStartMs: number,
  windowEndMs: number,
  intervalMs: number,
): [number, number][] {
  const slots: [number, number][] = [];
  let cur = windowStartMs;
  while (cur < windowEndMs) {
    slots.push([cur, Math.min(cur + intervalMs, windowEndMs)]);
    cur += intervalMs;
  }
  return slots;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 승객 차트 결과와 비행 날짜를 기반으로 운영 윈도우(period)를 계산합니다.
 * store 내부의 calculateOperatingPeriodFromPassengers와 동일한 로직입니다.
 */
export function calcOperatingPeriod(
  chartResult: { chart_x_data?: string[] } | null | undefined,
  date: string | null,
): string | null {
  if (!date) return null;

  if (!chartResult?.chart_x_data || chartResult.chart_x_data.length === 0) {
    const nextDay = new Date(date + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split("T")[0];
    return `${date} 00:00:00-${nextDayStr} 00:00:00`;
  }

  const firstTime = chartResult.chart_x_data[0];
  const lastTime = chartResult.chart_x_data[chartResult.chart_x_data.length - 1];
  const startDateTime = `${firstTime}:00`;

  const [lastDate, lastTimeOnly] = lastTime.split(" ");
  let endDateTime: string;
  if (lastTimeOnly === "00:00") {
    endDateTime = `${lastTime}:00`;
  } else {
    const lastDateObj = new Date(lastDate + "T00:00:00");
    lastDateObj.setDate(lastDateObj.getDate() + 1);
    endDateTime = `${lastDateObj.toISOString().split("T")[0]} 00:00:00`;
  }

  return `${startDateTime}-${endDateTime}`;
}

/**
 * 프리셋을 새 시나리오에 맞게 변환합니다.
 *
 * 1. 날짜 시프트: sourceDate(프리셋 저장 시 비행일) → targetDate 로 오프셋 계산 후 모든 period 날짜 이동
 *    sourceDate가 null이면 heuristic(findPresetFlightDate)으로 폴백합니다.
 * 2. 클리핑/패딩: targetPeriod(새 시나리오 운영 윈도우) 기준으로
 *    - 부족한 슬롯 → 기본값(All 조건, 동일 process_time_seconds) 으로 채움
 *    - 넘치는 슬롯 → 제거
 *    targetPeriod가 null이면 날짜 시프트만 수행합니다.
 *
 * @param processFlow     프리셋의 process_flow
 * @param targetDate      새 시나리오의 비행일 (YYYY-MM-DD)
 * @param sourceDate      프리셋이 저장될 때의 비행일 (reference_date). null이면 heuristic 사용.
 * @param targetPeriod    새 시나리오의 운영 윈도우 ("YYYY-MM-DD HH:MM:SS-YYYY-MM-DD HH:MM:SS")
 * @param intervalMinutes 스케줄 슬롯 간격 (기본 30분)
 */
export function remapPresetDates(
  processFlow: any[],
  targetDate: string | null,
  sourceDate: string | null = null,
  targetPeriod: string | null = null,
  intervalMinutes = 30,
): any[] {
  if (!Array.isArray(processFlow) || !targetDate) return processFlow;

  // ── 1. 날짜 오프셋 계산 ──────────────────────────────────────────────────
  // sourceDate(reference_date)가 있으면 그대로 사용, 없으면 heuristic으로 추정
  const presetFlightDate = sourceDate ?? findPresetFlightDate(processFlow);
  const offsetDays = presetFlightDate
    ? Math.round(
        (new Date(targetDate).getTime() - new Date(presetFlightDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // ── 2. 운영 윈도우 파싱 ─────────────────────────────────────────────────
  const windowMs = targetPeriod ? parsePeriodMs(targetPeriod) : null;
  const intervalMs = intervalMinutes * 60 * 1000;

  return processFlow.map((process) => {
    const updatedZones: Record<string, any> = {};

    Object.entries(process.zones || {}).forEach(([zoneName, zone]: [string, any]) => {
      const updatedFacilities = (zone.facilities || []).map((facility: any) => {
        const rawBlocks: any[] = facility.operating_schedule?.time_blocks || [];

        // ── Step A: 날짜 시프트 ─────────────────────────────────────────
        const shiftedBlocks = rawBlocks.map((block) => ({
          ...block,
          period: shiftPeriod(block.period || "", offsetDays),
        }));

        // 클리핑/패딩이 필요 없으면 날짜 시프트만 반환
        if (!windowMs) {
          return { ...facility, operating_schedule: { time_blocks: shiftedBlocks } };
        }

        const [windowStartMs, windowEndMs] = windowMs;

        // ── Step B: 슬롯 목록 생성 ──────────────────────────────────────
        const slots = generateSlots(windowStartMs, windowEndMs, intervalMs);

        // ── Step C: 프리셋 블록의 유효 범위([startMs, endMs]) 목록 ──────
        // 블록이 큰 범위 하나일 수도, 30분짜리 다수일 수도 있음
        const presetRanges: { startMs: number; endMs: number; block: any }[] = [];
        shiftedBlocks.forEach((block) => {
          const parsed = parsePeriodMs(block.period || "");
          if (!parsed) return;
          presetRanges.push({ startMs: parsed[0], endMs: parsed[1], block });
        });

        // ── Step D: 기본 process_time_seconds 결정 ──────────────────────
        // 프리셋에서 가장 많이 쓰인 값 사용, 없으면 6s
        const ptsCounts = new Map<number, number>();
        shiftedBlocks.forEach((b) => {
          const pts = b.process_time_seconds ?? 6;
          ptsCounts.set(pts, (ptsCounts.get(pts) ?? 0) + 1);
        });
        let defaultPts = 6;
        let maxCount = 0;
        ptsCounts.forEach((count, pts) => {
          if (count > maxCount) { maxCount = count; defaultPts = pts; }
        });

        // ── Step E: 슬롯별 time_block 조립 ─────────────────────────────
        // 슬롯이 어떤 프리셋 블록의 '범위 내'에 있으면 그 블록의 조건 사용.
        // 하나의 큰 블록(전체 구간)이 있어도 각 30분 슬롯으로 분할해 적용.
        const newBlocks = slots.map(([slotStart, slotEnd]) => {
          // 이 슬롯을 커버하는 프리셋 블록 탐색
          // 조건: presetBlock.startMs <= slotStart && presetBlock.endMs >= slotEnd
          const covering = presetRanges.find(
            (r) => r.startMs <= slotStart && r.endMs >= slotEnd,
          );

          if (covering) {
            // 커버 블록의 조건은 유지하되 period만 이 슬롯으로 교체
            return {
              ...covering.block,
              period: `${formatDatetime(new Date(slotStart))}-${formatDatetime(new Date(slotEnd))}`,
            };
          }

          // 커버 블록 없음 → 기본값(All)
          return {
            period: `${formatDatetime(new Date(slotStart))}-${formatDatetime(new Date(slotEnd))}`,
            process_time_seconds: defaultPts,
            passenger_conditions: [],
          };
        });

        return { ...facility, operating_schedule: { time_blocks: newBlocks } };
      });

      updatedZones[zoneName] = { ...zone, facilities: updatedFacilities };
    });

    return { ...process, zones: updatedZones };
  });
}

/**
 * Process Flow 데이터를 로드할 때 시설 ID를 새로운 포맷으로 마이그레이션합니다.
 * 기존 'A_1' 형식을 'A_01' 형식으로 변환하여 호환성을 유지합니다.
 * @param processFlow - Process Flow 배열
 * @returns 마이그레이션된 Process Flow
 * 
 * @example
 * // 기존: A_1, A_2, ..., A_28
 * // 변환: A_01, A_02, ..., A_28
 */
export function migrateProcessFlowFacilityIds(processFlow: any[]): any[] {
  if (!Array.isArray(processFlow)) return processFlow;

  return processFlow.map((process) => {
    if (!process.zones || typeof process.zones !== 'object') {
      return process;
    }

    const updatedZones = { ...process.zones };

    Object.entries(updatedZones).forEach(([zoneName, zone]: [string, any]) => {
      if (!zone?.facilities || !Array.isArray(zone.facilities)) {
        return;
      }

      const maxCount = zone.facilities.length;
      const digits = maxCount.toString().length;

      // 각 시설의 ID를 제로 패딩으로 변환
      zone.facilities = zone.facilities.map((facility: any, idx: number) => {
        // 기존 ID에서 숫자 추출 (순서 보존)
        const match = facility.id.match(/^([A-Z_]+)_(\d+)$/);
        if (match) {
          const [, zonePrefix, oldIndex] = match;
          const paddedIndex = oldIndex.padStart(digits, '0');
          return {
            ...facility,
            id: `${zonePrefix}_${paddedIndex}`,
          };
        }
        
        // 매칭이 안되면 인덱스 기반으로 생성 (폴백)
        const paddedIndex = (idx + 1).toString().padStart(digits, '0');
        return {
          ...facility,
          id: `${zoneName}_${paddedIndex}`,
        };
      });
    });

    return { ...process, zones: updatedZones };
  });
}

