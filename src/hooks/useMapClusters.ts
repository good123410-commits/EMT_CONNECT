import { useMemo } from 'react';
import Supercluster from 'supercluster';
import type { MapRegion } from '@/types/mapRegion';
import { regionToBBox, regionToZoom } from '@/utils/mapViewport';

export type MapClusterPoint<T> = {
  id: string;
  latitude: number;
  longitude: number;
  payload: T;
};

export type MapClusterFeature<T> =
  | {
      type: 'cluster';
      id: string;
      latitude: number;
      longitude: number;
      pointCount: number;
    }
  | {
      type: 'point';
      id: string;
      latitude: number;
      longitude: number;
      payload: T;
    };

type GeoFeature<T> = Supercluster.PointFeature<{ id: string; payload: T }>;

function toGeoFeatures<T>(points: MapClusterPoint<T>[]): GeoFeature<T>[] {
  return points.map((point) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude],
    },
    properties: {
      id: point.id,
      payload: point.payload,
    },
  }));
}

export function useMapClusters<T>(
  points: MapClusterPoint<T>[],
  region: MapRegion,
): MapClusterFeature<T>[] {
  const index = useMemo(() => {
    const clusterIndex = new Supercluster<{ id: string; payload: T }>({
      radius: 56,
      maxZoom: 18,
      minZoom: 0,
    });
    clusterIndex.load(toGeoFeatures(points));
    return clusterIndex;
  }, [points]);

  return useMemo(() => {
    const bbox = regionToBBox(region, 0.15);
    const zoom = regionToZoom(region);
    const clusters = index.getClusters(bbox, zoom);

    return clusters.map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      const props = feature.properties as
        | { cluster?: boolean; cluster_id?: number; point_count?: number; id?: string; payload?: T }
        | undefined;

      if (props?.cluster) {
        return {
          type: 'cluster' as const,
          id: `cluster-${props.cluster_id}`,
          latitude,
          longitude,
          pointCount: props.point_count ?? 0,
        };
      }

      return {
        type: 'point' as const,
        id: props?.id ?? `${latitude},${longitude}`,
        latitude,
        longitude,
        payload: props?.payload as T,
      };
    });
  }, [index, region]);
}
