import { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Image, Layer, Stage } from 'react-konva';
import useImage from 'use-image';
import { Position } from '@/types/commons';
import { cn } from '@/lib/utils';

interface TheCanvasViewerProps {
  snapshot: {
    stage: {
      zoom: { scaleX: number; scaleY: number };
      position: Position;
    };
    backgroundImage: {
      src: string;
      zoom: number;
      position: Position;
    };
    markers: Position[][];
  };
  minScale?: number;
  maxScale?: number;
  className?: string;
}

function TheCanvasViewer({
  snapshot: { backgroundImage, markers, stage },
  minScale = 1.0,
  maxScale = 6.0,
  className,
}: TheCanvasViewerProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<any>(null);

  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [image] = useImage(backgroundImage.src, 'anonymous');

  const prevModeRef = useRef<'view' | 'grab' | 'draw'>('view');
  const [mode, setMode] = useState<'view' | 'grab' | 'draw'>('view');

  const handleScreenSize = () => {
    const container = canvasContainerRef.current;
    if (container) {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;

      setWidth(newWidth);
      setHeight(newHeight);
    }
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // 스페이스바 스크롤 방지
        if (mode !== 'grab') {
          prevModeRef.current = mode; // 현재 모드 저장
          setMode('grab');
        }
      }
    },
    [mode]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault(); // 스페이스바 스크롤 방지
      setMode(prevModeRef.current);
    }
  }, []);

  useEffect(() => {
    handleScreenSize();

    window.addEventListener('resize', handleScreenSize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleScreenSize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
  }, [width, height]);

  const handleWheel = (e) => {
    const isZoomKeyPressed = e.evt.ctrlKey || e.evt.metaKey;

    if (!isZoomKeyPressed) return;

    e.evt.preventDefault();
    e.evt.stopImmediatePropagation();

    const scaleBy = 1.05;

    const stage = canvasStageRef.current;
    const oldScale = stage.scaleX() || 1;

    const pointer = stage.getPointerPosition();
    if (!pointer || !stage) return;

    let zoomAmount = e.evt.deltaY;

    if (Math.abs(zoomAmount) < 1) {
      zoomAmount *= 20;
    } else if (Math.abs(zoomAmount) > 100) {
      zoomAmount /= 100;
    }

    let newScale = zoomAmount > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(minScale, Math.min(newScale, maxScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  const dataLength = [50, 80, 40];

  return (
    <>
      <div ref={canvasContainerRef} className={cn('overflow-hidden', className)}>
        <Stage
          draggable={mode === 'grab'}
          ref={canvasStageRef}
          width={width}
          height={height}
          scaleX={stage.zoom.scaleX}
          scaleY={stage.zoom.scaleY}
          x={stage.position.x}
          y={stage.position.y}
          onWheel={handleWheel}
        >
          <Layer>
            {image && (
              <Image
                alt="Airport Map"
                image={image}
                x={backgroundImage.position.x}
                y={backgroundImage.position.y}
                scaleX={backgroundImage.zoom}
                scaleY={backgroundImage.zoom}
              />
            )}
            {markers &&
              markers.map((points, index) =>
                points
                  .slice(0, dataLength[index])
                  .map((point, idx) => (
                    <Circle key={`${index}-${idx}`} x={point.x} y={point.y} radius={0.6} fill="green" />
                  ))
              )}
          </Layer>
        </Stage>
      </div>
    </>
  );
}

export default TheCanvasViewer;
