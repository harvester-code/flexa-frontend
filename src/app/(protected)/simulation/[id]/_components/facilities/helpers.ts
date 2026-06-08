// ─────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

import type { Facility, ProcessStep, TimeBlock, Zone } from '@/types/simulationTypes';

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
function findPresetFlightDate(processFlow: ProcessStep[]): string | null {
  let latestMs = -Infinity;
  let latestDate: string | null = null;

  processFlow.forEach((process) => {
    Object.values(process.zones || {}).forEach((zone: Zone) => {
      (zone.facilities || []).forEach((facility: Facility) => {
        (facility.operating_schedule?.time_blocks || []).forEach((block: TimeBlock) => {
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

/**
 * remap 시 사용할 source 비행일을 결정합니다.
 *
 * sourceDate가 targetDate와 같지만 process_flow period에는 다른 날짜가 박혀 있으면
 * (시나리오 복사 후 context.date만 변경된 경우) period에 박힌 날짜를 신뢰합니다.
 */
function resolvePresetSourceDate(
  sourceDate: string | null,
  targetDate: string,
  processFlow: ProcessStep[],
): string | null {
  const inferredDate = findPresetFlightDate(processFlow);
  if (!sourceDate) return inferredDate;

  if (sourceDate === targetDate && inferredDate && inferredDate !== targetDate) {
    return inferredDate;
  }

  return sourceDate;
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

  const pad = (n: number) => String(n).padStart(2, "0");
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (!chartResult?.chart_x_data || chartResult.chart_x_data.length === 0) {
    const nextDay = new Date(date + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    return `${date} 00:00:00-${localDateStr(nextDay)} 00:00:00`;
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
    endDateTime = `${localDateStr(lastDateObj)} 00:00:00`;
  }

  return `${startDateTime}-${endDateTime}`;
}

/**
 * 프리셋을 새 시나리오에 맞게 변환합니다.
 *
 * 1. 날짜 시프트: sourceDate(프리셋 저장 시 비행일) → targetDate 로 오프셋 계산 후 모든 period 날짜 이동
 *    sourceDate가 null이면 heuristic(findPresetFlightDate)으로 폴백합니다.
 * 2. 경계값 확장: targetPeriod(새 시나리오 운영 윈도우) 기준으로
 *    - 프리셋 범위보다 앞쪽 → 가장 첫 번째 블록의 값으로 확장
 *    - 프리셋 범위보다 뒤쪽 → 가장 마지막 블록의 값으로 확장
 *    - 시간 단위는 건드리지 않음 (useNormalizeAllSchedules가 담당)
 *    targetPeriod가 null이면 날짜 시프트만 수행합니다.
 *
 * @param processFlow  프리셋의 process_flow
 * @param targetDate   새 시나리오의 비행일 (YYYY-MM-DD)
 * @param sourceDate   프리셋이 저장될 때의 비행일 (reference_date). null이면 heuristic 사용.
 * @param targetPeriod 새 시나리오의 운영 윈도우 ("YYYY-MM-DD HH:MM:SS-YYYY-MM-DD HH:MM:SS")
 */
export function remapPresetDates(
  processFlow: ProcessStep[],
  targetDate: string | null,
  sourceDate: string | null = null,
  targetPeriod: string | null = null,
): ProcessStep[] {
  if (!Array.isArray(processFlow) || !targetDate) return processFlow;

  // ── 1. 날짜 오프셋 계산 ──────────────────────────────────────────────────
  const presetFlightDate = resolvePresetSourceDate(sourceDate, targetDate, processFlow);
  const offsetDays = presetFlightDate
    ? Math.round(
        (new Date(targetDate).getTime() - new Date(presetFlightDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // ── 2. 운영 윈도우 파싱 ─────────────────────────────────────────────────
  const windowMs = targetPeriod ? parsePeriodMs(targetPeriod) : null;

  return processFlow.map((process) => {
    const updatedZones: Record<string, Zone> = {};

    Object.entries(process.zones || {}).forEach(([zoneName, zone]) => {
      const updatedFacilities = (zone.facilities || []).map((facility: Facility) => {
        const rawBlocks: TimeBlock[] = facility.operating_schedule?.time_blocks || [];

        // ── Step A: 날짜 시프트 ─────────────────────────────────────────
        const shiftedBlocks = rawBlocks.map((block) => ({
          ...block,
          period: shiftPeriod(block.period || "", offsetDays),
        }));

        // 경계값 확장이 필요 없으면 날짜 시프트만 반환
        if (!windowMs || shiftedBlocks.length === 0) {
          return { ...facility, operating_schedule: { time_blocks: shiftedBlocks } };
        }

        const [windowStartMs, windowEndMs] = windowMs;

        // ── Step B: 블록을 startMs 기준으로 정렬 ────────────────────────
        const parsedBlocks = shiftedBlocks
          .map((block) => {
            const parsed = parsePeriodMs(block.period || "");
            if (!parsed) return null;
            return { startMs: parsed[0], endMs: parsed[1], block };
          })
          .filter(Boolean) as { startMs: number; endMs: number; block: TimeBlock }[];

        if (parsedBlocks.length === 0) {
          return { ...facility, operating_schedule: { time_blocks: shiftedBlocks } };
        }

        parsedBlocks.sort((a, b) => a.startMs - b.startMs);
        const firstParsed = parsedBlocks[0];
        const lastParsed = parsedBlocks[parsedBlocks.length - 1];

        let resultBlocks = [...shiftedBlocks];

        // ── Step C: 앞쪽 경계값 확장 ────────────────────────────────────
        // 운영 윈도우가 첫 블록보다 일찍 시작하면, 첫 블록을 윈도우 시작까지 확장
        if (windowStartMs < firstParsed.startMs) {
          const extendedFirst = {
            ...firstParsed.block,
            period: `${formatDatetime(new Date(windowStartMs))}-${formatDatetime(new Date(firstParsed.endMs))}`,
          };
          // 기존 첫 블록을 교체
          resultBlocks = [
            extendedFirst,
            ...shiftedBlocks.filter((b) => {
              const p = parsePeriodMs(b.period || "");
              return p ? p[0] !== firstParsed.startMs : true;
            }),
          ];
        }

        // ── Step D: 뒤쪽 경계값 확장 ────────────────────────────────────
        // 운영 윈도우가 마지막 블록보다 늦게 끝나면, 마지막 블록을 윈도우 끝까지 확장
        if (windowEndMs > lastParsed.endMs) {
          // resultBlocks에서 마지막 블록 찾아 교체
          const lastBlockPeriodStart = formatDatetime(new Date(lastParsed.startMs));
          const extendedLast = {
            ...lastParsed.block,
            period: `${lastBlockPeriodStart}-${formatDatetime(new Date(windowEndMs))}`,
          };
          resultBlocks = resultBlocks.map((b) => {
            const p = parsePeriodMs(b.period || "");
            return p && p[0] === lastParsed.startMs ? extendedLast : b;
          });
        }

        // ── Step E: 윈도우 바깥 블록 클리핑 ─────────────────────────────
        // 윈도우 범위를 완전히 벗어난 블록 제거, 걸쳐있는 블록은 클리핑
        resultBlocks = resultBlocks
          .map((b) => {
            const p = parsePeriodMs(b.period || "");
            if (!p) return b;
            const [bStart, bEnd] = p;
            if (bEnd <= windowStartMs || bStart >= windowEndMs) return null; // 완전히 밖
            const clippedStart = Math.max(bStart, windowStartMs);
            const clippedEnd = Math.min(bEnd, windowEndMs);
            if (clippedStart === bStart && clippedEnd === bEnd) return b; // 변경 없음
            return {
              ...b,
              period: `${formatDatetime(new Date(clippedStart))}-${formatDatetime(new Date(clippedEnd))}`,
            };
          })
          .filter(Boolean) as TimeBlock[];

        return { ...facility, operating_schedule: { time_blocks: resultBlocks } };
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
export function migrateProcessFlowFacilityIds(processFlow: ProcessStep[]): ProcessStep[] {
  if (!Array.isArray(processFlow)) return processFlow;

  return processFlow.map((process) => {
    if (!process.zones || typeof process.zones !== 'object') {
      return process;
    }

    const updatedZones = { ...process.zones };

    Object.entries(updatedZones).forEach(([zoneName, zone]) => {
      if (!zone?.facilities || !Array.isArray(zone.facilities)) {
        return;
      }

      const maxCount = zone.facilities.length;
      const digits = maxCount.toString().length;

      zone.facilities = zone.facilities.map((facility: Facility, idx: number) => {
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

