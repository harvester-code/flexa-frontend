'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Image, Layer, Rect, Stage, Transformer } from 'react-konva';
import useImage from 'use-image';
import CanvasController from './CanvasController';
import CanvasInputs from './CanvasInputs';

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

  const [isDrawing, setIsDrawing] = useState(false);

  const [rectangles, setRectangles] = useState<any[]>([]);
  const [newRectangle, setNewRectangle] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [nodes, setNodes] = useState([
    { title: 'Zone A', passengerCount: 350, lineCount: 10, circleSize: 1 },
    { title: 'Zone B', passengerCount: 350, lineCount: 10, circleSize: 1 },
    { title: 'Zone C', passengerCount: 350, lineCount: 10, circleSize: 1 },
  ]);

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
      setIsDrawing(true);

      const pointer = stage.getPointerPosition();
      const scale = stage.scaleX();
      const position = stage.position();

      const adjustedPointer = {
        x: (pointer.x - position.x) / scale,
        y: (pointer.y - position.y) / scale,
      };

      // NOTE: 필요한 추가 속성이 있다면 여기에 추가하면 된다.
      setNewRectangle({
        x: adjustedPointer.x,
        y: adjustedPointer.y,
        width: 0,
        height: 0,
        rotation: 0,
        childs: [],
      });
    } else if (mode === 'grab') {
      stage.container().style.cursor = 'grabbing';
    } else {
      //
    }
  };

  const handleMouseMove = (e) => {
    e.evt.preventDefault();

    if (mode === 'draw' || isDrawing) {
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
        let height = adjustedPointer.y - newRectangle.y;

        // 마우스의 이동이 좌측에서 시작되는지 우측에서 시작되는지 판단하는 코드
        width = width !== 0 ? width : adjustedPointer.x > newRectangle.x ? 1 : -1;
        height = height !== 0 ? height : adjustedPointer.y > newRectangle.y ? 1 : -1;

        setNewRectangle({ ...newRectangle, width, height });
      }
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

  const drawLines = (index: number) => {
    const { passengerCount, lineCount } = nodes[index];
    const { x, y, width, height, rotation } = rectangles[index];

    const passengersPerLine = Math.ceil(passengerCount / lineCount);

    const subWidth = width / lineCount;
    const subHeight = height / passengersPerLine;

    // degree → radian 변환
    const rad = (Math.PI / 180) * rotation;

    const childPositions: any[] = [];

    for (let i = 0; i < lineCount; i++) {
      for (let j = 0; j < passengersPerLine; j++) {
        // 사각형 좌측 상단이 원점이라고 생각하고
        // 직사각형 내부에서의 상대 좌표(dx, dy)를 구한다.
        const dx = subWidth * (i + 0.5);
        const dy = subHeight * (j + 0.5);

        // (dx, dy)를 rotation만큼 회전한 뒤,
        // 다시 원래 사각형의 좌측 상단 위치 (x, y)만큼 평행 이동
        const rotatedX = x + dx * Math.cos(rad) - dy * Math.sin(rad);
        const rotatedY = y + dx * Math.sin(rad) + dy * Math.cos(rad);

        childPositions.push({ x: rotatedX, y: rotatedY });
      }
    }

    setRectangles((prev) => {
      const updatedRectangles = [...prev];
      updatedRectangles[index] = { ...updatedRectangles[index], childs: childPositions };
      return updatedRectangles;
    });
  };

  return (
    <>
      <div
        ref={canvasContainerRef}
        className="relative mx-auto mt-12 h-[480px] w-[1280px] overflow-hidden bg-gray-200"
      >
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
              <React.Fragment key={index}>
                <Rect
                  draggable
                  id={`rect-${index}`}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill="rgba(0, 0, 255, 0.4)"
                  onMouseDown={() => {
                    setSelectedId(index);
                  }}
                  onDragStart={() => {
                    setRectangles((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], childs: [] };
                      return updated;
                    });
                  }}
                  onDragEnd={(e) => {
                    const newRects = [...rectangles];
                    newRects[index] = { ...newRects[index], x: e.target.x(), y: e.target.y() };
                    setRectangles(newRects);
                  }}
                  onTransformStart={() => {
                    setRectangles((prev) => {
                      const updated = [...prev];
                      updated[index] = { ...updated[index], childs: [] };
                      return updated;
                    });
                  }}
                  onTransformEnd={(e) => {
                    const node = e.target;

                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();

                    const newRects = [...rectangles];
                    newRects[index] = {
                      ...newRects[index],
                      x: node.x(),
                      y: node.y(),
                      width: node.width() * scaleX,
                      height: node.height() * scaleY,
                      rotation: node.rotation(),
                      scaleX,
                      scaleY,
                    };

                    node.scaleX(1);
                    node.scaleY(1);

                    setRectangles(newRects);
                  }}
                />
                {rect.childs.length > 0 &&
                  rect.childs.map((child, idx) => {
                    return (
                      <Circle key={idx} x={child.x} y={child.y} radius={nodes[index].circleSize} fill="green" />
                    );
                  })}
              </React.Fragment>
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

        <CanvasController
          mode={mode}
          prevModeRef={prevModeRef}
          rectangles={rectangles}
          nodes={nodes}
          setMode={setMode}
        />
      </div>

      <div className="mx-auto mt-6 flex w-[1280px] justify-between overflow-hidden bg-gray-200 p-4">
        <input className="border border-rose-500" type="file" accept="image/*" onChange={handleImageChange} />

        <button
          className="pr-8"
          onClick={() => {
            const stage = canvasStageRef.current;
            if (stage) {
              const scaleX = stage.scaleX();
              const scaleY = stage.scaleY();
              const position = stage.position();

              const snapshot = {
                stage: { zoom: { scaleX, scaleY }, position },
                image: { zoom: imageScale, position: imagePosition },
                markers: rectangles.map((rect) => rect.childs),
              };

              console.log(snapshot);
            }
          }}
        >
          Save
        </button>
      </div>

      <CanvasInputs
        nodes={nodes}
        setNodes={setNodes}
        rectangles={rectangles}
        setRectangles={setRectangles}
        drawLines={drawLines}
      />
    </>
  );
};

export default Canvas;
