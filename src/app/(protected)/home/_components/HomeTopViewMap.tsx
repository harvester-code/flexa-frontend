import React, { useEffect, useRef, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Slider } from '@/components/ui/Slider';

interface HomeTopViewMapProps {
  imageFile: File | null;
  imageUrl: string | null;
  imageNaturalSize: { width: number; height: number } | null;
  setImageNaturalSize: (v: { width: number; height: number } | null) => void;

  dotSize: number;
  setDotSize: (v: number) => void;

  zoomLevel: number;
  setZoomLevel: (v: number) => void;

  panOffset: { x: number; y: number };
  setPanOffset: (v: { x: number; y: number }) => void;

  isDragging: boolean;
  setIsDragging: (v: boolean) => void;

  dragStart: { x: number; y: number };
  setDragStart: (v: { x: number; y: number }) => void;

  hasMoved: boolean;
  setHasMoved: (v: boolean) => void;

  mousePosition: { x: number; y: number } | null;
  setMousePosition: (v: { x: number; y: number } | null) => void;

  renderServicePoints: () => React.ReactNode;
  resetView: () => void;

  selecting?: boolean;
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const HomeTopViewMap: React.FC<HomeTopViewMapProps> = ({
  imageFile,
  imageUrl,
  dotSize,
  setDotSize,
  zoomLevel,
  setZoomLevel,
  panOffset,
  setPanOffset,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  hasMoved,
  setHasMoved,
  imageNaturalSize,
  setImageNaturalSize,
  renderServicePoints,
  mousePosition,
  setMousePosition,
  resetView,
  onImageClick,
  selecting = false,
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  // Resize handle state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);
  const [customHeight, setCustomHeight] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      setFrameSize({ width: rect.width, height: rect.height });
    };
    if (frameRef.current) {
      handleResize();
      const observer = new window.ResizeObserver(() => {
        if (!frameRef.current) return;
        handleResize();
      });
      observer.observe(frameRef.current);
      return () => observer.disconnect();
    }
  }, []);



  // 이미지 크기 측정 로직 (파일 업로드 또는 URL)
  useEffect(() => {
    // 1. imageFile이 있으면 기존 로직 (파일 업로드)
    if (imageFile && imageUrl && !imageNaturalSize) {
      const img = new Image();
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {};
      img.src = imageUrl;
      return;
    }
    // 2. 그 외에는 기존 방식 (이미지 naturalWidth/naturalHeight)
    if (imageUrl && !imageFile && !imageNaturalSize) {
      const img = new Image();
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {};
      img.src = imageUrl;
    }
  }, [imageFile, imageUrl, imageNaturalSize, frameSize.width]);

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

  // Helper: fit image to frame and center
  const fitAndCenter = () => {
    if (!frameRef.current || !imageNaturalSize) return;
    const frameRect = frameRef.current.getBoundingClientRect();
    const scaleX = frameRect.width / imageNaturalSize.width;
    const scaleY = frameRect.height / imageNaturalSize.height;
    const fitZoom = Math.min(scaleX, scaleY, 1);
    const offsetX = (frameRect.width - imageNaturalSize.width * fitZoom) / 2;
    const offsetY = (frameRect.height - imageNaturalSize.height * fitZoom) / 2;
    setZoomLevel(fitZoom);
    setPanOffset({ x: offsetX, y: offsetY });
  };

  // Double click: fit and center
  const handleDoubleClick = () => {
    fitAndCenter();
  };

  useEffect(() => {
    // On mount or when image/frame size changes, fit and center
    fitAndCenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageNaturalSize, frameSize.width, frameSize.height]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      // Zoom logic centered on mouse pointer
      if (!imageNaturalSize || !frameRef.current) return;
      const frameRect = frameRef.current.getBoundingClientRect();
      const mouseX = e.clientX - frameRect.left;
      const mouseY = e.clientY - frameRect.top;
      const prevZoom = zoomLevelRef.current;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(prevZoom * delta, 0.1), 5);
      // Calculate new panOffset so the point under the cursor stays fixed
      // (x, y) in image coordinates before zoom
      const imgX = (mouseX - panOffset.x) / prevZoom;
      const imgY = (mouseY - panOffset.y) / prevZoom;
      // After zoom, where should the top-left corner be?
      const newOffsetX = mouseX - imgX * newZoom;
      const newOffsetY = mouseY - imgY * newZoom;
      setZoomLevel(newZoom);
      setPanOffset({ x: newOffsetX, y: newOffsetY });
    };

    frame.removeEventListener('wheel', wheelHandler, { capture: true } as any);
    frame.addEventListener('wheel', wheelHandler, { passive: false, capture: true });

    return () => {
      frame.removeEventListener('wheel', wheelHandler, { capture: true } as any);
    };
  }, [imageNaturalSize, panOffset]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selecting) return; // Don't pan when in coordinate selection mode
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageNaturalSize) return;
    const imgElement = document.querySelector('img[alt="Airport Layout"]') as HTMLImageElement;
    if (!imgElement) return;
    const imgRect = imgElement.getBoundingClientRect();
    const imageX = e.clientX - imgRect.left;
    const imageY = e.clientY - imgRect.top;
    const normalizedX = imageX / imgRect.width;
    const normalizedY = imageY / imgRect.height;
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

  // Resize handle event handlers
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartY(e.clientY);
    setResizeStartHeight(frameSize.height);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaY = e.clientY - resizeStartY;
    const newHeight = Math.max(200, resizeStartHeight + deltaY); // 최소 높이 200px
    setCustomHeight(newHeight);
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  // Global resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing, resizeStartY, resizeStartHeight]);

  // Compute dynamic height based on image aspect ratio, but clamp to max 16:15
  const [frameWidth, setFrameWidth] = useState<number | null>(null);
  const handleResize = React.useCallback(() => {
    const frame = frameRef.current;
    if (!frame) {
      setFrameWidth(null);
      return;
    }
    setFrameWidth(frame.clientWidth);
  }, []);

  React.useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize(); // initial
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Default: 16:9
  let aspectRatio = 9 / 16;
  if (imageNaturalSize) {
    const imgRatio = imageNaturalSize.height / imageNaturalSize.width;
    // Only if image is much taller than 16:9 (e.g., > 11/16), allow up to 15/16
    if (imgRatio > 11 / 16) {
      aspectRatio = Math.min(imgRatio, 15 / 16);
    } else {
      aspectRatio = 9 / 16;
    }
  }

  // Use custom height if set, otherwise use calculated height
  const frameHeight = customHeight || (frameWidth ? frameWidth * aspectRatio : undefined);

  // Dot Size Modal 상태
  const [showDotSizePopover, setShowDotSizePopover] = useState(false);

  return (
    <div className="mb-6 w-full">
      <div
        ref={frameRef}
        className="relative overflow-hidden rounded-lg border"
        style={{
          width: '100%',
          // aspectRatio: '16 / 9', // REMOVE THIS
          height: frameHeight,
          cursor: selecting ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          background: '#f2f2f2',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'top left',
            width: imageNaturalSize?.width,
            height: imageNaturalSize?.height,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          onClick={onImageClick}
        >
          <img
            src={imageUrl || ''}
            alt="Airport Layout"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: selecting ? 'auto' : 'none', // Allow clicks when in selecting mode
              objectFit: 'contain',
            }}
          />
          {renderServicePoints()}
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 left-0 right-0 flex h-2 cursor-ns-resize items-center justify-center bg-gray-300 hover:bg-gray-400"
          onMouseDown={handleResizeMouseDown}
          style={{
            zIndex: 100,
            opacity: isResizing ? 0.8 : 0.6,
          }}
        >
          <div className="h-1 w-8 rounded-full bg-gray-500"></div>
          {isResizing && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded bg-black bg-opacity-70 px-2 py-1 text-xs font-normal text-white">
              Height: {Math.round(frameHeight || 0)}px
            </div>
          )}
        </div>
        {/* 우측 하단 설정 버튼 + Popover */}
        <div className="absolute bottom-4 right-4 z-[200]">
          <Popover open={showDotSizePopover} onOpenChange={setShowDotSizePopover}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="icon" title="Dot Size Setting">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top">
              <Button
                variant="link"
                type="button"
                onClick={() => setShowDotSizePopover(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex flex-col items-center gap-4">
                <span className="font-semibold">Dot Size</span>
                <Slider
                  min={0.005}
                  max={1}
                  step={0.005}
                  value={[dotSize]}
                  onValueChange={([v]) => setDotSize(v)}
                  className="w-64"
                />
                <span className="text-sm font-normal text-default-500">{dotSize}</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default HomeTopViewMap;
