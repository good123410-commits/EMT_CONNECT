import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import type { MapMarkerKind } from '@/components/map/EmergencyMapView.types';

export type { MapMarkerKind } from '@/components/map/EmergencyMapView.types';

type MapPointMarkerProps = {
  id: string;
  latitude: number;
  longitude: number;
  kind: MapMarkerKind;
  selected?: boolean;
  moonlight?: boolean;
  onPress: () => void;
};

const KIND_COLORS: Record<MapMarkerKind, string> = {
  aed: '#dc2626',
  er: '#2563eb',
  pharmacy: '#16a34a',
  pediatric: '#db2777',
};

const KIND_ICONS: Record<MapMarkerKind, keyof typeof Ionicons.glyphMap> = {
  aed: 'heart',
  er: 'medkit',
  pharmacy: 'medical',
  pediatric: 'happy',
};

function MapPointMarkerComponent({
  id,
  latitude,
  longitude,
  kind,
  selected,
  moonlight = false,
  onPress,
}: MapPointMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const color = moonlight ? '#4f46e5' : KIND_COLORS[kind];

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timer);
  }, [selected, kind, moonlight]);

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      zIndex={selected ? 3 : moonlight ? 2 : 1}
    >
      <View
        style={[
          styles.pin,
          selected && styles.pinSelected,
          moonlight && styles.pinMoonlight,
          { borderColor: color },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: selected ? color : '#ffffff' }]}>
          <Ionicons
            name={KIND_ICONS[kind]}
            size={16}
            color={selected ? '#ffffff' : color}
          />
        </View>
      </View>
    </Marker>
  );
}

export const MapPointMarker = memo(MapPointMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 18,
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  pinSelected: {
    transform: [{ scale: 1.12 }],
  },
  pinMoonlight: {
    borderWidth: 3,
    shadowColor: '#4f46e5',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
