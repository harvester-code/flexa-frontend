export interface TerminalLayoutZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScenarioTerminalLayout {
  imageUrl?: string | null;
  zoneAreas: Record<string, TerminalLayoutZoneRect>;
}
