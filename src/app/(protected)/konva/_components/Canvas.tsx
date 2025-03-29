'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Hand, LandPlot, MousePointer2 } from 'lucide-react';
import { Image, Layer, Rect, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { cn } from '@/lib/utils';

const CURSOR_MAP = { view: 'auto', grab: 'grab', draw: 'crosshair' } as const;

const Canvas = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageScale, setImageScale] = useState(1); // 이미지의 스케일 값
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [image] = useImage(imageUrl);

  const prevModeRef = useRef<'view' | 'grab' | 'draw'>('view');
  const [mode, setMode] = useState<'view' | 'grab' | 'draw'>('view');

  const [rectangles, setRectangles] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRectangle, setNewRectangle] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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
    const minScale = 0.5; // Set the minimum scale limit
    const maxScale = 4.5; // Set the minimum scale limit

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

  const handleMouseDown = (e) => {
    e.evt.preventDefault();

    const stage = canvasStageRef.current;

    if (!stage) return;

    const clickedOnEmpty = e.target === stage || e.target.className === 'Image';
    if (clickedOnEmpty) {
      setSelectedId(null);
    }

    if (mode === 'draw') {
      const pointer = stage.getPointerPosition();
      const scale = stage.scaleX();
      const position = stage.position();

      const adjustedPointer = {
        x: (pointer.x - position.x) / scale,
        y: (pointer.y - position.y) / scale,
      };

      setIsDrawing(true);
      setNewRectangle({ x: adjustedPointer.x, y: adjustedPointer.y, width: 0, height: 0 });
    } else if (mode === 'grab') {
      stage.container().style.cursor = 'grabbing';
    } else {
      //
    }
  };

  const handleMouseMove = (e) => {
    e.evt.preventDefault();

    if (!isDrawing || mode !== 'draw') return;

    const stage = canvasStageRef.current;

    const pointer = stage.getPointerPosition();
    const scale = stage.scaleX();
    const position = stage.position();

    const adjustedPointer = {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };

    if (newRectangle) {
      let width = adjustedPointer.x - newRectangle.x;
      width = width !== 0 ? width : adjustedPointer.x > newRectangle.x ? 1 : -1;

      let height = adjustedPointer.y - newRectangle.y;
      height = height !== 0 ? height : adjustedPointer.y > newRectangle.y ? 1 : -1;

      setNewRectangle({ ...newRectangle, width, height });
    }
  };

  const handleMouseUp = (e) => {
    e.evt.preventDefault();

    const stage = canvasStageRef.current;
    if (!stage) return;

    if (mode === 'draw' && isDrawing && newRectangle) {
      let finalizedRectangle = { ...newRectangle };

      if (newRectangle.width === 0 && newRectangle.height === 0) {
        finalizedRectangle = { x: newRectangle.x - 50, y: newRectangle.y - 50, width: 100, height: 100 };
      }

      setRectangles((prevRectangles) => [...prevRectangles, finalizedRectangle]);

      setMode('view');
      setIsDrawing(false);
      setNewRectangle(null);
    } else if (mode === 'grab') {
      stage.container().style.cursor = 'grab';
    } else {
      //
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (image) {
      const stage = canvasStageRef.current;

      const originalImageWidth = image.width;
      const originalImageHeight = image.height;

      const scaleX = widthRef.current / originalImageWidth;
      const scaleY = heightRef.current / originalImageHeight;

      const scaleFactor = Math.min(1, scaleX, scaleY);
      setImageScale(scaleFactor);

      const resizedImageWidth = originalImageWidth * scaleFactor;
      const resizedImageHeight = originalImageHeight * scaleFactor;

      const viewportCenter = { x: stage.width() / 2, y: stage.height() / 2 };

      const newPosition = {
        x: viewportCenter.x - resizedImageWidth / 2,
        y: viewportCenter.y - resizedImageHeight / 2,
      };

      setImagePosition(newPosition);
    }
  }, [image]);

  useEffect(() => {
    const transformer = transformerRef.current;

    if (transformer && selectedId !== null) {
      const selectedNode = canvasStageRef.current.findOne(`#rect-${selectedId}`);
      if (selectedNode) {
        transformer.nodes([selectedNode]);
        transformer.getLayer().batchDraw();
      }
    } else if (transformer) {
      transformer.nodes([]);
    }
  }, [selectedId]);

  return (
    <>
      <div ref={canvasContainerRef} className="relative h-[800px] w-full overflow-hidden bg-gray-200">
        <Stage
          draggable={mode === 'grab'}
          ref={canvasStageRef}
          width={width}
          height={height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: CURSOR_MAP[mode] }}
        >
          <Layer>
            {image && (
              <Image
                image={image}
                x={imagePosition.x}
                y={imagePosition.y}
                scaleX={imageScale}
                scaleY={imageScale}
                alt="Airport Map"
              />
            )}
            {rectangles.map((rect, index) => (
              <Rect
                key={index}
                id={`rect-${index}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                fill="rgba(0, 0, 255, 0.4)"
                draggable={mode === 'view'}
                onMouseDown={() => {
                  if (mode === 'view') setSelectedId(index);
                }}
                onDragEnd={(e) => {
                  const newRects = rectangles.slice(); // for immutable
                  newRects[index] = {
                    ...newRects[index],
                    x: e.target.x(),
                    y: e.target.y(),
                  };
                  setRectangles(newRects);
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const newRects = rectangles.slice(); // for immutable
                  newRects[index] = {
                    ...newRects[index],
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * node.scaleX(),
                    height: node.height() * node.scaleY(),
                  };
                  node.scaleX(1);
                  node.scaleY(1);
                  setRectangles(newRects);
                }}
              />
            ))}
            {newRectangle && (
              <Rect
                x={newRectangle.x}
                y={newRectangle.y}
                width={newRectangle.width}
                height={newRectangle.height}
                fill="rgba(0, 0, 255, 0.3)"
              />
            )}
            <Transformer ref={transformerRef} keepRatio={false} flipEnabled={false} />
          </Layer>
        </Stage>

        {/* NOTE: 실제로는 어떤 UI에서 어떻게 사용될지 모르니 여기서 힘쓰지 말자. */}
        <div className="absolute bottom-3 left-0 right-0 mx-auto flex w-fit justify-center">
          <div className="flex gap-2 rounded-lg bg-default-300 p-2">
            <div
              className={cn(
                'rounded p-1 hover:bg-default-200',
                mode === 'view' && 'bg-default-100 hover:bg-default-100'
              )}
              onClick={() => setMode('view')}
            >
              <MousePointer2 />
            </div>

            <div
              className={cn(
                'rounded p-1 hover:bg-default-200',
                mode === 'grab' && 'bg-default-100 hover:bg-default-100'
              )}
              onClick={() => {
                prevModeRef.current = 'grab';
                setMode('grab');
              }}
            >
              <Hand />
            </div>

            <div
              className={cn(
                'rounded p-1 hover:bg-default-200',
                mode === 'draw' && 'bg-default-100 hover:bg-default-100'
              )}
              onClick={() => setMode('draw')}
            >
              <LandPlot />
            </div>
          </div>
        </div>
      </div>

      <input type="file" accept="image/*" onChange={handleImageChange} />
    </>
  );
};

export default Canvas;
