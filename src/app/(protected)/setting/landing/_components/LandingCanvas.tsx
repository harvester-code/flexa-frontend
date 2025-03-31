'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Group, Image, Layer, Rect, Stage } from 'react-konva';
import useImage from 'use-image';
import { rectangles } from '../samples';

const Canvas = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<any>(null);

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

  const dataLength = [150, 300];

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
                {rect.childs.length > 0 &&
                  rect.childs.slice(0, dataLength[index]).map((child, idx) => {
                    return <Circle key={idx} x={child.x} y={child.y} radius={2} fill="green" />;
                  })}
              </React.Fragment>
            ))}
          </Layer>
        </Stage>
      </div>
    </>
  );
};

export default Canvas;
