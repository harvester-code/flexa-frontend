'use client';

import React, { useEffect, useState } from 'react';

interface LayoutData {
  _img_info: {
    img: string;
    W: number;
    H: number;
  } | null;
  _service_point_info: {
    [key: string]: {
      component_name: string;
      node_name: string;
      front_start_point_x: number;
      front_start_point_y: number;
      front_end_point_x: number;
      front_end_point_y: number;
      direction: string;
      num_of_fronts: number;
      num_of_rows: number;
    };
  };
}

interface HomeTopViewProps {
  scenario: any;
  calculate_type: string;
  percentile: number | null;
}

function HomeTopView({ scenario, calculate_type, percentile }: HomeTopViewProps) {
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [topViewData, setTopViewData] = useState<{[key: string]: {[key: string]: number}} | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // layout.json과 topview_data.json을 병렬로 fetch
        const [layoutResponse, topViewResponse] = await Promise.all([
          fetch('/layout.json'),
          fetch('/topview_data.json')
        ]);

        
        if (!layoutResponse.ok) {
          throw new Error('Failed to fetch layout.json');
        }
        if (!topViewResponse.ok) {
          throw new Error('Failed to fetch topview_data.json');
        }

        const layoutData = await layoutResponse.json();
        const topViewData = await topViewResponse.json();

        setLayoutData(layoutData);
        setTopViewData(topViewData);
        
        // 첫 번째 시간을 기본 선택
        const times = Object.keys(topViewData).sort();
        if (times.length > 0) {
          setSelectedTime(times[0]);
          setTimeIndex(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  // 특정 위치에 사람이 있는지 확인하는 함수
  const isPersonAtPosition = (servicePointKey: string, frontIndex: number, rowIndex: number): boolean => {
    if (!topViewData || !selectedTime) return false;
    
    const queueCount = topViewData[selectedTime]?.[servicePointKey] || 0;
    const point = layoutData?._service_point_info[servicePointKey];
    if (!point) return false;

    const numFronts = point.num_of_fronts;
    // row별로 front를 다 채우고 다음 row로 가는 로직
    const totalPositionIndex = rowIndex * numFronts + frontIndex;
    
    return totalPositionIndex < queueCount;
  };

  const renderServicePoints = (containerWidth: number) => {
    if (!layoutData?._service_point_info) return null;

    const servicePoints = layoutData._service_point_info;
    const imgInfo = layoutData._img_info;
    
    if (!imgInfo) return null;

    // 서비스 포인트별 색상 정의
    const servicePointColors = [
      { bg: 'bg-blue-500', hover: 'hover:bg-blue-700', name: 'blue' },
      { bg: 'bg-green-500', hover: 'hover:bg-green-700', name: 'green' },
      { bg: 'bg-purple-500', hover: 'hover:bg-purple-700', name: 'purple' },
      { bg: 'bg-red-500', hover: 'hover:bg-red-700', name: 'red' },
      { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-700', name: 'yellow' },
      { bg: 'bg-pink-500', hover: 'hover:bg-pink-700', name: 'pink' },
      { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-700', name: 'indigo' },
      { bg: 'bg-orange-500', hover: 'hover:bg-orange-700', name: 'orange' },
    ];

    // 스케일링 없이 layout.json의 좌표를 직접 사용
    return Object.entries(servicePoints).map(([key, point], index) => {
      const colorScheme = servicePointColors[index % servicePointColors.length];
      
      const startX = point.front_start_point_x;
      const startY = point.front_start_point_y;
      const endX = point.front_end_point_x;
      const endY = point.front_end_point_y;

      // 방향 벡터 계산
      const directionVectorX = endX - startX;
      const directionVectorY = endY - startY;
      const length = Math.sqrt(directionVectorX * directionVectorX + directionVectorY * directionVectorY);
      
      // 정규화된 방향 벡터
      const normalizedDirX = directionVectorX / length;
      const normalizedDirY = directionVectorY / length;
      
      // 법선 벡터 (direction에 따라 위쪽 또는 아래쪽)
      const isForward = point.direction === 'forward';
      const normalX = isForward ? -normalizedDirY : normalizedDirY;
      const normalY = isForward ? normalizedDirX : -normalizedDirX;

      const points: React.ReactNode[] = [];
      
      // front_start와 front_end 점 표시
      points.push(
        <div
          key={`${key}-start`}
          className="absolute w-2 h-2 bg-gray-500 rounded-full"
          style={{
            left: `${startX - 4}px`,
            top: `${startY - 4}px`,
          }}
          title={`${key} Start (${startX}, ${startY})`}
        />
      );
      
      points.push(
        <div
          key={`${key}-end`}
          className="absolute w-2 h-2 bg-gray-500 rounded-full"
          style={{
            left: `${endX - 4}px`,
            top: `${endY - 4}px`,
          }}
          title={`${key} End (${endX}, ${endY})`}
        />
      );

      // 격자 점들 생성
      const numFronts = point.num_of_fronts;
      const numRows = point.num_of_rows;
      
      // start-end 사이 거리에서 front 간격을 계산
      const frontSpacing = length / (numFronts - 1);
      // row 간격도 front 간격과 동일하게 설정
      const rowSpacing = frontSpacing;

      for (let i = 0; i < numFronts; i++) {
        // front_start와 front_end 사이의 점 계산 (원래 방식 유지)
        const t = i / (numFronts - 1);
        const baseX = startX + t * directionVectorX;
        const baseY = startY + t * directionVectorY;

        for (let j = 0; j < numRows; j++) {
          // 법선 방향으로 점 배치 (front 간격과 동일한 간격 사용)
          const offsetDistance = j * rowSpacing;
          const pointX = baseX + normalX * offsetDistance;
          const pointY = baseY + normalY * offsetDistance;

          // 해당 위치에 사람이 있는 경우만 점을 표시
          const isActive = isPersonAtPosition(key, i, j);
          
          if (isActive) {
            points.push(
              <div
                key={`${key}-${i}-${j}`}
                className={`absolute w-1 h-1 ${colorScheme.bg} rounded-full shadow-sm ${colorScheme.hover} hover:scale-150 transition-all duration-200`}
                style={{
                  left: `${pointX - 2}px`,
                  top: `${pointY - 2}px`,
                  transform: 'scale(0.7)',
                }}
                title={`${key} Front[${i+1}/${numFronts}] Row[${j+1}/${numRows}] - OCCUPIED - (${pointX.toFixed(1)}, ${pointY.toFixed(1)})`}
              />
            );
          }
        }
      }

      return points;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-gray-50 p-6">
          <p>Loading layout.json...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-red-50 p-6">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const imgInfo = layoutData?._img_info;
  if (!imgInfo) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-gray-50 p-6">
          <p>No image information available</p>
        </div>
      </div>
    );
  }

  // 디스플레이 사이즈 고정 (가로 1000px, 높이는 비율에 맞춰 조정)
  const displayWidth = 1000;
  const scale = displayWidth / imgInfo.W;
  const displayHeight = imgInfo.H * scale;
  
  const availableTimes = topViewData ? Object.keys(topViewData).sort() : [];
  const currentQueueData = selectedTime && topViewData ? topViewData[selectedTime] : {};

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-gray-50 p-6">
        <h3 className="text-lg font-semibold mb-4">Airport Layout - Real-time Queue Status</h3>
        
        {/* 시간 선택 슬라이더 */}
        {availableTimes.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-4">
              <label htmlFor="time-slider" className="font-medium text-gray-700">
                Select Time:
              </label>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {selectedTime}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">{availableTimes[0]}</span>
              <input
                id="time-slider"
                type="range"
                min={0}
                max={availableTimes.length - 1}
                value={timeIndex}
                onChange={(e) => {
                  const newIndex = parseInt(e.target.value);
                  setTimeIndex(newIndex);
                  setSelectedTime(availableTimes[newIndex]);
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(timeIndex / (availableTimes.length - 1)) * 100}%, #e5e7eb ${(timeIndex / (availableTimes.length - 1)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <span className="text-xs text-gray-500">{availableTimes[availableTimes.length - 1]}</span>
            </div>
            <div className="text-xs text-gray-500 text-center">
              {timeIndex + 1} / {availableTimes.length}
            </div>
          </div>
        )}
         
        {/* 현재 대기인원 정보 */}
        {availableTimes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-gray-700">Current Queue:</span>
              {Object.entries(currentQueueData).map(([servicePoint, count]) => {
                // layoutData에서 서비스 포인트의 실제 순서 찾기
                const servicePointKeys = Object.keys(layoutData._service_point_info);
                const servicePointIndex = servicePointKeys.indexOf(servicePoint);
                const backgroundColors = [
                  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-red-100 text-red-800',
                  'bg-yellow-100 text-yellow-800', 'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800', 'bg-orange-100 text-orange-800'
                ];
                const colorClass = backgroundColors[servicePointIndex % backgroundColors.length];
                return (
                  <span key={servicePoint} className={`${colorClass} px-2 py-1 rounded font-medium`}>
                    {servicePoint}: {count} people
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 이미지와 서비스 포인트 오버레이 */}
        <div className="mb-6 w-full">
          <div 
            className="relative border border-gray-300 overflow-hidden w-full"
            style={{ 
              height: `${displayHeight}px`
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={imgInfo.img}
              alt="Airport Layout"
              className="w-full h-full object-cover"
            />
            {renderServicePoints(displayWidth)}
            {mousePosition && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                Mouse Position: ({mousePosition.x.toFixed(0)}, {mousePosition.y.toFixed(0)})
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-gray-600">● Gray dots: Start/End points</span>
            <br />
            Service Points: {Object.entries(layoutData._service_point_info).map(([key, point], index) => {
              const colors = [
                'text-blue-600', 'text-green-600', 'text-purple-600', 'text-red-600', 
                'text-yellow-600', 'text-pink-600', 'text-indigo-600', 'text-orange-600'
              ];
              const colorClass = colors[index % colors.length];
              return (
                <span key={key} className={`${colorClass} mr-4`}>
                  ● {key}({point.num_of_fronts}×{point.num_of_rows})
                </span>
              );
            })}
          </div>
        </div>

        {/* JSON 데이터 표시 */}
        <div className="mt-4 space-y-4">
          <details>
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              layout.json
            </summary>
            <pre className="mt-2 text-sm bg-white p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(layoutData, null, 2)}
            </pre>
          </details>

          <details>
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              topview_data.json
            </summary>
            <pre className="mt-2 text-sm bg-white p-4 rounded border overflow-auto max-h-96">
              {JSON.stringify(topViewData, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

export default HomeTopView; 