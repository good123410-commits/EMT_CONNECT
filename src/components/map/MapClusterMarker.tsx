import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

type MapClusterMarkerProps = {
  id: string;
  latitude: number;
  longitude: number;
  pointCount: number;
  onPress: () => void;
};

function MapClusterMarkerComponent({
  id,
  latitude,
  longitude,
  pointCount,
  onPress,
}: MapClusterMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 300);
    return () => clearTimeout(timer);
  }, [pointCount]);

  const size = pointCount >= 100 ? 44 : pointCount >= 20 ? 38 : 32;

  return (
    <Marker
      identifier={id}
      coordinate={{ latitude, longitude }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.count}>{pointCount}</Text>
      </View>
    </Marker>
  );
}

export const MapClusterMarker = memo(MapClusterMarkerComponent);

const styles = StyleSheet.create({
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  count: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
