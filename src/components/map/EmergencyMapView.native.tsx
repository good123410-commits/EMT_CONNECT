import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { MapClusterMarker } from '@/components/map/MapClusterMarker';
import { MapDisclaimerBanner } from '@/components/map/MapDisclaimerBanner';
import type { EmergencyMapViewProps } from '@/components/map/EmergencyMapView.types';
import { MapPointMarker } from '@/components/map/MapPointMarker';
import { useMapClusters, type MapClusterPoint } from '@/hooks/useMapClusters';
import type { EmergencyMapPoint } from '@/components/map/EmergencyMapView.types';
import {
  coordinateToRegion,
  isValidCoordinate,
  regionToBounds,
} from '@/utils/mapViewport';

const REGION_DEBOUNCE_MS = 200;

export type { EmergencyMapPoint, EmergencyMapViewProps, MapMarkerKind } from '@/components/map/EmergencyMapView.types';

export function EmergencyMapView<T>({
  points,
  kind,
  selectedId,
  loading,
  center,
  onMarkerPress,
  onViewportChange,
}: EmergencyMapViewProps<T>) {
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [region, setRegion] = useState<Region>(() => {
    const anchor = center && isValidCoordinate(center) ? center : points[0];
    return coordinateToRegion(
      anchor && isValidCoordinate(anchor) ? anchor : { latitude: 37.5665, longitude: 126.978 },
    );
  });

  const validPoints = useMemo(
    () => points.filter((point) => isValidCoordinate(point)),
    [points],
  );

  const clusterPoints = useMemo<MapClusterPoint<EmergencyMapPoint<T>>[]>(
    () =>
      validPoints.map((point) => ({
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
        payload: point,
      })),
    [validPoints],
  );

  const clusters = useMapClusters(clusterPoints, region);

  useEffect(() => {
    if (!center || !isValidCoordinate(center)) return;
    const nextRegion = coordinateToRegion(center);
    setRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 350);
  }, [center?.latitude, center?.longitude]);

  useEffect(() => {
    if (center || validPoints.length === 0) return;
    const nextRegion = coordinateToRegion(validPoints[0]);
    setRegion(nextRegion);
  }, [center, validPoints]);

  const handleRegionChangeComplete = useCallback(
    (nextRegion: Region) => {
      setRegion(nextRegion);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onViewportChange?.(regionToBounds(nextRegion, 0.15));
      }, REGION_DEBOUNCE_MS);
    },
    [onViewportChange],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const handleClusterPress = useCallback(
    (latitude: number, longitude: number) => {
      const nextRegion: Region = {
        latitude,
        longitude,
        latitudeDelta: Math.max(region.latitudeDelta * 0.45, 0.004),
        longitudeDelta: Math.max(region.longitudeDelta * 0.45, 0.004),
      };
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 250);
    },
    [region.latitudeDelta, region.longitudeDelta],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
        moveOnMarkerPress={false}
      >
        {clusters.map((feature) =>
          feature.type === 'cluster' ? (
            <MapClusterMarker
              key={feature.id}
              id={feature.id}
              latitude={feature.latitude}
              longitude={feature.longitude}
              pointCount={feature.pointCount}
              onPress={() => handleClusterPress(feature.latitude, feature.longitude)}
            />
          ) : (
            <MapPointMarker
              key={feature.id}
              id={feature.id}
              latitude={feature.latitude}
              longitude={feature.longitude}
              kind={kind}
              selected={selectedId === feature.id}
              moonlight={
                kind === 'pediatric' &&
                typeof feature.payload === 'object' &&
                feature.payload !== null &&
                'isMoonlightHospital' in feature.payload &&
                Boolean(
                  (feature.payload as { isMoonlightHospital?: boolean }).isMoonlightHospital,
                )
              }
              onPress={() => onMarkerPress(feature.payload)}
            />
          ),
        )}
      </MapView>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#dc2626" />
        </View>
      ) : null}

      <View style={styles.disclaimerWrap}>
        <MapDisclaimerBanner />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 220,
    backgroundColor: '#e2e8f0',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    padding: 8,
    elevation: 2,
  },
  disclaimerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
