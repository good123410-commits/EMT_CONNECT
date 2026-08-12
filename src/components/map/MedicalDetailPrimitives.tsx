import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { EmergencyMapView } from '@/components/map/EmergencyMapView';
import type { MapMarkerKind } from '@/components/map/EmergencyMapView.types';
import { MapModuleErrorBoundary } from '@/components/map/MapModuleErrorBoundary';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import { confirmPhoneCall } from '@/utils/confirmPhoneCall';
import { openKakaoMapDirections } from '@/utils/mapNavigation';

export function MedicalDetailBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

export function MedicalDetailSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function MedicalDetailText({
  children,
  variant = 'body',
}: {
  children: ReactNode;
  variant?: 'body' | 'secondary' | 'muted' | 'title';
}) {
  const style =
    variant === 'title'
      ? styles.title
      : variant === 'secondary'
        ? styles.secondary
        : variant === 'muted'
          ? styles.muted
          : styles.bodyText;
  return <Text style={style}>{children}</Text>;
}

export function MedicalDetailCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function MedicalDetailInfoTile({
  icon,
  label,
  value,
  valueColor = MEDICAL_DETAIL.text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={MEDICAL_DETAIL.textMuted} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: valueColor }]}>{value}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.tile}>{content}</View>;
  }

  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

function hasValidDetailCoordinates(latitude?: number | null, longitude?: number | null): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0)
  );
}

export function MedicalDetailMiniMapBox({
  name,
  latitude,
  longitude,
  address,
  mapKind = 'er',
}: {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  mapKind?: MapMarkerKind;
}) {
  const hasCoords = hasValidDetailCoordinates(latitude, longitude);

  if (hasCoords) {
    const lat = latitude as number;
    const lng = longitude as number;
    const point = {
      id: 'detail-location',
      latitude: lat,
      longitude: lng,
      name,
      kind: mapKind,
      payload: null,
    };

    return (
      <View style={styles.miniMapWrap}>
        <MapModuleErrorBoundary>
          <EmergencyMapView
            points={[point]}
            kind={mapKind}
            selectedId={point.id}
            center={{ latitude: lat, longitude: lng }}
            onMarkerPress={() => undefined}
          />
        </MapModuleErrorBoundary>
      </View>
    );
  }

  return (
    <MedicalDetailCard>
      <View style={styles.miniMapPlaceholder}>
        <Ionicons name="map-outline" size={36} color={MEDICAL_DETAIL.textMuted} />
        <Text style={styles.miniMapPlaceholderTitle}>위치 미리보기</Text>
        <Text style={styles.miniMapPlaceholderText} numberOfLines={2}>
          {address?.trim() || '좌표 정보 없음'}
        </Text>
      </View>
    </MedicalDetailCard>
  );
}

export function MedicalDetailCallButton({
  facilityName,
  phone,
  sublabel,
}: {
  facilityName: string;
  phone: string;
  sublabel?: string;
}) {
  return (
    <Pressable
      className="items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 shadow-sm"
      onPress={() => confirmPhoneCall(facilityName, phone)}
      accessibilityRole="button"
      accessibilityLabel="전화하기"
    >
      <Ionicons name="call" size={22} color="#ffffff" />
      <Text className="mt-1 text-xs font-bold text-white">전화하기</Text>
      {sublabel ? <Text className="mt-0.5 text-[10px] text-blue-100">{sublabel}</Text> : null}
    </Pressable>
  );
}

export type MedicalDetailLocationHeaderProps = {
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  phoneSublabel?: string;
  mapKind?: MapMarkerKind;
  distanceBlock?: ReactNode;
  leadingContent?: ReactNode;
  titleExtras?: ReactNode;
};

/** 상단 미니 지도 → 제목/주소/전화 → 거리 블록 → 카카오맵 길찾기 */
export function MedicalDetailLocationHeader({
  name,
  address,
  latitude,
  longitude,
  phone,
  phoneSublabel,
  mapKind = 'er',
  distanceBlock,
  leadingContent,
  titleExtras,
}: MedicalDetailLocationHeaderProps) {
  const normalizedPhone = phone?.trim();
  const callPhone = normalizedPhone && normalizedPhone !== '-' ? normalizedPhone : null;

  return (
    <View style={styles.locationHeader}>
      {leadingContent}
      <MedicalDetailMiniMapBox
        name={name}
        latitude={latitude}
        longitude={longitude}
        address={address}
        mapKind={mapKind}
      />
      <View className="mt-3 flex-row items-start gap-3">
        <View className="flex-1">
          <MedicalDetailText variant="title">{name}</MedicalDetailText>
          {address?.trim() ? (
            <MedicalDetailText variant="secondary">{address.trim()}</MedicalDetailText>
          ) : null}
          {titleExtras}
        </View>
        {callPhone ? (
          <MedicalDetailCallButton
            facilityName={name}
            phone={callPhone}
            sublabel={phoneSublabel}
          />
        ) : null}
      </View>
      {distanceBlock ? <View className="mt-4">{distanceBlock}</View> : null}
      <KakaoMapDirectionsButton
        name={name}
        latitude={latitude}
        longitude={longitude}
        address={address}
      />
    </View>
  );
}

export function KakaoMapDirectionsButton({
  name,
  latitude,
  longitude,
  address,
}: {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const hasCoords =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    !(latitude === 0 && longitude === 0);
  const hasAddress = Boolean(address?.trim());

  if (!hasCoords && !hasAddress) {
    return null;
  }

  const handlePress = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    try {
      await openKakaoMapDirections({
        name,
        latitude,
        longitude,
        address,
      });
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <Pressable
      style={[styles.directionsButton, isNavigating ? styles.directionsButtonDisabled : null]}
      accessibilityRole="button"
      accessibilityLabel="카카오맵 길찾기"
      accessibilityState={{ disabled: isNavigating, busy: isNavigating }}
      disabled={isNavigating}
      onPress={() => void handlePress()}
    >
      {isNavigating ? (
        <ActivityIndicator size="small" color="#191919" />
      ) : (
        <Ionicons name="navigate" size={18} color="#191919" />
      )}
      <Text style={styles.directionsButtonText}>
        {isNavigating ? '위치 확인 중…' : '카카오맵 길찾기'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: MEDICAL_DETAIL.background,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: MEDICAL_DETAIL.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: MEDICAL_DETAIL.text,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: MEDICAL_DETAIL.text,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    color: MEDICAL_DETAIL.textSecondary,
  },
  muted: {
    fontSize: 12,
    lineHeight: 18,
    color: MEDICAL_DETAIL.textMuted,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MEDICAL_DETAIL.border,
    backgroundColor: MEDICAL_DETAIL.card,
    padding: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: MEDICAL_DETAIL.card,
    borderWidth: 1,
    borderColor: MEDICAL_DETAIL.border,
    padding: 12,
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 12,
    color: MEDICAL_DETAIL.textSecondary,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700',
    color: MEDICAL_DETAIL.text,
  },
  directionsButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#FEE500',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  directionsButtonDisabled: {
    opacity: 0.75,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191919',
  },
  locationHeader: {
    marginBottom: 12,
  },
  miniMapWrap: {
    height: 128,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: MEDICAL_DETAIL.border,
    backgroundColor: MEDICAL_DETAIL.card,
  },
  miniMapPlaceholder: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  miniMapPlaceholderTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: MEDICAL_DETAIL.textSecondary,
  },
  miniMapPlaceholderText: {
    marginTop: 4,
    fontSize: 11,
    color: MEDICAL_DETAIL.textMuted,
    textAlign: 'center',
  },
});
