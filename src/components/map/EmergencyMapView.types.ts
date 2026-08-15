import type { MapCoordinate } from '@/utils/mapViewport';
import type { MapBounds } from '@/utils/mapViewport';

export type MapMarkerKind = 'aed' | 'er' | 'pharmacy' | 'pediatric' | 'shelter';

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
  /** 지도 마커 강조(심야·영업 중 약국 등) */
  emphasizedIds?: ReadonlySet<string>;
  /** 강조 대상 마커들이 보이도록 지도 영역 맞춤 */
  fitToPointIds?: readonly string[];
  onMarkerPress: (point: EmergencyMapPoint<T>) => void;
  onViewportChange?: (bounds: MapBounds) => void;
};
