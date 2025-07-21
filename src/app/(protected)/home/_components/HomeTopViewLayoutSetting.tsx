"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction } from '@/components/ui/AlertDialog';
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
  '🧑', '👩', '👨', '👧', '👦', '👩‍🦰', '👨‍🦱', '👩‍🦳', '👨‍🦳',
  '🧑‍🦱', '🧑‍🦰', '🧑‍🦳', '🧑‍🦲', '👵', '👴', '👩‍🦲', '👨‍🦲',
  '👩‍🦱', '👨‍🦱', '🧒', '👩‍🦰', '👨‍🦰', '👩‍🦳', '👨‍🦳',
];
function getRandomPersonEmoji() {
  const idx = Math.floor(Math.random() * peopleEmojis.length);
  return peopleEmojis[idx];
}

// 1. SVG viewBox 추출 함수 추가
async function getSvgViewBox(file: File): Promise<{width: number, height: number}> {
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

const HomeTopViewLayoutSetting: React.FC<HomeTopViewLayoutSettingProps> = ({ scenario, data, isLoading, viewMode, setViewMode }) => {
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
  const [imageNaturalSize, setImageNaturalSize] = useState<{width: number; height: number} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize servicePoints from props data
  useEffect(() => {
    if (data) {
      setServicePoints(data);
      const firstComponent = Object.keys(data)[0];
      setSelectedComponent(firstComponent);
      setSelectedNode(data[firstComponent]?.[0]);
    }
  }, [data]);



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
      console.log('Click ignored:', { selecting, selectedNode, imageNaturalSize });
      return;
    }
    
    console.log('Image click detected:', selecting, selectedNode);
    
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
    
    console.log('Coordinates calculated:', { x, y, imageNaturalSize, imgRect });
    
    setNodeInputs((prev) => {
      const nodeData = prev[selectedNode] || {};
      if (selecting === 'front_start') {
        console.log('Setting front_start:', { x, y });
        return {
          ...prev,
          [selectedNode]: {
            ...nodeData,
            front_start_point_x: x,
            front_start_point_y: y,
          },
        };
      } else if (selecting === 'front_end') {
        console.log('Setting front_end:', { x, y });
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
  };
  const handleChangeRows = (node: string, value: number) => {
    setNodeInputs((prev) => ({
      ...prev,
      [node]: {
        ...prev[node],
        num_of_rows: Math.max(1, value),
      },
    }));
  };

  // Render emoji grid (Start/End/Direction on left, visualization with First Row Passengers in center on right)
  const renderEmojiGrid = (node: string) => {
    const nodeData = nodeInputs[node] || {};
    const numFronts = Number(nodeData.num_of_fronts) || 5;
    const numRows = Number(nodeData.num_of_rows) || 7;
    return (
      <div className="flex flex-row items-start justify-center gap-8 mt-4 w-full">
        {/* Input Form (Left) */}
        <div className="flex flex-col gap-3 min-w-[220px] max-w-[320px] mt-32">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold mr-1 min-w-[60px] flex items-center gap-1">
              🚩 Start
            </span>
            <Input type="number" placeholder="x" value={nodeData.front_start_point_x ?? ''} onChange={e => handleInputChange('front_start_point_x', e.target.value === '' ? '' : Number(e.target.value))} className="w-20" />
            <Input type="number" placeholder="y" value={nodeData.front_start_point_y ?? ''} onChange={e => handleInputChange('front_start_point_y', e.target.value === '' ? '' : Number(e.target.value))} className="w-20" />
            <Button 
              type="button" 
              size="icon" 
              variant={selecting === 'front_start' ? 'secondary' : 'outline'} 
              onClick={() => setSelecting(selecting === 'front_start' ? null : 'front_start')} 
              title="Select with mouse"
              className={selecting === 'front_start' ? 'bg-blue-500 text-white' : ''}
            >
              <span role="img" aria-label="mouse">🖱️</span>
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold mr-1 min-w-[60px] flex items-center gap-1">
              🏁 End
            </span>
            <Input type="number" placeholder="x" value={nodeData.front_end_point_x ?? ''} onChange={e => handleInputChange('front_end_point_x', e.target.value === '' ? '' : Number(e.target.value))} className="w-20" />
            <Input type="number" placeholder="y" value={nodeData.front_end_point_y ?? ''} onChange={e => handleInputChange('front_end_point_y', e.target.value === '' ? '' : Number(e.target.value))} className="w-20" />
            <Button 
              type="button" 
              size="icon" 
              variant={selecting === 'front_end' ? 'secondary' : 'outline'} 
              onClick={() => setSelecting(selecting === 'front_end' ? null : 'front_end')} 
              title="Select with mouse"
              className={selecting === 'front_end' ? 'bg-blue-500 text-white' : ''}
            >
              <span role="img" aria-label="mouse">🖱️</span>
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold mr-1 min-w-[60px]">Direction</span>
            <select value={nodeData.direction ?? 'forward'} onChange={e => handleInputChange('direction', e.target.value)} className="input input-bordered w-20 rounded border-gray-300">
              <option value="forward">Forward</option>
              <option value="backward">Backward</option>
            </select>
          </div>
        </div>
        
        {/* Visualization (Right) */}
        <div className="flex flex-col items-center gap-4">
          {/* First Row Passengers Input (Top of visualization) */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">First Row Passengers</span>
            <Input 
              type="number" 
              min={1} 
              value={numFronts} 
              onChange={e => handleChangeFronts(node, Number(e.target.value))} 
              className="w-16 h-8 text-center bg-white border-2 border-blue-200 rounded-lg shadow-md font-medium text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all" 
            />
          </div>
          
          {/* Emoji Grid (Bottom) - Fixed Size Container */}
          <div className="relative flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-gray-100">
            {/* Fixed Size Area */}
            <div className="w-80 h-60 flex items-center justify-center relative">
              {/* Row Count Counter (Right Center) */}
              <div className="absolute right-[-4rem] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">Rows</span>
                <Input 
                  type="number" 
                  min={1} 
                  value={numRows} 
                  onChange={e => handleChangeRows(node, Number(e.target.value))} 
                  className="w-16 h-8 text-center bg-white border-2 border-blue-200 rounded-lg shadow-md font-medium text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all" 
                />
              </div>
            
                          {/* Scalable Content Area */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                  {/* Emoji Array */}
                <div 
                  className="flex flex-col transform-gpu" 
                  style={{ 
                    fontFamily: `'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif`,
                    transform: `scale(${Math.min(0.76, 190 / Math.max(numFronts * 20, numRows * 20, 80))})`,
                    transformOrigin: 'center center'
                  }}
                >
                  {(() => {
                    // Fixed size calculation
                    const baseFontSize = 1.2; // Larger base size
                    const fontSize = baseFontSize;
                    
                    // Display as dots when total people exceeds 100
                    const totalPeople = numFronts * numRows;
                    const useRectangle = totalPeople > 100;
                    
                                          if (useRectangle) {
                        // Display as blue dots (over 100 people)
                      const dotSpacing = 1.5;
                      const rowHeight = dotSpacing;
                      
                      return Array.from({ length: numRows }).map((_, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="flex justify-center"
                          style={{ minHeight: `${rowHeight}rem`, alignItems: 'center', gap: '0.3rem' }}
                        >
                          {Array.from({ length: numFronts }).map((_, colIdx) => {
                            if (rowIdx === 0 && colIdx === 0) {
                              // front_start position (hot pink dot)
                              return (
                                <div 
                                  key={colIdx} 
                                  className="w-3 h-3 bg-pink-500 rounded-full" 
                                  title="Start"
                                />
                              );
                            } else if (rowIdx === 0 && colIdx === numFronts - 1) {
                              // front_end position (gray dot)
                              return (
                                <div 
                                  key={colIdx} 
                                  className="w-3 h-3 bg-gray-500 rounded-full" 
                                  title="End"
                                />
                              );
                            } else {
                              // Regular dot (blue)
                              return (
                                <div 
                                  key={colIdx} 
                                  className="w-2 h-2 bg-blue-500 rounded-full" 
                                />
                              );
                            }
                          })}
                        </div>
                      ));
                                          } else {
                        // Display as emojis (100 people or less)
                      const baseRowHeight = 1.5;
                      const rowHeight = baseRowHeight;
                      
                      return Array.from({ length: numRows }).map((_, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="flex justify-center"
                          style={{ minHeight: `${rowHeight}rem`, alignItems: 'center', gap: '0.1rem' }}
                        >
                          {Array.from({ length: numFronts }).map((_, colIdx) => {
                            if (rowIdx === 0 && colIdx === 0) {
                              // front_start position (front line start)
                              return <span key={colIdx} style={{ fontSize: `${fontSize}rem`, lineHeight: 1, display: 'inline-block' }} title="Start">🚩</span>;
                            } else if (rowIdx === 0 && colIdx === numFronts - 1) {
                              // front_end position (front line end)
                              return <span key={colIdx} style={{ fontSize: `${fontSize}rem`, lineHeight: 1, display: 'inline-block' }} title="End">🏁</span>;
                            } else {
                              return <span key={colIdx} style={{ fontSize: `${fontSize}rem`, lineHeight: 1, display: 'inline-block' }}>{getRandomPersonEmoji()}</span>;
                            }
                          })}
                        </div>
                      ));
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render colored dot array on map (only when both front_start and front_end are filled)
  const renderAllNodeDots = () => {
    if (!image || !imageNaturalSize) {
      console.log('renderAllNodeDots: Missing image or imageNaturalSize');
      return null;
    }
    
    // Get current displayed image size
    // Try both possible alt texts
    let imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) {
      imgElement = document.querySelector('img[alt="Topview Preview"]') as HTMLImageElement;
    }
    if (!imgElement) {
      console.log('renderAllNodeDots: Image element not found');
      return null;
    }
    
    // Get the image's original display size (before transform)
    // Since dots are children of the image element, they inherit the transform
    const imgRect = imgElement.getBoundingClientRect();
    const originalDisplayWidth = imgRect.width / zoomLevel;
    const originalDisplayHeight = imgRect.height / zoomLevel;
    const scaleX = originalDisplayWidth / imageNaturalSize.width;
    const scaleY = originalDisplayHeight / imageNaturalSize.height;
    
    console.log('renderAllNodeDots: Scale factors:', { scaleX, scaleY, zoomLevel, imageNaturalSize });
    
    const allNodes = Object.values(servicePoints).flat();
    console.log('renderAllNodeDots: All nodes:', allNodes);
    
    return allNodes.map((node) => {
      const nodeData = nodeInputs[node];
      if (!nodeData) {
        console.log(`renderAllNodeDots: No data for node ${node}`);
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
      
      const hasAllFields = requiredFields.every((f) => nodeData[f] !== '' && nodeData[f] !== undefined && nodeData[f] !== null);
      if (!hasAllFields) {
        console.log(`renderAllNodeDots: Missing fields for node ${node}:`, nodeData);
        return null;
      }
      
      console.log(`renderAllNodeDots: Rendering dots for node ${node}:`, nodeData);
      
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
                left: `${pointX - dotSizePx/2}px`,
                top: `${pointY - dotSizePx/2}px`,
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
      
      console.log(`renderAllNodeDots: Created ${dots.length} dots for node ${node}`);
      return dots;
    });
  };

  // Helper function to generate and download JSON
  const generateAndDownloadJSON = (imgInfo: { img_path: string; W: number; H: number } | undefined) => {
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
    let imgInfo: { img_path: string; W: number; H: number } | undefined = undefined;
    if (imageFile && imageNaturalSize) {
      imgInfo = {
        img_path: imageFile.name, // 파일명만 저장 (필요시 경로 조합 가능)
        W: imageNaturalSize.width,
        H: imageNaturalSize.height,
      };
      generateAndDownloadJSON(imgInfo);
      return;
    }
    // 이미지가 없는 경우 바로 JSON 생성
    generateAndDownloadJSON(undefined);
  };



  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 mt-[14px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Setting</h3>
          <Tabs value={viewMode} onValueChange={val => setViewMode(val as 'view' | 'setting')}>
            <TabsList>
              <TabsTrigger value="view">View</TabsTrigger>
              <TabsTrigger value="setting">Setting</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {/* 기존 카드 내부 내용 시작 */}
        {/* Image Uploader */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <div className="mb-6">
            <label className="block font-semibold mb-2">Upload Topview Image</label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                파일 선택
              </Button>
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {imageFileName || '선택된 파일 없음'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {/* Error Display */}
            {imageError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{imageError}</p>
              </div>
            )}
            
            {/* Debug Info */}
            {image && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <p><strong>디버그 정보:</strong></p>
                <p>이미지 URL: {image.substring(0, 50)}...</p>
                <p>파일 타입: {imageFile?.type}</p>
                <p>파일명: {imageFileName}</p>
                <p>이미지 크기: {imageNaturalSize ? `${imageNaturalSize.width}×${imageNaturalSize.height}` : '로딩 중...'}</p>
                <p>선택 모드: {selecting || '없음'}</p>
                <p>선택된 노드: {selectedNode || '없음'}</p>
                <p>노드 데이터: {selectedNode ? JSON.stringify(nodeInputs[selectedNode], null, 2) : '없음'}</p>
                <p>모든 노드: {Object.keys(nodeInputs).join(', ')}</p>
              </div>
            )}
            
            {/* Controls */}
            {image && !imageError && (
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
              </div>
            )}
            {image && !imageError && (
              <>
                {selecting && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm font-medium">
                      🎯 좌표 선택 모드: {selecting === 'front_start' ? '시작점' : '끝점'}을 이미지에서 클릭하세요
                    </p>
                  </div>
                )}
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
              </>
            )}
          </div>
        )}
        {/* Component/Node Tab UI */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <Tabs defaultValue={selectedComponent || ''} value={selectedComponent || ''} onValueChange={val => { setSelectedComponent(val); setSelectedNode(servicePoints[val][0]); }} className="w-full">
            <TabsList className="mb-4">
              {Object.keys(servicePoints).map((component) => (
                <TabsTrigger key={component} value={component}>
                  {component}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.keys(servicePoints).map((component) => (
              <TabsContent key={component} value={component} className="w-full">
                <Tabs defaultValue={selectedNode || ''} value={selectedNode || ''} onValueChange={setSelectedNode} className="w-full">
                  <TabsList className="mb-4">
                    {servicePoints[component].map((node) => (
                      <TabsTrigger key={node} value={node}>
                        {node}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {servicePoints[component].map((node) => (
                    <TabsContent key={node} value={node} className="w-full">
                      {/* Input Form */}
                      <div className="space-y-4 p-4 border rounded-lg bg-white">
                        <div className="font-semibold mb-2">{component} - {node} Settings</div>
                        {renderEmojiGrid(node)}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>
        )}
        {/* Apply Button */}
        {!isLoading && Object.keys(servicePoints).length > 0 && (
          <div className="flex justify-end mt-6">
            <Button
              className="px-6 py-2 font-semibold"
              onClick={handleApply}
            >
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