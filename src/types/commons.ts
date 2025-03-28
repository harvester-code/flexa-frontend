export interface Option {
  label: string;
  value: string;
  [key: string]: string | undefined;
}

// TODO: google.maps.LatLngLiteral 이용하기
export interface Coordinate {
  lat: number;
  lng: number;
}
