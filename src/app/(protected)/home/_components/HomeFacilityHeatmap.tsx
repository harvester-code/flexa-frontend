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
}

const HomeFacilityHeatmap = ({
  times,
  facilities,
  facilityData,
}: HomeFacilityHeatmapProps) => {
  const [hoveredCell, setHoveredCell] = useState<{
    facilityIdx: number;
    hourIdx: number;
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

  // 시간 포맷 (HH:mm)
  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      const hours = date.getHours().toString();
      return `${hours}h`;
    } catch {
      return timeString;
    }
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

  // 날짜별로 시간 그룹핑
  const dateGroups = useMemo(() => {
    const groups: { date: string; startIdx: number; count: number }[] = [];
    let currentDate = "";
    let startIdx = 0;
    let count = 0;

    times.forEach((time, idx) => {
      const date = formatDate(time);
      if (date !== currentDate) {
        if (currentDate) {
          groups.push({ date: currentDate, startIdx, count });
        }
        currentDate = date;
        startIdx = idx;
        count = 1;
      } else {
        count++;
      }
    });

    if (currentDate) {
      groups.push({ date: currentDate, startIdx, count });
    }

    return groups;
  }, [times]);

  if (heatmapData.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-auto relative">
      {/* Legend at top-right */}
      <div className="absolute top-0 right-0 flex items-center gap-3 text-xs text-muted-foreground bg-white px-3 py-2 rounded-md border border-input z-20">
        {/* <span className="whitespace-nowrap">Color intensity: Inflow / Capacity ratio</span> */}
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-16"
            style={{
              background:
                "linear-gradient(to right, rgb(255,255,255), rgb(239,68,68))",
            }}
          />
          <span className="whitespace-nowrap">Inflow / Capacity ratio</span>
        </div>
      </div>

      <table className="min-w-full border-collapse text-xs mt-12">
        <thead>
          {/* Date Header Row */}
          <tr>
            <th
              className="sticky left-0 z-10 border border-input bg-gray-50"
              rowSpan={2}
            >
              <div className="px-2 py-1.5 text-left font-semibold text-xs">
                FACILITY
              </div>
            </th>
            {dateGroups.map((group, idx) => (
              <th
                key={idx}
                colSpan={group.count}
                className="border border-input bg-gray-100 px-1.5 py-1 text-center font-semibold text-xs"
              >
                {group.date}
              </th>
            ))}
          </tr>
          {/* Time Header Row */}
          <tr>
            {times.map((time, idx) => (
              <th
                key={idx}
                className="border border-input bg-gray-50 px-1.5 py-1 text-center font-medium text-xs min-w-[45px]"
              >
                {formatTime(time)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmapData.map((facility, facilityIdx) => (
            <tr key={facilityIdx} className="hover:bg-gray-50">
              <td className="sticky left-0 z-10 border border-input bg-white px-2 py-1.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-xs">
                    {facility.facilityName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {facility.totalThroughput.toLocaleString()} pax
                  </span>
                </div>
              </td>
              {facility.hourlyData.map((hour, hourIdx) => {
                const colorInfo = getRatioColor(hour.ratio);
                const isHovered =
                  hoveredCell?.facilityIdx === facilityIdx &&
                  hoveredCell?.hourIdx === hourIdx;

                return (
                  <td
                    key={hourIdx}
                    className="border border-input px-1.5 py-1 text-center relative"
                    style={{ backgroundColor: colorInfo.backgroundColor }}
                    onMouseEnter={() =>
                      setHoveredCell({ facilityIdx, hourIdx })
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HomeFacilityHeatmap;
