import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, View } from 'react-native';

type MedicineImageProps = {
  uri?: string | null;
  size?: number;
};

export function MedicineImage({ uri, size = 72 }: MedicineImageProps) {
  const [failed, setFailed] = useState(false);
  const trimmed = uri?.trim();
  const showImage = Boolean(trimmed) && !failed;

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-2xl bg-slate-100"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          source={{ uri: trimmed }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Ionicons name="medical" size={size * 0.42} color="#94a3b8" />
      )}
    </View>
  );
}
