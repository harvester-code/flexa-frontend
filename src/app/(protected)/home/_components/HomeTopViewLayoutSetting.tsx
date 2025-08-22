'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Slider } from '@/components/ui/Slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import HomeTopViewMap from './HomeTopViewMap';

interface ServicePointData {
  [component: string]: string[];
}

interface HomeTopViewLayoutSettingProps {
  scenario: any;
  data?: ServicePointData;
  isLoading?: boolean;
  viewMode: 'view' | 'setting';
  setViewMode: (mode: 'view' | 'setting') => void;
}

// Dot color array (different for each node)
const dotColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
];

// Array of people emojis with various races, genders, hair, and ages
const peopleEmojis = [
  '🧑',
  '👩',
  '👨',
  '👧',
  '👦',
  '👩‍🦰',
  '👨‍🦱',
  '👩‍🦳',
  '👨‍🦳',
  '🧑‍🦱',
  '🧑‍🦰',
  '🧑‍🦳',
  '🧑‍🦲',
  '👵',
  '👴',
  '👩‍🦲',
  '👨‍🦲',
  '👩‍🦱',
  '👨‍🦱',
  '🧒',
  '👩‍🦰',
  '👨‍🦰',
  '👩‍🦳',
  '👨‍🦳',
];
function getRandomPersonEmoji() {
  const idx = Math.floor(Math.random() * peopleEmojis.length);
  return peopleEmojis[idx];
}

// getSeededPersonEmoji 함수 추가
function getSeededPersonEmoji(rowIdx: number, colIdx: number, node: string, seed: number) {
  let hash = 0;
  for (let i = 0; i < node.length; i++) hash += node.charCodeAt(i);
  // seed를 더해주고, 충분히 섞이도록 곱셈/나눗셈
  const idx = Math.abs(rowIdx * 31 + colIdx * 17 + hash + Math.floor(seed / 1000)) % peopleEmojis.length;
  return peopleEmojis[idx];
}

// 1. SVG viewBox 추출 함수 추가
async function getSvgViewBox(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const svgText = e.target?.result as string;
      const viewBoxMatch = svgText.match(/viewBox=["']([^"']+)["']/);
      if (viewBoxMatch) {
        const [, viewBox] = viewBoxMatch;
        const [, , w, h] = viewBox.split(' ');
        resolve({ width: parseFloat(w), height: parseFloat(h) });
      } else {
        // fallback: width/height 속성
        const widthMatch = svgText.match(/width=["']([^"']+)["']/);
        const heightMatch = svgText.match(/height=["']([^"']+)["']/);
        if (widthMatch && heightMatch) {
          resolve({ width: parseFloat(widthMatch[1]), height: parseFloat(heightMatch[1]) });
        } else {
          reject('SVG viewBox or width/height not found');
        }
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const HomeTopViewLayoutSetting: React.FC<HomeTopViewLayoutSettingProps> = ({
  scenario,
  data,
  isLoading,
  viewMode,
  setViewMode,
}) => {
  // Image upload state
  const [image, setImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  // service_point data from props
  const [servicePoints, setServicePoints] = useState<ServicePointData>({});
  // Tab state
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // Node input state
  const [nodeInputs, setNodeInputs] = useState<{
    [node: string]: {
      front_start_point_x: number | '';
      front_start_point_y: number | '';
      front_end_point_x: number | '';
      front_end_point_y: number | '';
      direction: string;
      num_of_fronts: number | '';
      num_of_rows: number | '';
    };
  }>({});
  // Mouse coordinate state
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  // Coordinate input mode state
  const [selecting, setSelecting] = useState<null | 'front_start' | 'front_end'>(null);
  // Modal state
  const [showModal, setShowModal] = useState(false);
  // Map dot size state
  const [dotSize, setDotSize] = useState<number>(0.5);
  // Zoom and Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  // Image natural size state
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Modal state for file upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Temp state for file upload in modal
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [tempImageFileName, setTempImageFileName] = useState<string | null>(null);
  const [tempImageError, setTempImageError] = useState<string | null>(null);
  const [tempImageNaturalSize, setTempImageNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Modal file input ref
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);

  // 이모지 배열 seed: cols/rows가 바뀔 때마다 갱신
  const [emojiSeed, setEmojiSeed] = useState(Date.now());

  // Initialize servicePoints from props data
  useEffect(() => {
    if (data) {
      setServicePoints(data);
      const firstComponent = Object.keys(data)[0];
      setSelectedComponent(firstComponent);
      setSelectedNode(data[firstComponent]?.[0]);
    }
  }, [data]);

  // layout.json 자동 불러오기 및 적용
  useEffect(() => {
    async function loadLayoutJson() {
      try {
        const res = await fetch('/layout.json');
        if (!res.ok) return; // 파일 없으면 무시
        const json = await res.json();
        // 이미지 경로
        const imgPath = json?._img_info?.img_path;
        if (imgPath) {
          // 이미지 파일 존재 확인
          const imgRes = await fetch(`/${imgPath}`);
          if (!imgRes.ok) {
            setImageError('Image file not found in the maps folder.');
            return;
          }
          setImage(`/${imgPath}`);
          setImageFileName(imgPath.split('/').pop() || imgPath);
          setImageFile(null); // 업로드 파일은 없음
          setImageError(null);
          // 이미지 크기 자동 측정은 HomeTopViewMap에서 처리
        }
        // 좌표/행/열/방향 등 노드 정보
        const spInfo = json?._service_point_info || {};
        setNodeInputs(() => {
          const newInputs: typeof nodeInputs = {};
          Object.entries(spInfo).forEach(([node, values]: [string, any]) => {
            newInputs[node] = {
              front_start_point_x: values.front_start_point_x ?? '',
              front_start_point_y: values.front_start_point_y ?? '',
              front_end_point_x: values.front_end_point_x ?? '',
              front_end_point_y: values.front_end_point_y ?? '',
              direction: values.direction ?? 'forward',
              num_of_fronts: values.num_of_fronts ?? 5,
              num_of_rows: values.num_of_rows ?? 7,
            };
          });
          return newInputs;
        });
      } catch (e) {
        // 파일 없으면 무시
      }
    }
    loadLayoutJson();
  }, []);

  // Initialize input values and set defaults when node is selected
  useEffect(() => {
    if (selectedComponent && selectedNode) {
      setNodeInputs((prev) => {
        if (prev[selectedNode]) return prev;
        return {
          ...prev,
          [selectedNode]: {
            front_start_point_x: '',
            front_start_point_y: '',
            front_end_point_x: '',
            front_end_point_y: '',
            direction: 'forward',
            num_of_fronts: 5,
            num_of_rows: 7,
          },
        };
      });
    }
  }, [selectedComponent, selectedNode]);

  // Global mouse event handlers for proper drag behavior
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !selecting) {
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
  }, [isDragging, dragStart, selecting, panOffset]);

  // 2. 이미지 업로드 핸들러 수정
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageFileName(file.name);
      setImage(URL.createObjectURL(file));
      setImageError(null);

      if (file.type === 'image/svg+xml') {
        try {
          const { width, height } = await getSvgViewBox(file);
          setImageNaturalSize({ width, height });
        } catch (err) {
          setImageError('SVG viewBox를 읽을 수 없습니다.');
        }
      } else {
        const img = new window.Image();
        img.onload = () => {
          setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = URL.createObjectURL(file);
      }
    }
  };

  // Modal file change handler
  const handleModalImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTempImageFile(file);
      setTempImageFileName(file.name);
      setTempImage(URL.createObjectURL(file));
      setTempImageError(null);
      if (file.type === 'image/svg+xml') {
        try {
          const { width, height } = await getSvgViewBox(file);
          setTempImageNaturalSize({ width, height });
        } catch (err) {
          setTempImageError('SVG viewBox를 읽을 수 없습니다.');
        }
      } else {
        const img = new window.Image();
        img.onload = () => {
          setTempImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = URL.createObjectURL(file);
      }
    }
  };

  // Modal apply handler
  const handleModalApply = () => {
    if (!tempImageFile || !tempImageNaturalSize) {
      setTempImageError('이미지 파일을 선택하세요.');
      return;
    }
    setImageFile(tempImageFile);
    setImageFileName(tempImageFileName);
    setImage(tempImage);
    setImageNaturalSize(tempImageNaturalSize);
    setImageError(tempImageError);
    setShowUploadModal(false);
  };

  // Modal close handler (reset temp states)
  const handleModalClose = () => {
    setShowUploadModal(false);
    setTempImageFile(null);
    setTempImage(null);
    setTempImageFileName(null);
    setTempImageError(null);
    setTempImageNaturalSize(null);
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoomLevel * delta, 0.1), 5);
    setZoomLevel(newZoom);
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selecting) return; // Don't pan when in coordinate selection mode
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  // Display coordinates when mouse moves over image
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageNaturalSize) return;

    // Get the image element's actual position after transforms
    const imgElement = document.querySelector('img[alt="Topview Preview"]') as HTMLImageElement;
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

  // Input coordinates when clicking on image
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore click if it was actually a drag
    if (hasMoved) {
      setHasMoved(false);
      return;
    }

    if (!selecting || !selectedNode || !imageNaturalSize) {
      return;
    }

    // Get the image element's actual position after transforms
    // Try both possible alt texts
    let imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) {
      imgElement = document.querySelector('img[alt="Topview Preview"]') as HTMLImageElement;
    }
    if (!imgElement) {
      console.error('Image element not found');
      return;
    }

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

    setNodeInputs((prev) => {
      const nodeData = prev[selectedNode] || {};
      if (selecting === 'front_start') {
        return {
          ...prev,
          [selectedNode]: {
            ...nodeData,
            front_start_point_x: x,
            front_start_point_y: y,
          },
        };
      } else if (selecting === 'front_end') {
        return {
          ...prev,
          [selectedNode]: {
            ...nodeData,
            front_end_point_x: x,
            front_end_point_y: y,
          },
        };
      }
      return prev;
    });
    setSelecting(null);
  };

  // Reset zoom and pan
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setHasMoved(false);
  };

  // Input value change handler
  const handleInputChange = (field: string, value: string | number) => {
    if (!selectedNode) return;
    setNodeInputs((prev) => ({
      ...prev,
      [selectedNode]: {
        ...prev[selectedNode],
        [field]: value,
      },
    }));
  };

  // Increment/decrement handlers for num_of_fronts and num_of_rows
  const handleChangeFronts = (node: string, value: number) => {
    setNodeInputs((prev) => ({
      ...prev,
      [node]: {
        ...prev[node],
        num_of_fronts: Math.max(1, value),
      },
    }));
    setEmojiSeed(Date.now());
  };
  const handleChangeRows = (node: string, value: number) => {
    setNodeInputs((prev) => ({
      ...prev,
      [node]: {
        ...prev[node],
        num_of_rows: Math.max(1, value),
      },
    }));
    setEmojiSeed(Date.now());
  };

  // Render emoji grid (Start/End/Direction on left, visualization with First Row Passengers in center on right)
  const renderEmojiGrid = (node: string) => {
    const nodeData = nodeInputs[node] || {};
    const numFronts = Number(nodeData.num_of_fronts) || 5;
    const numRows = Number(nodeData.num_of_rows) || 7;
    return (
      <div className="grid min-w-[700px] max-w-full grid-cols-2 items-center gap-x-12 gap-y-4">
        {/* 왼쪽: Start/End Point 세로 */}
        <div className="flex flex-col gap-4">
          {/* Start Point */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🚩</span>
            <span className="font-medium">Start Point</span>
            <Input
              type="number"
              placeholder="x"
              value={nodeData.front_start_point_x ?? ''}
              onChange={(e) =>
                handleInputChange('front_start_point_x', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-20"
            />
            <Input
              type="number"
              placeholder="y"
              value={nodeData.front_start_point_y ?? ''}
              onChange={(e) =>
                handleInputChange('front_start_point_y', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-20"
            />
            <Button
              type="button"
              size="icon"
              variant={selecting === 'front_start' ? 'secondary' : 'outline'}
              onClick={() => setSelecting(selecting === 'front_start' ? null : 'front_start')}
              title="Select with mouse"
              className={selecting === 'front_start' ? 'bg-primary text-primary-foreground' : ''}
            >
              <span role="img" aria-label="mouse">
                🖱️
              </span>
            </Button>
          </div>
          {/* End Point */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🏁</span>
            <span className="font-medium">End Point</span>
            <Input
              type="number"
              placeholder="x"
              value={nodeData.front_end_point_x ?? ''}
              onChange={(e) =>
                handleInputChange('front_end_point_x', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-20"
            />
            <Input
              type="number"
              placeholder="y"
              value={nodeData.front_end_point_y ?? ''}
              onChange={(e) =>
                handleInputChange('front_end_point_y', e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-20"
            />
            <Button
              type="button"
              size="icon"
              variant={selecting === 'front_end' ? 'secondary' : 'outline'}
              onClick={() => setSelecting(selecting === 'front_end' ? null : 'front_end')}
              title="Select with mouse"
              className={selecting === 'front_end' ? 'bg-primary text-primary-foreground' : ''}
            >
              <span role="img" aria-label="mouse">
                🖱️
              </span>
            </Button>
          </div>
        </div>
        {/* 오른쪽: Direction, Pax Layout 세로 */}
        <div className="flex h-full flex-col justify-center gap-4">
          {/* Direction */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Direction</span>
            <Button
              type="button"
              variant={nodeData.direction === 'forward' ? 'default' : 'outline'}
              onClick={() => handleInputChange('direction', 'forward')}
            >
              Forward
            </Button>
            <Button
              type="button"
              variant={nodeData.direction === 'backward' ? 'default' : 'outline'}
              onClick={() => handleInputChange('direction', 'backward')}
            >
              Reverse
            </Button>
          </div>
          {/* Pax Layout */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Pax Layout</span>
            <Input
              type="number"
              min={1}
              value={numFronts}
              onChange={(e) => handleChangeFronts(node, Number(e.target.value))}
              className="w-14 text-center"
            />
            <span>cols ×</span>
            <Input
              type="number"
              min={1}
              value={numRows}
              onChange={(e) => handleChangeRows(node, Number(e.target.value))}
              className="w-14 text-center"
            />
            <span>rows</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="btn-link"
                  type="button"
                  className="ml-1 rounded-full p-1 hover:bg-gray-100 focus:outline-none"
                  title="Show layout example"
                >
                  <span className="align-middle text-lg">ⓘ</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                className="z-[201] flex min-w-fit max-w-[90vw] flex-col items-center bg-white p-4"
                style={{ width: 'auto', maxWidth: '90vw' }}
              >
                <div className="flex flex-row items-center">
                  {/* 왼쪽 rows 텍스트 (vertical, 중앙정렬) */}
                  <span
                    className="mr-2 flex items-center justify-center text-sm text-black"
                    style={{
                      writingMode: 'vertical-lr',
                      transform: 'rotate(180deg)',
                      height: `${numRows * 0.8}em`,
                      minWidth: '1.5em',
                    }}
                  >
                    {numRows} rows
                  </span>
                  {/* 이모지 배열 */}
                  <div className="flex flex-col">
                    {Array.from({ length: numRows }).map((_, rowIdx) => (
                      <div key={rowIdx} className="flex flex-row justify-center">
                        {Array.from({ length: numFronts }).map((_, colIdx) => (
                          <span key={colIdx} style={{ fontSize: '0.8em', lineHeight: 1 }}>
                            {getSeededPersonEmoji(rowIdx, colIdx, node, emojiSeed)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {/* 하단 rows 텍스트 */}
                <span className="mt-2 text-sm text-black">{numFronts} cols</span>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  };

  // Render colored dot array on map (only when both front_start and front_end are filled)
  const renderAllNodeDots = () => {
    if (!image || !imageNaturalSize) {
      return null;
    }

    // Get current displayed image size
    // Try both possible alt texts
    let imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) {
      imgElement = document.querySelector('img[alt="Topview Preview"]') as HTMLImageElement;
    }
    if (!imgElement) {
      return null;
    }

    // Get the image's original display size (before transform)
    // Since dots are children of the image element, they inherit the transform
    const imgRect = imgElement.getBoundingClientRect();
    const originalDisplayWidth = imgRect.width / zoomLevel;
    const originalDisplayHeight = imgRect.height / zoomLevel;
    const scaleX = originalDisplayWidth / imageNaturalSize.width;
    const scaleY = originalDisplayHeight / imageNaturalSize.height;

    const allNodes = Object.values(servicePoints).flat();

    return allNodes.map((node) => {
      const nodeData = nodeInputs[node];
      if (!nodeData) {
        return null;
      }

      // Check if both front_start and front_end values are filled
      const requiredFields = [
        'front_start_point_x',
        'front_start_point_y',
        'front_end_point_x',
        'front_end_point_y',
        'direction',
        'num_of_fronts',
        'num_of_rows',
      ];

      const hasAllFields = requiredFields.every(
        (f) => nodeData[f] !== '' && nodeData[f] !== undefined && nodeData[f] !== null
      );
      if (!hasAllFields) {
        return null;
      }

      // Convert coordinates from actual image size to current display size
      const startX = Number(nodeData.front_start_point_x) * scaleX;
      const startY = Number(nodeData.front_start_point_y) * scaleY;
      const endX = Number(nodeData.front_end_point_x) * scaleX;
      const endY = Number(nodeData.front_end_point_y) * scaleY;
      const numFronts = Number(nodeData.num_of_fronts);
      const numRows = Number(nodeData.num_of_rows);

      if (numFronts < 1 || numRows < 1) return null;

      const directionVectorX = endX - startX;
      const directionVectorY = endY - startY;
      const length = Math.sqrt(directionVectorX * directionVectorX + directionVectorY * directionVectorY);
      if (length === 0) return null;

      const normalizedDirX = directionVectorX / length;
      const normalizedDirY = directionVectorY / length;
      const isForward = nodeData.direction === 'forward';
      const normalX = isForward ? -normalizedDirY : normalizedDirY;
      const normalY = isForward ? normalizedDirX : -normalizedDirX;
      const frontSpacing = length / (numFronts - 1);
      const rowSpacing = frontSpacing;

      // Color for each node
      const allNodesFlat = Object.values(servicePoints).flat();
      const nodeIdx = allNodesFlat.indexOf(node);
      const dotColor = dotColors[nodeIdx % dotColors.length];
      const isSelected = node === selectedNode;
      const dots: React.ReactElement[] = [];

      for (let i = 0; i < numFronts; i++) {
        const t = numFronts === 1 ? 0 : i / (numFronts - 1);
        const baseX = startX + t * directionVectorX;
        const baseY = startY + t * directionVectorY;

        for (let j = 0; j < numRows; j++) {
          const offsetDistance = j * rowSpacing;
          const pointX = baseX + normalX * offsetDistance;
          const pointY = baseY + normalY * offsetDistance;

          // Distinguish Start and End points
          const isStartPoint = i === 0 && j === 0; // front_start position
          const isEndPoint = i === numFronts - 1 && j === 0; // front_end position (same front line)

          let backgroundColor, opacity, zIndex;

          if (isStartPoint) {
            // Start: light red color
            backgroundColor = 'rgba(239, 68, 68, 0.6)'; // light red color
            opacity = '0.8';
            zIndex = 3;
          } else if (isEndPoint) {
            // End: gray color
            backgroundColor = 'rgba(107, 114, 128, 0.8)'; // gray color
            opacity = '0.9';
            zIndex = 3;
          } else {
            // Regular dots
            backgroundColor = ''; // Handled by CSS class
            opacity = '0.9';
            zIndex = 1;
          }

          // All dots same size (최소 크기 보장으로 원 깨짐 방지)
          const currentDotSize = dotSize;
          const dotSizePx = Math.max(currentDotSize * 10, 2); // 최소 2px로 원 깨짐 방지

          dots.push(
            <div
              key={`dot-${node}-${i}-${j}`}
              className={`absolute rounded-full ${dotSizePx >= 4 ? 'shadow' : ''} ${!isStartPoint && !isEndPoint ? dotColor : ''}`}
              style={{
                width: `${dotSizePx}px`,
                height: `${dotSizePx}px`,
                left: `${pointX - dotSizePx / 2}px`,
                top: `${pointY - dotSizePx / 2}px`,
                backgroundColor: backgroundColor || undefined,
                opacity,
                pointerEvents: 'none',
                zIndex,
                // 원 깨짐 방지를 위한 CSS 최적화
                borderRadius: '50%',
                minWidth: '2px',
                minHeight: '2px',
                transform: 'translateZ(0)', // 하드웨어 가속
                backfaceVisibility: 'hidden', // 렌더링 최적화
                WebkitFontSmoothing: 'antialiased', // 안티에일리어싱
                boxShadow: dotSizePx >= 4 ? '0 1px 3px rgba(0,0,0,0.2)' : 'none', // 작은 점은 그림자 제거
              }}
              title={`${node} ${isStartPoint ? '(START)' : isEndPoint ? '(END)' : ''} (${Math.round(pointX / scaleX)}, ${Math.round(pointY / scaleY)})`}
            />
          );
        }
      }

      return dots;
    });
  };

  // Helper function to generate and download JSON
  const generateAndDownloadJSON = (imgInfo: { img_path: string; W?: number; H?: number } | undefined) => {
    // layout.json 포맷 생성
    const layoutJson = {
      _img_info: imgInfo || {},
      _service_point_info: Object.entries(nodeInputs).reduce((acc, [node, values]) => {
        // 컴포넌트명 찾기
        let componentName = '';
        for (const [comp, nodes] of Object.entries(servicePoints)) {
          if (nodes.includes(node)) componentName = comp;
        }
        acc[node] = {
          component_name: componentName || '',
          node_name: node,
          front_start_point_x: values.front_start_point_x === '' ? 0 : values.front_start_point_x,
          front_start_point_y: values.front_start_point_y === '' ? 0 : values.front_start_point_y,
          front_end_point_x: values.front_end_point_x === '' ? 0 : values.front_end_point_x,
          front_end_point_y: values.front_end_point_y === '' ? 0 : values.front_end_point_y,
          direction: values.direction || 'forward',
          num_of_fronts: values.num_of_fronts === '' ? 0 : values.num_of_fronts,
          num_of_rows: values.num_of_rows === '' ? 0 : values.num_of_rows,
        };
        return acc;
      }, {} as any),
    };

    // JSON 파일 다운로드
    const blob = new Blob([JSON.stringify(layoutJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate and download layout.json when Apply button is clicked
  const handleApply = () => {
    // Check if all required values of all nodes are filled
    const allNodes = Object.values(servicePoints).flat();
    const requiredFields = [
      'front_start_point_x',
      'front_start_point_y',
      'front_end_point_x',
      'front_end_point_y',
      'direction',
      'num_of_fronts',
      'num_of_rows',
    ];
    const hasEmpty = allNodes.some((node) => {
      const nodeData = nodeInputs[node];
      if (!nodeData) return true;
      return !requiredFields.every((f) => nodeData[f] !== '' && nodeData[f] !== undefined && nodeData[f] !== null);
    });
    if (hasEmpty) {
      setShowModal(true);
      return;
    }
    // 이미지 정보 - 파일명(경로)로 저장
    let imgInfo: { img_path: string } | undefined = undefined;
    if (imageFile) {
      imgInfo = {
        img_path: `maps/${imageFile.name}`,
      };
      generateAndDownloadJSON(imgInfo);
      return;
    }
    // 이미지가 없는 경우 바로 JSON 생성
    generateAndDownloadJSON(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="mt-[14px] rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as 'view' | 'setting')}>
            <TabsList>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="setting">Setting</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button type="button" variant="outline" onClick={() => setShowUploadModal(true)}>
            {image ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>
        {/* 기존 카드 내부 내용 시작 */}
        {/* Image Uploader */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <div className="mb-6">
            {/* Top View Image 텍스트와 버튼 라인 삭제 */}
            {/* Error Display */}
            {imageError && (
              <div className="bg-red-50 border-red-200 mt-4 rounded-lg border p-3">
                <p className="text-red-600 text-sm">{imageError}</p>
              </div>
            )}
            {/* Controls, Map, etc. (기존 코드 유지) */}
            {image && !imageError && (
              <>
                <HomeTopViewMap
                  imageFile={imageFile}
                  imageUrl={image}
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
                  renderServicePoints={renderAllNodeDots}
                  mousePosition={mousePosition}
                  setMousePosition={setMousePosition}
                  resetView={resetView}
                  onImageClick={handleImageClick}
                  selecting={selecting !== null}
                />
                {selecting && (
                  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-sm font-medium text-yellow-800">
                      🎯 Coordinate selection mode: {selecting === 'front_start' ? 'start point' : 'end point'} in the
                      image.
                    </p>
                  </div>
                )}
              </>
            )}
            {/* Upload Modal */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                  <DialogDescription>Please upload a topview image for the service point map.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <Button type="button" variant="outline" onClick={() => modalFileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleModalImageChange}
                    className="hidden"
                  />
                  <span className="w-full text-center text-sm text-muted-foreground">
                    {tempImageFileName || 'No file selected'}
                  </span>
                  {tempImageError && (
                    <div className="bg-red-50 border-red-200 rounded-lg border p-2">
                      <p className="text-red-600 text-sm">{tempImageError}</p>
                    </div>
                  )}
                  {tempImage && (
                    <img src={tempImage} alt="Preview" className="max-h-60 w-full rounded border object-contain" />
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" onClick={handleModalClose}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleModalApply} disabled={!tempImageFile || !tempImageNaturalSize}>
                    Apply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {/* Component/Node Tab UI + Settings 폼을 한 줄에 배치 */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <div className="mb-6 flex flex-col items-stretch gap-4 md:flex-row">
            {/* 왼쪽: 탭 네비게이션 */}
            <div className="w-full flex-shrink-0 md:w-1/3">
              <div className="h-full">
                <Tabs
                  defaultValue={selectedComponent || ''}
                  value={selectedComponent || ''}
                  onValueChange={(val) => {
                    setSelectedComponent(val);
                    setSelectedNode(servicePoints[val][0]);
                  }}
                  className="w-full"
                >
                  {/* 1 depth TabsList (check_in, passport 등) */}
                  <TabsList className={`mb-4 grid w-full grid-cols-${Object.keys(servicePoints).length} gap-2`}>
                    {Object.keys(servicePoints).map((component) => (
                      <TabsTrigger key={component} value={component} className="w-full">
                        {component}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.keys(servicePoints).map((component) => (
                    <TabsContent key={component} value={component} className="w-full">
                      <Tabs
                        defaultValue={selectedNode || ''}
                        value={selectedNode || ''}
                        onValueChange={setSelectedNode}
                        className="w-full"
                      >
                        {/* 2 depth TabsList (A,B,C,D 등) */}
                        <TabsList className="mb-4 flex gap-2">
                          {servicePoints[component].map((node) => (
                            <TabsTrigger key={node} value={node}>
                              {node}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>
            {/* 오른쪽: Settings 폼 */}
            <div className="w-full flex-1 md:w-2/3">
              {selectedComponent && selectedNode && (
                <div className="flex h-full flex-col rounded-lg border bg-white p-6">
                  {renderEmojiGrid(selectedNode)}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Apply Button */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button className="px-6 py-2 font-semibold" onClick={handleApply}>
              Apply
            </Button>
          </div>
        )}
        {/* Modal */}
        <AlertDialog open={showModal} onOpenChange={setShowModal}>
          <AlertDialogContent>
            <AlertDialogTitle>Missing Input Values</AlertDialogTitle>
            <AlertDialogDescription>Please fill in all empty fields.</AlertDialogDescription>
            <AlertDialogAction onClick={() => setShowModal(false)}>OK</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
        {/* 기존 카드 내부 내용 끝 */}
      </div>
    </div>
  );
};

export default HomeTopViewLayoutSetting;
