'use client';

import React, { useEffect, useState } from 'react';

interface LayoutData {
  _img_info: {
    img?: string;        // base64 이미지 데이터 (기존 방식)
    img_path?: string;   // 이미지 파일 경로 (새로운 방식)
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
  data?: {[key: string]: {[componentName: string]: {[servicePoint: string]: number}}};
  isLoading?: boolean;
}

function HomeTopView({ scenario, data, isLoading }: HomeTopViewProps) {
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [topViewData, setTopViewData] = useState<{[key: string]: {[componentName: string]: {[servicePoint: string]: number}}} | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // 실제 표시할 이미지 URL
  
  // Zoom and Pan state (동일한 LayoutSetting 방식)
  const [dotSize, setDotSize] = useState<number>(0.5); // LayoutSetting과 동일한 초기값
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{width: number; height: number} | null>(null);

  // Set topview data from props
  useEffect(() => {
    if (data) {
      setTopViewData(data);
    }
  }, [data]);

  // Set default time when topViewData changes
  useEffect(() => {
    if (topViewData) {
      const times = Object.keys(topViewData).sort();
      if (times.length > 0) {
        // 대기인원이 있는 시간을 찾아서 기본으로 설정
        const timeWithQueue = times.find(time => {
          const timeData = topViewData[time];
          return Object.values(timeData).some(component => {
            if (typeof component === 'object' && component !== null) {
              return Object.values(component as Record<string, number>).some(count => count > 0);
            }
            return false;
          });
        });
        
        if (timeWithQueue) {
          const timeIndex = times.indexOf(timeWithQueue);
          setSelectedTime(timeWithQueue);
          setTimeIndex(timeIndex);
        } else {
          setSelectedTime(times[0]);
          setTimeIndex(0);
        }
      }
    }
  }, [topViewData]);

  useEffect(() => {
    const fetchLayoutData = async () => {
      try {
        // layout.json 만 fetch (topview_data.json은 props로 받음)
        const layoutResponse = await fetch('/layout.json');
        
        if (!layoutResponse.ok) {
          throw new Error('Failed to fetch layout.json');
        }

        const layoutData = await layoutResponse.json();
        setLayoutData(layoutData);

        
        // 이미지 URL 설정
        if (layoutData._img_info) {
          if (layoutData._img_info.img) {
            // base64 이미지 데이터가 있는 경우 (기존 방식)
            setImageUrl(layoutData._img_info.img);
          } else if (layoutData._img_info.img_path) {
            // 이미지 파일 경로가 있는 경우 (새로운 방식)
            // uploads 폴더에서 이미지 로드 시도
            const imagePath = `/uploads/${layoutData._img_info.img_path}`;
            try {
              const imageResponse = await fetch(imagePath);
              if (imageResponse.ok) {
                setImageUrl(imagePath);
              } else {
                // uploads에 없으면 public에서 시도
                setImageUrl(`/${layoutData._img_info.img_path}`);
              }
            } catch {
              // 오류 발생 시 public에서 시도
              setImageUrl(`/${layoutData._img_info.img_path}`);
            }
          }
        }
        
        // 이미지 natural size 측정
        if (layoutData._img_info) {
          const img = new Image();
          img.onload = () => {
            setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          };
          if (layoutData._img_info.img) {
            img.src = layoutData._img_info.img;
          } else if (imageUrl) {
            img.src = imageUrl;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchLayoutData();
  }, []);

  // Global mouse event handlers for proper drag behavior (LayoutSetting과 동일)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPanOffset = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        };
        
        // Check if there's actual movement (more than 3 pixels)
        const moveDistance = Math.sqrt(
          Math.pow(newPanOffset.x - panOffset.x, 2) + 
          Math.pow(newPanOffset.y - panOffset.y, 2)
        );
        
        if (moveDistance > 3) {
          setHasMoved(true);
        }
        
        setPanOffset(newPanOffset);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, panOffset]);

  // Mouse wheel zoom handler (LayoutSetting과 동일)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * delta, 0.1), 5);
    setZoomLevel(newZoom);
  };

  // Mouse drag handlers for panning (LayoutSetting과 동일)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageNaturalSize) return;
    
    // Get the image element's actual position after transforms
    const imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) return;
    
    // Get the transformed image bounds (this includes all CSS transforms)
    const imgRect = imgElement.getBoundingClientRect();
    
    // Mouse position relative to the transformed image
    const imageX = e.clientX - imgRect.left;
    const imageY = e.clientY - imgRect.top;
    
    // Convert to normalized coordinates (0-1) within the image
    const normalizedX = imageX / imgRect.width;
    const normalizedY = imageY / imgRect.height;
    
    // Convert to actual image pixel coordinates
    const x = Math.round(normalizedX * imageNaturalSize.width);
    const y = Math.round(normalizedY * imageNaturalSize.height);
    
    setMousePosition({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setIsDragging(false);
    setHasMoved(false);
  };

  // Prevent default drag behavior for images
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    return false;
  };

  // Reset zoom and pan (LayoutSetting과 동일)
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setHasMoved(false);
  };

  // 특정 위치에 사람이 있는지 확인하는 함수
  const isPersonAtPosition = (servicePointKey: string, frontIndex: number, rowIndex: number): boolean => {
    if (!topViewData || !selectedTime || !layoutData) {
      return false;
    }
    
    // component_name을 layout.json에서 찾기
    const point = layoutData._service_point_info[servicePointKey];
    if (!point) {
      return false;
    }
    
    const componentName = point.component_name;
    const queueCount = topViewData[selectedTime]?.[componentName]?.[servicePointKey] || 0;

    const numFronts = point.num_of_fronts;
    // front 라인부터 채우는 로직으로 변경 (row별로 front를 모두 채우고 다음 row로)
    const totalPositionIndex = rowIndex * point.num_of_fronts + frontIndex;
    
    const hasPersonHere = totalPositionIndex < queueCount;
    
    return hasPersonHere;
  };

  const renderServicePoints = () => {
    if (!layoutData?._service_point_info || !imageNaturalSize) return null;

    const servicePoints = layoutData._service_point_info;
    const imgInfo = layoutData._img_info;
    
    if (!imgInfo) return null;

    // Get current displayed image size (LayoutSetting 방식과 동일)
    const imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) return null;
    
    // Get the image's original display size (before transform)
    // Since dots are children of the image element, they inherit the transform
    const imgRect = imgElement.getBoundingClientRect();
    const originalDisplayWidth = imgRect.width / zoomLevel;
    const originalDisplayHeight = imgRect.height / zoomLevel;
    const scaleX = originalDisplayWidth / imageNaturalSize.width;
    const scaleY = originalDisplayHeight / imageNaturalSize.height;



    // 서비스 포인트별 색상 정의 (LayoutSetting과 동일)
    const dotColors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
    ];

    const allNodes = Object.keys(servicePoints);
    
    return allNodes.map((node) => {
      const nodeData = servicePoints[node];
      if (!nodeData) return null;
      
      // 좌표를 현재 display size로 변환
      const startX = Number(nodeData.front_start_point_x) * scaleX;
      const startY = Number(nodeData.front_start_point_y) * scaleY;
      const endX = Number(nodeData.front_end_point_x) * scaleX;
      const endY = Number(nodeData.front_end_point_y) * scaleY;
      const numFronts = Number(nodeData.num_of_fronts);
      const numRows = Number(nodeData.num_of_rows);
      
      if (numFronts < 1 || numRows < 1) return null;

      // 방향 벡터 계산
      const directionVectorX = endX - startX;
      const directionVectorY = endY - startY;
      const length = Math.sqrt(directionVectorX * directionVectorX + directionVectorY * directionVectorY);
      
      if (length === 0) return null;
      
      // 정규화된 방향 벡터
      const normalizedDirX = directionVectorX / length;
      const normalizedDirY = directionVectorY / length;
      
      // 법선 벡터 (direction에 따라 위쪽 또는 아래쪽)
      const isForward = nodeData.direction === 'forward';
      const normalX = isForward ? -normalizedDirY : normalizedDirY;
      const normalY = isForward ? normalizedDirX : -normalizedDirX;

      // start-end 사이 거리에서 front 간격을 계산
      const frontSpacing = length / (numFronts - 1);
      const rowSpacing = frontSpacing;

      // Color for each node
      const nodeIdx = allNodes.indexOf(node);
      const dotColor = dotColors[nodeIdx % dotColors.length];

      const points: React.ReactNode[] = [];
      
      // Start/End 포인트 표시 (dotSize에 따라 크기 조절, 최소 크기 보장)
      const markerSize = Math.max(dotSize * 10, 2); // 최소 2px로 원 깨짐 방지
      
              points.push(
          <div
            key={`${node}-start-marker`}
            className="absolute rounded-full"
            style={{
              width: `${markerSize}px`,
              height: `${markerSize}px`,
              left: `${startX - markerSize/2}px`,
              top: `${startY - markerSize/2}px`,
              backgroundColor: 'rgba(239, 68, 68, 0.6)', // 빨간색 투명
              zIndex: 15,
              // 원 깨짐 방지를 위한 CSS 최적화
              borderRadius: '50%',
              minWidth: '2px',
              minHeight: '2px',
              transform: 'translateZ(0)', // 하드웨어 가속
              backfaceVisibility: 'hidden', // 렌더링 최적화
              WebkitFontSmoothing: 'antialiased', // 안티에일리어싱
            }}
            title={`${node} Start Point`}
          />
        );
        
        points.push(
          <div
            key={`${node}-end-marker`}
            className="absolute rounded-full"
            style={{
              width: `${markerSize}px`,
              height: `${markerSize}px`,
              left: `${endX - markerSize/2}px`,
              top: `${endY - markerSize/2}px`,
              backgroundColor: 'rgba(107, 114, 128, 0.6)', // 회색 투명
              zIndex: 15,
              // 원 깨짐 방지를 위한 CSS 최적화
              borderRadius: '50%',
              minWidth: '2px',
              minHeight: '2px',
              transform: 'translateZ(0)', // 하드웨어 가속
              backfaceVisibility: 'hidden', // 렌더링 최적화
              WebkitFontSmoothing: 'antialiased', // 안티에일리어싱
            }}
            title={`${node} End Point`}
          />
        );

      for (let i = 0; i < numFronts; i++) {
        const t = numFronts === 1 ? 0 : i / (numFronts - 1);
        const baseX = startX + t * directionVectorX;
        const baseY = startY + t * directionVectorY;

        for (let j = 0; j < numRows; j++) {
          const offsetDistance = j * rowSpacing;
          const pointX = baseX + normalX * offsetDistance;
          const pointY = baseY + normalY * offsetDistance;

          // 해당 위치에 사람이 있는지 확인
          const isActive = isPersonAtPosition(node, i, j);
          

          
          if (isActive) {
            // All dots same size (LayoutSetting 방식과 동일, 최소 크기 보장으로 원 깨짐 방지)
            const currentDotSize = dotSize;
            const dotSizePx = Math.max(currentDotSize * 10, 2); // 최소 2px로 원 깨짐 방지
            
                          points.push(
                <div
                  key={`dot-${node}-${i}-${j}`}
                  className={`absolute rounded-full shadow-lg ${dotColor}`}
                  style={{
                    width: `${dotSizePx}px`,
                    height: `${dotSizePx}px`,
                    left: `${pointX - dotSizePx/2}px`,
                    top: `${pointY - dotSizePx/2}px`,
                    opacity: '0.9',
                    pointerEvents: 'none',
                    zIndex: 10,
                    boxShadow: dotSizePx >= 4 ? '0 2px 4px rgba(0,0,0,0.3)' : 'none', // 작은 점은 그림자 제거
                    // 원 깨짐 방지를 위한 CSS 최적화
                    borderRadius: '50%',
                    minWidth: '2px',
                    minHeight: '2px',
                    transform: 'translateZ(0)', // 하드웨어 가속
                    backfaceVisibility: 'hidden', // 렌더링 최적화
                    WebkitFontSmoothing: 'antialiased', // 안티에일리어싱
                  }}
                  title={`${node} Front[${i+1}/${numFronts}] Row[${j+1}/${numRows}] - OCCUPIED - (${Math.round(pointX / scaleX)}, ${Math.round(pointY / scaleY)})`}
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
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <div className="mt-2 text-sm text-gray-600">Loading topview data...</div>
            </div>
          </div>
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
  if (!imgInfo || !imageUrl) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-gray-50 p-6">
          <p>No image information available</p>
        </div>
      </div>
    );
  }

  const availableTimes = topViewData ? Object.keys(topViewData).sort() : [];
  
  // 새로운 JSON 구조에서 모든 component의 서비스 포인트 데이터를 합치기
  const currentQueueData = selectedTime && topViewData ? (() => {
    const timeData = topViewData[selectedTime];
    if (!timeData) return {};
    
    const combinedData: {[servicePoint: string]: number} = {};
    // 모든 component의 서비스 포인트를 하나로 합치기
    Object.values(timeData).forEach(componentData => {
      Object.entries(componentData).forEach(([servicePoint, count]) => {
        combinedData[servicePoint] = count;
      });
    });
    
    return combinedData;
  })() : {};

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-gray-50 p-6">
        <h3 className="text-lg font-semibold mb-4">Airport Layout - Real-time Queue Status</h3>
        

        
        {/* Controls (LayoutSetting과 동일한 UI) */}
        {imageUrl && (
          <div className="mt-4 mb-4 space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Map Dot Size:</label>
              <input
                type="range"
                min="0.005"
                max="1"
                step="0.005"
                value={dotSize}
                onChange={(e) => setDotSize(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">{dotSize}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Map View:</label>
              <span className="text-sm text-gray-600">Zoom: {zoomLevel.toFixed(1)}x</span>
              <button
                onClick={resetView}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Reset View
              </button>
            </div>
            <div className="text-xs text-gray-500">
              💡 Mouse wheel: zoom | Drag: pan | Double-click: reset
            </div>
          </div>
        )}

        {/* 이미지와 서비스 포인트 오버레이 (LayoutSetting 방식과 동일) */}
        <div className="mb-6 w-full">
          {imageUrl && (
            <div className="mt-4 relative flex justify-center overflow-auto max-h-96 border rounded-lg">
              <div
                className="inline-block relative"
                onDoubleClick={resetView}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onDragStart={handleDragStart}
                style={{ 
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  userSelect: 'none'
                }}
              >
                <img 
                  src={imageUrl} 
                  alt="Airport Layout" 
                  className="block border rounded-lg shadow" 
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
                {renderServicePoints()}
                
                {mousePosition && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                    Mouse Position: ({mousePosition.x}, {mousePosition.y})
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-2 text-sm text-gray-600">
            Service Points: {Object.entries(layoutData._service_point_info).map(([key, point], index) => {
              const colors = [
                'text-blue-600', 'text-green-600', 'text-purple-600', 
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

        {/* 현재 대기인원 정보 */}
        {availableTimes.length > 0 && (
          <div className="mt-6 mb-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-gray-700">Current Queue:</span>
              {Object.entries(currentQueueData).map(([servicePoint, count]) => {
                // layoutData에서 서비스 포인트의 실제 순서 찾기
                const servicePointKeys = Object.keys(layoutData._service_point_info);
                const servicePointIndex = servicePointKeys.indexOf(servicePoint);
                const backgroundColors = [
                  'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800',
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

        {/* 시간 선택 슬라이더 */}
        {availableTimes.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-4">
              <label htmlFor="time-slider" className="font-medium text-gray-700">
                Select Time:
              </label>
            </div>
            <div className="relative">
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
              
              {/* 인터랙티브 시간 표시 - 슬라이더 점 위치에 따라 움직임 */}
              <div 
                className="absolute -top-8 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg font-mono whitespace-nowrap pointer-events-none"
                style={{
                  left: `calc(2rem + ${(timeIndex / (availableTimes.length - 1)) * (100 - 4)}%)`,
                  zIndex: 10
                }}
              >
                {selectedTime}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-blue-600"></div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              {timeIndex + 1} / {availableTimes.length}
            </div>
          </div>
        )}

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