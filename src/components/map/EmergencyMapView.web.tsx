import { Ionicons } from '@expo/vector-icons';
import { createElement, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MapDisclaimerBanner } from '@/components/map/MapDisclaimerBanner';
import type { EmergencyMapViewProps } from '@/components/map/EmergencyMapView.types';
import { isValidCoordinate } from '@/utils/mapViewport';

export type { EmergencyMapPoint, EmergencyMapViewProps, MapMarkerKind } from '@/components/map/EmergencyMapView.types';

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };

const KIND_LABELS = {
  aed: 'AED',
  er: '응급실',
  pharmacy: '약국',
  pediatric: '소아',
} as const;

function buildGoogleEmbedUrl(latitude: number, longitude: number, zoom = 14) {
  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;
}

function buildGoogleMapsLink(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function WebMapFrame({ src, title }: { src: string; title: string }) {
  return createElement('iframe', {
    title,
    src,
    style: {
      border: 0,
      width: '100%',
      height: '100%',
      display: 'block',
    },
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
  });
}

export function EmergencyMapView<T>({
  points,
  kind,
  selectedId,
  loading,
  center,
  onMarkerPress,
}: EmergencyMapViewProps<T>) {
  const validPoints = useMemo(
    () => points.filter((point) => isValidCoordinate(point)),
    [points],
  );

  const [frameCenter, setFrameCenter] = useState(() => {
    if (center && isValidCoordinate(center)) return center;
    if (validPoints[0]) return { latitude: validPoints[0].latitude, longitude: validPoints[0].longitude };
    return DEFAULT_CENTER;
  });

  useEffect(() => {
    if (center && isValidCoordinate(center)) {
      setFrameCenter(center);
    }
  }, [center?.latitude, center?.longitude]);

  useEffect(() => {
    if (center || validPoints.length === 0) return;
    setFrameCenter({
      latitude: validPoints[0].latitude,
      longitude: validPoints[0].longitude,
    });
  }, [center, validPoints]);

  const embedUrl = buildGoogleEmbedUrl(frameCenter.latitude, frameCenter.longitude);
  const previewPoints = validPoints.slice(0, 12);

  return (
    <View style={styles.container}>
      <View style={styles.mapLayer}>
        <WebMapFrame src={embedUrl} title={`${KIND_LABELS[kind]} 지도 미리보기`} />
      </View>

      <View style={styles.webBadge} pointerEvents="none">
        <Ionicons name="globe-outline" size={14} color="#475569" />
        <Text style={styles.webBadgeText}>웹 미리보기 · 앱에서는 네이티브 지도</Text>
      </View>

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#dc2626" />
        </View>
      ) : null}

      {previewPoints.length > 0 ? (
        <View style={styles.markerStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.markerStripContent}
          >
            {previewPoints.map((point) => {
              const selected = selectedId === point.id;
              return (
                <Pressable
                  key={point.id}
                  style={[styles.markerChip, selected && styles.markerChipSelected]}
                  onPress={() => {
                    setFrameCenter({
                      latitude: point.latitude,
                      longitude: point.longitude,
                    });
                    onMarkerPress(point);
                  }}
                >
                  <Text style={[styles.markerChipText, selected && styles.markerChipTextSelected]} numberOfLines={1}>
                    {point.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <Pressable
        style={styles.externalLink}
        onPress={() => {
          if (typeof window !== 'undefined') {
            window.open(buildGoogleMapsLink(frameCenter.latitude, frameCenter.longitude), '_blank');
          }
        }}
      >
        <Ionicons name="open-outline" size={14} color="#2563eb" />
        <Text style={styles.externalLinkText}>Google 지도에서 열기</Text>
      </Pressable>

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
  mapLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  webBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
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
  markerStrip: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 44,
  },
  markerStripContent: {
    gap: 8,
    paddingRight: 8,
  },
  markerChip: {
    maxWidth: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markerChipSelected: {
    borderColor: '#dc2626',
    backgroundColor: '#fff1f2',
  },
  markerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  markerChipTextSelected: {
    color: '#dc2626',
  },
  externalLink: {
    position: 'absolute',
    right: 10,
    bottom: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  externalLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  disclaimerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
