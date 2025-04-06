'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Image, Layer, Stage } from 'react-konva';
import useImage from 'use-image';
import { ScenarioData } from '@/types/simulations';
import { usePassengerPoints } from '@/queries/homeQueries';
import TheTimeSlider from '@/components/TheTimeSlider';

interface CanvasProps {
  scenario: ScenarioData | null;
  snapshot: any;
}

const url =
  'https://flexa-dev-ap-northeast-2-data-storage.s3.ap-northeast-2.amazonaws.com/maps/icn-indoor-map.svg';

const HomeCanvas = ({ scenario, snapshot }: CanvasProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<any>(null);

  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [image] = useImage(url, 'anonymous');
  const [imageScale, setImageScale] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [stageZoom, setStageZoom] = useState({ scaleX: 0, scaleY: 0 });
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  const handleScreenSize = () => {
    const container = canvasContainerRef.current;
    if (container) {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;

      setWidth(newWidth);
      setHeight(newHeight);
    }
  };

  const handleWheel = (e) => {
    const isZoomKeyPressed = e.evt.ctrlKey || e.evt.metaKey;
    if (!isZoomKeyPressed) return;

    e.evt.preventDefault();
    e.evt.stopImmediatePropagation();

    const scaleBy = 1.05;
    const minScale = 1.0; // Set the minimum scale limit
    const maxScale = 6.0; // Set the minimum scale limit

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

  useEffect(() => {
    handleScreenSize();
    window.addEventListener('resize', handleScreenSize);
    return () => window.removeEventListener('resize', handleScreenSize);
  }, []);

  useEffect(() => {
    widthRef.current = width;
    heightRef.current = height;
  }, [width, height]);

  // =======================================================================
  const [dots, setDots] = useState<any[]>([]);
  const [markers, setMarkers] = useState<number[] | undefined>();
  const [maxMarker, setMaxMarker] = useState<number | undefined>();

  const { data: passengerPoints } = usePassengerPoints({ scenarioId: scenario?.id });
  // FIXME: 추후에 해당 데이터 없애기
  const [processedData, setProcessedData] = useState<
    { timestamp: string; queues: { [key: string]: number } }[]
  >([]);

  useEffect(() => {
    setImageScale(snapshot.image.zoom);
    setImagePosition(snapshot.image.position);

    setStageZoom(snapshot.stage.zoom);
    setStagePosition(snapshot.stage.position);

    // HACK: 테스트 중
    setDots([
      { title: 'checkin_A', circles: snapshot.markers[0] },
      { title: 'checkin_B', circles: snapshot.markers[1] },
      { title: 'checkin_C', circles: snapshot.markers[2] },
    ]);
  }, [snapshot]);

  useEffect(() => {
    if (!passengerPoints) return;

    const processedData = Object.keys(passengerPoints).map((timestamp) => {
      const queues = {};
      passengerPoints[timestamp].forEach(({ title, queue_length }) => (queues[title] = queue_length));
      return { timestamp, queues };
    });

    setMaxMarker(processedData.length - 1);
    setMarkers([Math.round(processedData.length / 2)]);
    setProcessedData(processedData);
  }, [passengerPoints]);

  return (
    <>
      <div className="mt-8 px-5">
        <h2 className="text-2xl font-semibold">Terminal Overview</h2>
      </div>

      <div ref={canvasContainerRef} className="mx-auto mt-5 h-[480px] w-full rounded-lg bg-[#ededf4]">
        <Stage
          draggable
          className="cursor-grab"
          ref={canvasStageRef}
          width={width}
          height={height}
          scaleX={stageZoom.scaleX}
          scaleY={stageZoom.scaleY}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          onDragStart={() => {
            const stage = canvasStageRef.current;
            if (stage) {
              stage.container().style.cursor = 'grabbing';
            }
          }}
          onDragEnd={() => {
            const stage = canvasStageRef.current;
            if (stage) {
              stage.container().style.cursor = 'grab';
            }
          }}
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
            {dots.length > 0 &&
              dots.map(({ title, circles }, i) =>
                circles.map((circle, j) => {
                  if (!markers) return;

                  return (
                    <Circle
                      key={`${i}-${j}`}
                      x={circle.x}
                      y={circle.y}
                      radius={0.7}
                      fill={processedData[markers[0]]?.queues[title] > j ? 'green' : 'transparent'}
                    />
                  );
                })
              )}
          </Layer>
        </Stage>
      </div>

      <TheTimeSlider
        className="mt-8 pb-12"
        max={maxMarker ?? 100}
        defaultValue={markers ?? [50]}
        value={markers ?? [50]}
        form={markers ? processedData[markers[0]]?.timestamp : undefined}
        onValueChange={setMarkers}
      />
    </>
  );
};

export default HomeCanvas;
