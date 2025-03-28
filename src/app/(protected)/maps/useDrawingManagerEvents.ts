import { RefObject, useEffect, useRef, useState } from 'react';
import { Coordinate } from '@/types/commons';

export type OverlayGeometry =
  | google.maps.Marker
  | google.maps.Polygon
  | google.maps.Polyline
  | google.maps.Rectangle
  | google.maps.Circle;

export interface DrawResult {
  type: google.maps.drawing.OverlayType;
  overlay: OverlayGeometry;
}

// ========================================================

export enum DrawingActionKind {
  SET_OVERLAY = 'SET_OVERLAY',
  UPDATE_OVERLAYS = 'UPDATE_OVERLAYS',
  UNDO = 'UNDO',
  REDO = 'REDO',
}

export interface ActionWithTypeOnly {
  type: Exclude<DrawingActionKind, DrawingActionKind.SET_OVERLAY>;
}

export interface SetOverlayAction {
  type: DrawingActionKind.SET_OVERLAY;
  payload: DrawResult;
}

export type Action = ActionWithTypeOnly | SetOverlayAction;

// ========================================================
function calcConvexHull(points: Coordinate[]) {
  if (points.length < 3) {
    return points;
  }

  // 중복 좌표 제거
  const uniquePoints = Array.from(new Set(points.map((p) => `${p.lat},${p.lng}`))).map((str) => {
    const [lat, lng] = str.split(',').map(Number);
    return { lat, lng };
  });

  // 좌표 정렬 (lat 기준, 동일한 lat에서는 lng 기준)
  uniquePoints.sort((a, b) => (a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat));

  const cross = (o: Coordinate, a: Coordinate, b: Coordinate) =>
    (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);

  const lower: Coordinate[] = [];
  for (const point of uniquePoints) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Coordinate[] = [];
  for (let i = uniquePoints.length - 1; i >= 0; i--) {
    const point = uniquePoints[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  upper.pop();
  lower.pop();

  return lower.concat(upper);
}

function calcMinimumAreaRectangle(points: Coordinate[]) {
  const vertices = points.length;
  if (vertices < 3) return null;

  let minArea = Infinity;
  let bestRectangle: { area: number; angle: number; corners: Coordinate[] } | null = null;

  for (let i = 0; i < vertices; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % vertices];

    // 현재 변의 기울기 계산
    const edgeAngle = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat);
    const cos = Math.cos(-edgeAngle);
    const sin = Math.sin(-edgeAngle);

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    // 좌표 변환 및 경계 계산
    points.forEach((point) => {
      const x = point.lat * cos - point.lng * sin;
      const y = point.lat * sin + point.lng * cos;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const area = (maxX - minX) * (maxY - minY);
    if (area < minArea) {
      minArea = area;
      bestRectangle = {
        area: minArea,
        angle: edgeAngle,
        corners: [
          { lat: minX * cos + minY * sin, lng: minY * cos - minX * sin },
          { lat: maxX * cos + minY * sin, lng: minY * cos - maxX * sin },
          { lat: maxX * cos + maxY * sin, lng: maxY * cos - maxX * sin },
          { lat: minX * cos + maxY * sin, lng: maxY * cos - minX * sin },
        ],
      };
    }
  }

  return bestRectangle;
}

function calcRectanglePaths(points: Coordinate[]) {
  const hullPoints = calcConvexHull(points);
  const minimumAreaRectangle = calcMinimumAreaRectangle(hullPoints);

  if (!minimumAreaRectangle) {
    return;
  }

  const newPaths = minimumAreaRectangle.corners.map((corner) => ({
    lat: corner.lat,
    lng: corner.lng,
  }));
  return newPaths;
}

// ========================================================
function getApproxArea(coords: Coordinate[]) {
  // coords: [{ lat: number, lng: number }, ...]

  // 1) 중앙(lat, lng) 구하기
  const n = coords.length;
  const sumLat = coords.reduce((acc, pt) => acc + pt.lat, 0);
  const sumLng = coords.reduce((acc, pt) => acc + pt.lng, 0);
  const avgLat = sumLat / n;
  const avgLng = sumLng / n;

  // 2) 각 점을 x, y(미터)로 변환
  // 대략적으로 1도 lat = 111,320m, 1도 lng = 111,320m * cos(lat)
  const meterPerDeg = 111320;
  const pointsXY = coords.map(({ lat, lng }) => {
    const x = (lng - avgLng) * meterPerDeg * Math.cos((avgLat * Math.PI) / 180);
    const y = (lat - avgLat) * meterPerDeg;
    return { x, y };
  });

  // 3) 신발끈 공식 적용
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; // 다음 점 (마지막 다음은 첫 번째로)
    area += pointsXY[i].x * pointsXY[j].y - pointsXY[j].x * pointsXY[i].y;
  }

  return Math.abs(area / 2); // m^2(대략값)
}

// 두 폴리곤 coordsA, coordsB를 비교하는 예시
function comparePolygonsArea(prevCoords: Coordinate[], newCoords: Coordinate[]) {
  const prevArea = getApproxArea(prevCoords);
  const newArea = getApproxArea(newCoords);

  if (prevArea > newArea) {
    // 크기를 축소하려는 것
    return false;
  } else {
    // 크기를 확대하려는 것
    return true;
  }
}

// ========================================================
function findUniqueIndex(arr1: Coordinate[], arr2: Coordinate[]) {
  // 두 배열을 하나로 합치기
  const combined = [...arr1, ...arr2];

  // 각각의 객체를 문자열로 변환해서 개수를 세기
  const countMap = new Map();

  combined.forEach((obj, index) => {
    const key = JSON.stringify(obj);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  // arr2에서 공통되지 않은 객체의 인덱스를 찾기
  for (let i = 0; i < arr2.length; i++) {
    const obj = arr2[i];
    if (countMap.get(JSON.stringify(obj)) === 1) {
      // 한 번만 등장한 객체 찾기
      return i; // 첫 번째로 찾은 인덱스를 반환
    }
  }

  return -1; // 공통되지 않은 객체가 없을 경우
}

function getCircularArray(arr: Coordinate[], index: number) {
  const result: Coordinate[] = [];
  const len = arr.length;

  // for (let i = 0; i < 3; i++) {
  //   result.push(arr[(index + i) % len]);
  // }

  for (let i = -2; i <= 0; i++) {
    const adjustedIndex = (index + i + len) % len; // 인덱스가 0일 때도 순환되도록 처리
    result.push(arr[adjustedIndex]);
  }

  return result;
}

// ========================================================
export function useDrawingManagerEvents(
  drawingManager: google.maps.drawing.DrawingManager | null,
  overlaysShouldUpdateRef: RefObject<boolean>
) {
  const pathsRef = useRef<Coordinate[]>([]);

  useEffect(() => {
    if (!drawingManager) return;

    const eventListeners: Array<google.maps.MapsEventListener> = [];

    const addUpdateListener = (eventName: string, drawResult: DrawResult) => {
      const updateListener = google.maps.event.addListener(drawResult.overlay, eventName, () => {
        if (eventName === 'dragstart') {
          overlaysShouldUpdateRef.current = false;
        }

        if (eventName === 'dragend') {
          overlaysShouldUpdateRef.current = true;
        }

        if (drawResult.type === google.maps.drawing.OverlayType.POLYGON) {
          const polygon = drawResult.overlay as google.maps.Polygon;

          const updatedPaths = polygon
            .getPath()
            .getArray()
            .map((latLng) => ({
              lat: latLng.lat(),
              lng: latLng.lng(),
            }));

          console.log('Previous Paths:');
          console.table(pathsRef.current);
          console.log('Updated Paths:');
          console.table(updatedPaths);

          const isBigger = comparePolygonsArea(pathsRef.current, updatedPaths);

          let newPaths: Coordinate[] | undefined;
          if (isBigger) {
            newPaths = calcRectanglePaths(updatedPaths);
          } else {
            const targetIndex = findUniqueIndex(pathsRef.current, updatedPaths);
            newPaths = calcRectanglePaths(getCircularArray(updatedPaths, targetIndex));
          }

          if (newPaths) {
            polygon.setPaths(newPaths);
            pathsRef.current = newPaths;
          }
        }
      });

      eventListeners.push(updateListener);
    };

    // =============================================================================================
    // NOTE: 처음 생성될 때
    const overlayCompleteListener = google.maps.event.addListener(
      drawingManager,
      'overlaycomplete',
      (drawResult: DrawResult) => {
        switch (drawResult.type) {
          case google.maps.drawing.OverlayType.POLYGON:
            const polygon = drawResult.overlay as google.maps.Polygon;
            const paths = polygon
              .getPath()
              .getArray()
              .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));

            const newPaths = calcRectanglePaths(paths);

            if (newPaths) {
              polygon.setPaths(newPaths);
              pathsRef.current = newPaths;
            }

            ['mouseup', 'insert_at', 'remove_at', 'set_at'].forEach((eventName) => {
              addUpdateListener(eventName, drawResult);
            });

          default:
            drawingManager.setDrawingMode(null);
            break;
        }
      }
    );

    eventListeners.push(overlayCompleteListener);

    return () => {
      eventListeners.forEach((listener) => google.maps.event.removeListener(listener));
    };
  }, [drawingManager, overlaysShouldUpdateRef]);
}
