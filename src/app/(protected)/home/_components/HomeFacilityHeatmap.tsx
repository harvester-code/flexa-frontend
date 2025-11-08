import { useMemo, useState } from "react";

interface FacilityHeatmapData {
  facilityName: string;
  totalThroughput: number;
  hourlyData: {
    time: string;
    inflow: number;
    capacity: number;
    ratio: number; // inflow / capacity
  }[];
}

interface HomeFacilityHeatmapProps {
  times: string[];
  facilities: string[];
  facilityData: Record<string, { inflow: number[]; capacity?: number[] }>;
  scenarioDate?: string; // 기준 날짜 (예: "2025-11-06")
}

const HomeFacilityHeatmap = ({
  times,
  facilities,
  facilityData,
  scenarioDate,
}: HomeFacilityHeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<{
    timeIdx: number;
    facilityIdx: number;
  } | null>(null);

  const heatmapData = useMemo<FacilityHeatmapData[]>(() => {
    if (!facilities || facilities.length === 0) return [];

    return facilities
      .filter(
        (facilityName) =>
          facilityName !== "all_zones" && facilityName !== "Skip"
      )
      .map((facilityName) => {
        const data = facilityData[facilityName];
        if (!data) return null;

        const inflowArray = data.inflow || [];
        const capacityArray = data.capacity || [];
        const totalThroughput = inflowArray.reduce((sum, val) => sum + val, 0);

        const hourlyData = times.map((time, idx) => {
          const inflow = inflowArray[idx] || 0;
          const capacity = capacityArray[idx] || 1; // 0으로 나누기 방지
          const ratio = capacity > 0 ? inflow / capacity : 0;

          return {
            time,
            inflow,
            capacity,
            ratio,
          };
        });

        return {
          facilityName,
          totalThroughput,
          hourlyData,
        };
      })
      .filter((item): item is FacilityHeatmapData => item !== null);
  }, [times, facilities, facilityData]);

  // ratio를 빨간색 강도로 변환 (30% 단위 구간)
  const getRatioColor = (
    ratio: number
  ): {
    backgroundColor: string;
    textColor: string;
    normalizedRatio: number;
  } => {
    let colorIntensity: number;

    if (ratio < 0.3) {
      // 0~30%
      colorIntensity = 0.0;
    } else if (ratio < 0.6) {
      // 30~60%
      colorIntensity = 0.1;
    } else if (ratio < 0.9) {
      // 60~90%
      colorIntensity = 0.2;
    } else if (ratio < 1.2) {
      // 90~120%
      colorIntensity = 0.35;
    } else if (ratio < 1.5) {
      // 120~150%
      colorIntensity = 0.5;
    } else if (ratio < 1.8) {
      // 150~180%
      colorIntensity = 0.6;
    } else if (ratio < 2.1) {
      // 180~210%
      colorIntensity = 0.7;
    } else if (ratio < 2.4) {
      // 210~240%
      colorIntensity = 0.8;
    } else if (ratio < 2.7) {
      // 240~270%
      colorIntensity = 0.9;
    } else if (ratio < 3.0) {
      // 270~300%
      colorIntensity = 0.95;
    } else {
      // 300%+ (모두 동일한 최대 빨강)
      colorIntensity = 1.0;
    }

    // 빨간색 그라데이션
    // rgb(255, 255, 255) -> rgb(220, 38, 38) (red-600)
    const r = 255;
    const g = Math.round(255 - (255 - 38) * colorIntensity);
    const b = Math.round(255 - (255 - 38) * colorIntensity);

    const backgroundColor = `rgb(${r}, ${g}, ${b})`;

    // 색상 강도에 따라 텍스트 색상 결정
    const textColor = colorIntensity >= 0.4 ? "#ffffff" : "#000000";

    return { backgroundColor, textColor, normalizedRatio: colorIntensity };
  };

  // 날짜 포맷 (MM/DD)
  const formatDate = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${month}/${day}`;
    } catch {
      return "";
    }
  };

  // 시간 포맷 (HH:mm)
  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  // 시간 포맷 및 D-1 뱃지 로직
  const formatTimeWithBadge = (timeString: string, timeIdx: number): { date: string; time: string; isDayBefore: boolean } => {
    try {
      const timeDate = new Date(timeString);
      const date = formatDate(timeString);
      const time = formatTime(timeString);

      // 00:00이 나오기 전까지는 D-1
      const midnightIndex = times.findIndex((t) => {
        const d = new Date(t);
        return d.getHours() === 0 && d.getMinutes() === 0;
      });

      const isDayBefore = midnightIndex > 0 && timeIdx < midnightIndex;

      return {
        date,
        time,
        isDayBefore,
      };
    } catch {
      return { date: "", time: timeString, isDayBefore: false };
    }
  };

  if (heatmapData.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 relative">
      {/* Legend at top-right - 스크롤 영역 밖 */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground bg-white px-3 py-2 rounded-md border border-input">
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-gradient-to-r from-white to-red-500" />
            <span className="whitespace-nowrap">Inflow / Capacity ratio</span>
          </div>
        </div>
      </div>

      {/* 스크롤 가능한 테이블 컨테이너 */}
      <div className="overflow-auto max-h-screen">
        <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-50 shadow-sm bg-gray-50">
          {/* Single Header Row - Facility Names */}
          <tr className="bg-gray-50">
            <th
              className="sticky left-0 z-50 border border-input px-2 py-1.5 text-center font-semibold text-xs w-20 shadow-md bg-purple-50"
            >
              TIME
            </th>
            {heatmapData.map((facility, idx) => (
              <th
                key={idx}
                className="border border-input bg-gray-50 px-2 py-1.5 text-center font-semibold text-xs min-w-16 relative"
              >
                <div className="flex flex-col gap-0.5">
                  <span>{facility.facilityName}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {facility.totalThroughput.toLocaleString()} pax
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time, timeIdx) => {
            const { date, time: formattedTime, isDayBefore } = formatTimeWithBadge(time, timeIdx);
            
            return (
              <tr key={timeIdx} className="hover:bg-gray-50">
                <td
                  className="sticky left-0 z-10 border border-input px-1 py-1.5 w-20 shadow-md bg-purple-50"
                >
                  <div className="flex items-center justify-center gap-1">
                    {isDayBefore && (
                      <span className="px-1 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 rounded">
                        D-1
                      </span>
                    )}
                    <span className="font-medium text-xs">{formattedTime}</span>
                  </div>
                </td>
                {heatmapData.map((facility, facilityIdx) => {
                  const hour = facility.hourlyData[timeIdx];
                  if (!hour) return null;

                  const colorInfo = getRatioColor(hour.ratio);
                  const isHovered =
                    hoveredCell?.timeIdx === timeIdx &&
                    hoveredCell?.facilityIdx === facilityIdx;

                  return (
                    <td
                      key={facilityIdx}
                      className="border border-input px-1.5 py-1 text-center relative"
                      style={{ backgroundColor: colorInfo.backgroundColor }}
                      onMouseEnter={() =>
                        setHoveredCell({ timeIdx, facilityIdx })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: colorInfo.textColor }}
                      >
                        {hour.inflow}
                      </span>

                      {/* 즉시 나타나는 커스텀 tooltip */}
                      {isHovered && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap pointer-events-none">
                          <div>Inflow: {hour.inflow}</div>
                          <div>Capacity: {hour.capacity}</div>
                          <div>Ratio: {(hour.ratio * 100).toFixed(1)}%</div>
                          {/* 작은 화살표 */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default HomeFacilityHeatmap;
