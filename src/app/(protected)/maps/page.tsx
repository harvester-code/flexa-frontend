'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdvancedMarker, Map, MapCameraChangedEvent, MapCameraProps, useMap } from '@vis.gl/react-google-maps';
import { Coordinate } from '@/types/commons';
import { Button } from '@/components/ui/Button';
import { useDrawingManager } from './useDrawingManager';
import { useDrawingManagerEvents } from './useDrawingManagerEvents';

const INITIAL_CAMERA: MapCameraProps = {
  center: { lat: 37.445271, lng: 126.447863 },
  zoom: 17,
};

interface CustomOverlayCompProps {
  bounds?: google.maps.LatLngBounds;
  image: string;
}

const CustomOverlayComp = ({ image }: CustomOverlayCompProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // TODO: 정확한 위치가 필요한 상황.
    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(37.445271, 126.447863),
      new google.maps.LatLng(37.454, 126.461)
    );

    class CustomOverlayView extends google.maps.OverlayView {
      div: HTMLDivElement | null = null;
    }

    const overlay = new CustomOverlayView();

    overlay.onAdd = (): void => {
      const div = document.createElement('div');
      div.style.borderStyle = 'none';
      div.style.borderWidth = '0px';
      div.style.position = 'absolute';

      const img = document.createElement('img');
      img.src = image;
      img.style.width = '100%';
      img.style.position = 'absolute';
      // img.style.transform = 'rotate(325deg)';

      div.appendChild(img);
      overlay.div = div;

      const panes = overlay.getPanes();
      if (panes) panes.overlayLayer.appendChild(div);
    };

    overlay.draw = () => {
      const overlayProjection = overlay.getProjection();

      const sw = overlayProjection.fromLatLngToDivPixel(bounds.getSouthWest())!;
      const ne = overlayProjection.fromLatLngToDivPixel(bounds.getNorthEast())!;

      if (overlay.div) {
        overlay.div.style.left = sw.x + 'px';
        overlay.div.style.top = ne.y + 'px';
        overlay.div.style.width = ne.x - sw.x + 'px';
        overlay.div.style.height = sw.y - ne.y + 'px';
      }
    };

    overlay.onRemove = () => {
      if (overlay.div) {
        overlay.div.parentNode?.removeChild(overlay.div);
        overlay.div = null;
      }
    };

    overlay.setMap(map);

    return () => {
      overlay.setMap(null);
    };
  }, [map, image]);

  return null;
};

// ================================================================================
function MapsPage() {
  const map = useMap();

  const drawingManager = useDrawingManager();
  const overlaysShouldUpdateRef = useRef<boolean>(false);

  const [markers, setMarkers] = useState<Coordinate[]>([]);

  useDrawingManagerEvents(drawingManager, overlaysShouldUpdateRef);

  const [cameraProps, setCameraProps] = useState<MapCameraProps>(INITIAL_CAMERA);
  const handleCameraChange = useCallback((ev: MapCameraChangedEvent) => {
    setCameraProps(ev.detail);
  }, []);

  const handleDrawingClick = () => {
    if (drawingManager) {
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
  };

  return (
    <div className="h-[800px]">
      <Map
        {...cameraProps}
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        gestureHandling={'greedy'}
        onCameraChanged={handleCameraChange}
      >
        {markers && <Markers points={markers} />}

        {/* <CustomOverlayComp image="/maps/icn_indoor_map.svg" /> */}
      </Map>

      <Button onClick={handleDrawingClick}>Drawing</Button>
    </div>
  );
}

// ================================================================================
const Markers = ({ points }: { points: Coordinate[] }) => {
  return (
    <>
      {points.map((point, idx) => {
        return (
          <AdvancedMarker position={point} key={idx}>
            <span className="text-3xl">🤷</span>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export default MapsPage;
