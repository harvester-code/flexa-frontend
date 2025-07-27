'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Slider } from '@/components/ui/Slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import HomeTopViewLayoutSetting from './HomeTopViewLayoutSetting';
import HomeTopViewMap from './HomeTopViewMap';

interface LayoutData {
  _img_info: {
    img_path: string; // 이미지 파일 경로
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
  isLoading?: boolean;
  scenario: any;
  data?: { [key: string]: { [componentName: string]: { [servicePoint: string]: number } } };
  viewMode: 'view' | 'setting';
  setViewMode: (mode: 'view' | 'setting') => void;
}

function HomeTopView({ scenario, data, isLoading, viewMode, setViewMode }: HomeTopViewProps) {
  const [layoutData, setLayoutData] = useState<LayoutData | null>(null);
  const [topViewData, setTopViewData] = useState<{
    [key: string]: { [componentName: string]: { [servicePoint: string]: number } };
  } | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dotSize, setDotSize] = useState<number>(0.5);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [showLayoutWarning, setShowLayoutWarning] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  // 모든 useEffect 등 Hook 호출
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
        const timeWithQueue = times.find((time) => {
          const timeData = topViewData[time];
          return Object.values(timeData).some((component) => {
            if (typeof component === 'object' && component !== null) {
              return Object.values(component as Record<string, number>).some((count) => count > 0);
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
        // layout.json fetch
        const layoutResponse = await fetch('/layout.json');

        if (!layoutResponse.ok) {
          throw new Error('Failed to fetch layout.json');
        }

        const layoutData = await layoutResponse.json();
        setLayoutData(layoutData);

        // 이미지 URL 설정
        if (layoutData._img_info?.img_path) {
          setImageUrl(`/${layoutData._img_info.img_path}`);
          // imageNaturalSize는 HomeTopViewMap에서 자동 측정
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchLayoutData();
  }, []);

  // 이미지 natural size와 frameSize가 세팅될 때 프레임에 fit되도록 zoom/pan 자동 계산
  useEffect(() => {
    if (imageNaturalSize && frameSize.width && frameSize.height) {
      const scaleX = frameSize.width / imageNaturalSize.width;
      const scaleY = frameSize.height / imageNaturalSize.height;
      const initialZoom = Math.min(scaleX, scaleY, 1);
      setZoomLevel(initialZoom);

      const offsetX = (frameSize.width - imageNaturalSize.width * initialZoom) / 2;
      const offsetY = (frameSize.height - imageNaturalSize.height * initialZoom) / 2;
      setPanOffset({ x: offsetX, y: offsetY });
    }
  }, [imageNaturalSize, frameSize]);

  // Global mouse event handlers for proper drag behavior (LayoutSetting과 동일)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newPanOffset = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };

        // Check if there's actual movement (more than 3 pixels)
        const moveDistance = Math.sqrt(
          Math.pow(newPanOffset.x - panOffset.x, 2) + Math.pow(newPanOffset.y - panOffset.y, 2)
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

  // 색상 매핑 통일: dot과 text를 함께 관리
  const servicePointColors = [
    { dot: 'bg-blue-500', text: 'bg-blue-100 text-blue-800' },
    { dot: 'bg-green-500', text: 'bg-green-100 text-green-800' },
    { dot: 'bg-purple-500', text: 'bg-purple-100 text-purple-800' },
    { dot: 'bg-yellow-500', text: 'bg-yellow-100 text-yellow-800' },
    { dot: 'bg-pink-500', text: 'bg-pink-100 text-pink-800' },
    { dot: 'bg-indigo-500', text: 'bg-indigo-100 text-indigo-800' },
    { dot: 'bg-orange-500', text: 'bg-orange-100 text-orange-800' },
  ];

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

    // 서비스 포인트별 색상 정의 (servicePointColors 사용)
    const allNodes = Object.keys(servicePoints);
    const allPoints: React.ReactNode[] = [];
    allNodes.forEach((node) => {
      const nodeData = servicePoints[node];
      if (!nodeData) return;

      // 좌표를 현재 display size로 변환
      const startX = Number(nodeData.front_start_point_x) * scaleX;
      const startY = Number(nodeData.front_start_point_y) * scaleY;
      const endX = Number(nodeData.front_end_point_x) * scaleX;
      const endY = Number(nodeData.front_end_point_y) * scaleY;
      const numFronts = Number(nodeData.num_of_fronts);
      const numRows = Number(nodeData.num_of_rows);

      if (numFronts < 1 || numRows < 1) return;

      // 방향 벡터 계산
      const directionVectorX = endX - startX;
      const directionVectorY = endY - startY;
      const length = Math.sqrt(directionVectorX * directionVectorX + directionVectorY * directionVectorY);

      if (length === 0) return;

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
      const dotColor = servicePointColors[nodeIdx % servicePointColors.length].dot;

      // Start/End 포인트 표시 (dotSize에 따라 크기 조절, 최소 크기 보장)
      const markerSize = Math.max(dotSize * 10, 2); // 최소 2px로 원 깨짐 방지

      allPoints.push(
        (
          <div
            key={`${node}-start-marker`}
            className={`absolute rounded-full`}
            style={{
              width: `${markerSize}px`,
              height: `${markerSize}px`,
              left: `${startX - markerSize / 2}px`,
              top: `${startY - markerSize / 2}px`,
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
        ) as React.ReactNode
      );

      allPoints.push(
        (
          <div
            key={`${node}-end-marker`}
            className={`absolute rounded-full`}
            style={{
              width: `${markerSize}px`,
              height: `${markerSize}px`,
              left: `${endX - markerSize / 2}px`,
              top: `${endY - markerSize / 2}px`,
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
        ) as React.ReactNode
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
            // 이미지 표시 크기 기준으로 dot 좌표 변환
            const scaleX = imgElement.clientWidth / imageNaturalSize.width;
            const scaleY = imgElement.clientHeight / imageNaturalSize.height;
            const displayX = pointX * scaleX;
            const displayY = pointY * scaleY;

            allPoints.push(
              (
                <div
                  key={`dot-${node}-${i}-${j}`}
                  className={`absolute ${dotColor}`}
                  style={{
                    width: '24px',
                    height: '24px',
                    left: `${displayX - 12}px`,
                    top: `${displayY - 12}px`,
                    opacity: 1,
                    zIndex: 100,
                    border: '2px solid yellow',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                  title={`${node} Front[${i + 1}/${numFronts}] Row[${j + 1}/${numRows}] - OCCUPIED`}
                />
              ) as React.ReactNode
            );
          }
        }
      }
    });
    return allPoints;
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const wheelBlocker = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    frame.addEventListener('wheel', wheelBlocker, { passive: false });
    return () => {
      frame.removeEventListener('wheel', wheelBlocker);
    };
  }, []);

  // 데이터 가공, 변수 선언
  const currentQueueData =
    selectedTime && topViewData
      ? (() => {
          const timeData = topViewData[selectedTime];
          if (!timeData) return {};
          const combinedData: { [servicePoint: string]: number } = {};
          Object.values(timeData).forEach((componentData) => {
            Object.entries(componentData).forEach(([servicePoint, count]) => {
              combinedData[servicePoint] = count;
            });
          });
          return combinedData;
        })()
      : {};
  const imgInfo = layoutData?._img_info;
  const availableTimes = topViewData ? Object.keys(topViewData).sort() : [];
  const servicePointKeys =
    layoutData && layoutData._service_point_info ? Object.keys(layoutData._service_point_info) : [];
  const currentQueueKeys = Object.keys(currentQueueData);
  const hasMismatch = currentQueueKeys.some((key) => !servicePointKeys.includes(key));

  useEffect(() => {
    if (hasMismatch && viewMode === 'view') {
      setShowLayoutWarning(true);
    }
  }, [hasMismatch, viewMode]);

  // 조건부 return(모달)은 모든 Hook 호출 이후에 위치
  if (hasMismatch && viewMode === 'view') {
    return (
      <div className="space-y-6">
        <div className="mt-[14px] flex min-h-[300px] flex-col items-center justify-center rounded-lg border bg-white p-6">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-4 py-5 text-center text-base font-medium text-gray-800">
              <span>To see the Top View, complete the Layout setting.</span>
              <button
                className="rounded-lg border border-violet-600 bg-white px-6 py-2 font-semibold text-violet-600 transition hover:bg-violet-50"
                onClick={() => setViewMode('setting')}
              >
                Go to Setting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setting 모드일 때 HomeTopViewLayoutSetting 컴포넌트 렌더링
  if (viewMode === 'setting') {
    // layout.json에서 service point 구조를 추출하여 ServicePointData 형태로 변환
    const servicePointData: { [component: string]: string[] } = {};
    if (layoutData?._service_point_info) {
      Object.entries(layoutData._service_point_info).forEach(([nodeName, nodeInfo]: [string, any]) => {
        const componentName = nodeInfo.component_name;
        if (componentName) {
          if (!servicePointData[componentName]) {
            servicePointData[componentName] = [];
          }
          servicePointData[componentName].push(nodeName);
        }
      });
    }

    return (
      <HomeTopViewLayoutSetting
        scenario={scenario}
        data={servicePointData}
        isLoading={isLoading}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    );
  }

  if (!imgInfo || !imageUrl || !layoutData) {
    return (
      <div className="space-y-6">
        <div className="mt-[14px] rounded-lg border bg-gray-50 p-6">
          <p>No image information available</p>
        </div>
      </div>
    );
  }

  // 슬라이더 스타일: primary color(#7C3AED) bar, 흰색 thumb
  const sliderStyle = `
  input[type=range].slider {
    accent-color: #7C3AED;
  }
  input[type=range].slider::-webkit-slider-thumb {
    background: #fff;
    border: 2px solid #7C3AED;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: background 0.2s;
  }
  input[type=range].slider::-moz-range-thumb {
    background: #fff;
    border: 2px solid #7C3AED;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: background 0.2s;
  }
  input[type=range].slider::-ms-thumb {
    background: #fff;
    border: 2px solid #7C3AED;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: background 0.2s;
  }
  input[type=range].slider::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #7C3AED 0%, #7C3AED VAR_PCT%, #E5E7EB VAR_PCT%, #E5E7EB 100%);
  }
  input[type=range].slider::-ms-fill-lower {
    background: #7C3AED;
  }
  input[type=range].slider::-ms-fill-upper {
    background: #E5E7EB;
  }
  input[type=range].slider:focus {
    outline: none;
  }
`;

  // 렌더링 부분 리팩터링 시작
  return (
    <div className="space-y-6">
      <div className="mt-[14px] rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center">
          <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'view' | 'setting')}>
            <TabsList>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="setting">Setting</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Controls (LayoutSetting과 동일한 UI) */}
        {viewMode === 'view' && imageUrl && layoutData && (
          <HomeTopViewMap
            imageFile={null}
            imageUrl={imageUrl}
            dotSize={dotSize}
            setDotSize={setDotSize}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            dragStart={dragStart}
            setDragStart={setDragStart}
            hasMoved={hasMoved}
            setHasMoved={setHasMoved}
            imageNaturalSize={imageNaturalSize}
            setImageNaturalSize={setImageNaturalSize}
            renderServicePoints={renderServicePoints}
            mousePosition={mousePosition}
            setMousePosition={setMousePosition}
            resetView={resetView}
          />
        )}
        {/* 나머지 컨트롤, 슬라이더, JSON 데이터 등은 HomeTopView에서 관리 */}
        {/* 시간 선택 슬라이더 */}
        {availableTimes.length > 0 && (
          <div className="mb-4 space-y-3">
            <div
              className="mt-2 block w-full text-sm"
              style={{ height: '40px', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              <span className="font-medium text-gray-700">Current Queue:</span>
              {Object.entries(currentQueueData).length > 0 ? (
                Object.entries(currentQueueData).map(([servicePoint, count]) => {
                  const servicePointKeys = Object.keys(layoutData._service_point_info);
                  const servicePointIndex = servicePointKeys.indexOf(servicePoint);
                  const colorClass = servicePointColors[servicePointIndex % servicePointColors.length]?.text;
                  return (
                    <span key={servicePoint} className={`${colorClass} rounded px-2 py-1 font-medium`}>
                      {servicePoint}: {count} pax
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
            <div className="relative flex w-full items-center gap-2">
              <span className="min-w-[90px] text-left text-xs text-gray-500">{availableTimes[0]}</span>

              <div className="relative flex-1">
                <Slider
                  min={0}
                  max={availableTimes.length - 1}
                  step={1}
                  value={[timeIndex]}
                  onValueChange={([val]) => {
                    setTimeIndex(val);
                    setSelectedTime(availableTimes[val]);
                  }}
                  className="w-full"
                />

                {/* shadcn/ui Tooltip: thumb 위에 항상 표시 */}
                {/* <Tooltip open>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute left-0 h-0 w-0"
                      style={{
                        top: '20px', // thumb 바로 아래로 위치
                        left: `calc(${(timeIndex / (availableTimes.length - 1)) * 100}% )`,
                        pointerEvents: 'none',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="center" sideOffset={6}>
                    {selectedTime}
                  </TooltipContent>
                </Tooltip> */}
              </div>

              <span className="min-w-[90px] text-right text-xs text-gray-500">
                {availableTimes[availableTimes.length - 1]}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomeTopView;
