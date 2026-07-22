import type { MapCoordinate } from '@/utils/mapViewport';
import type { MapBounds } from '@/utils/mapViewport';

export type MapMarkerKind = 'aed' | 'er' | 'pharmacy' | 'pediatric';

export type EmergencyMapPoint<T = unknown> = MapCoordinate & {
  id: string;
  name: string;
  kind: MapMarkerKind;
  payload: T;
};

export type EmergencyMapViewProps<T> = {
  points: EmergencyMapPoint<T>[];
  kind: MapMarkerKind;
  selectedId?: string | null;
  loading?: boolean;
  center?: MapCoordinate;
  onMarkerPress: (point: EmergencyMapPoint<T>) => void;
  onViewportChange?: (bounds: MapBounds) => void;
};
