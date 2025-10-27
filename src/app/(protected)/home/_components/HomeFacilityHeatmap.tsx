import { useMemo } from 'react';

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

const HomeFacilityHeatmap = ({ times, facilities, facilityData }: HomeFacilityHeatmapProps) => {
  const heatmapData = useMemo<FacilityHeatmapData[]>(() => {
    if (!facilities || facilities.length === 0) return [];

    return facilities
      .filter(facilityName => facilityName !== 'all_zones' && facilityName !== 'Skip')
      .map(facilityName => {
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

  // 최대 ratio 계산 (색상 스케일링용)
  const maxRatio = useMemo(() => {
    let max = 0;
    heatmapData.forEach(facility => {
      facility.hourlyData.forEach(hour => {
        if (hour.ratio > max) max = hour.ratio;
      });
    });
    return Math.max(max, 1); // 최소 1로 설정
  }, [heatmapData]);

  // ratio를 빨간색 강도로 변환 (0.0 ~ 1.0)
  const getRatioColor = (ratio: number): string => {
    const normalizedRatio = Math.min(ratio / maxRatio, 1);

    // 빨간색 그라데이션 (흰색 -> 빨강)
    // rgb(255, 255, 255) -> rgb(239, 68, 68) (red-500)
    const r = 255;
    const g = Math.round(255 - (255 - 68) * normalizedRatio);
    const b = Math.round(255 - (255 - 68) * normalizedRatio);

    return `rgb(${r}, ${g}, ${b})`;
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
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}/${day}`;
    } catch {
      return '';
    }
  };

  // 날짜별로 시간 그룹핑
  const dateGroups = useMemo(() => {
    const groups: { date: string; startIdx: number; count: number }[] = [];
    let currentDate = '';
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
        <span className="whitespace-nowrap">Color intensity: Inflow / Capacity ratio</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-16" style={{ background: 'linear-gradient(to right, rgb(255,255,255), rgb(239,68,68))' }} />
          <span className="whitespace-nowrap">Low → High</span>
        </div>
      </div>

      <table className="min-w-full border-collapse text-xs mt-12">
        <thead>
          {/* Date Header Row */}
          <tr>
            <th className="sticky left-0 z-10 border border-input bg-gray-50" rowSpan={2}>
              <div className="px-2 py-1.5 text-left font-semibold text-xs">FACILITY</div>
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
              <th key={idx} className="border border-input bg-gray-50 px-1.5 py-1 text-center font-medium text-xs min-w-[45px]">
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
                  <span className="font-semibold text-xs">{facility.facilityName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {facility.totalThroughput.toLocaleString()} pax
                  </span>
                </div>
              </td>
              {facility.hourlyData.map((hour, hourIdx) => (
                <td
                  key={hourIdx}
                  className="border border-input px-1.5 py-1 text-center"
                  style={{ backgroundColor: getRatioColor(hour.ratio) }}
                  title={`Inflow: ${hour.inflow} | Capacity: ${hour.capacity} | Ratio: ${(hour.ratio * 100).toFixed(1)}%`}
                >
                  <span className={hour.ratio > 0.7 ? 'font-semibold text-white text-xs' : 'font-medium text-xs'}>
                    {hour.inflow}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HomeFacilityHeatmap;
