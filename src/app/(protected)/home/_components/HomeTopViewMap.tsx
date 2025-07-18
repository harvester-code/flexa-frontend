import React, { useEffect, useRef, useState } from 'react';

interface LayoutData {
  _img_info: {
    img?: string;
    img_path?: string;
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

interface HomeTopViewMapProps {
  layoutData: LayoutData;
  imageUrl: string;
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
  imageNaturalSize: { width: number; height: number } | null;
  setImageNaturalSize: (v: { width: number; height: number } | null) => void;
  renderServicePoints: () => React.ReactNode;
  mousePosition: { x: number; y: number } | null;
  setMousePosition: (v: { x: number; y: number } | null) => void;
  resetView: () => void;
}

const HomeTopViewMap: React.FC<HomeTopViewMapProps> = ({
  layoutData,
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
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const zoomLevelRef = useRef(zoomLevel);
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);

  useEffect(() => {
    if (!frameRef.current) return;
    const handleResize = () => {
      const rect = frameRef.current!.getBoundingClientRect();
      setFrameSize({ width: rect.width, height: rect.height });
    };
    handleResize();
    const observer = new window.ResizeObserver(handleResize);
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, []);

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

  // Compute dynamic height based on image aspect ratio, but clamp to max 16:15
  const [frameWidth, setFrameWidth] = useState<number | null>(null);
  useEffect(() => {
    const handleResize = () => {
      if (!frameRef.current) return;
      setFrameWidth(frameRef.current.clientWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const frameHeight = frameWidth ? frameWidth * aspectRatio : undefined;

  return (
    <div className="mb-6 w-full">
      <div
        ref={frameRef}
        className="relative overflow-hidden border rounded-lg"
        style={{
          width: '100%',
          // aspectRatio: '16 / 9', // REMOVE THIS
          height: frameHeight,
          cursor: isDragging ? 'grabbing' : 'grab',
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
        >
          <img
            src={imageUrl}
            alt="Airport Layout"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
          {renderServicePoints()}
        </div>
        {/* Move Mouse Position tooltip to the frame's bottom-left */}
        {mousePosition && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-50">
            Mouse Position: ({mousePosition.x}, {mousePosition.y})
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeTopViewMap; 