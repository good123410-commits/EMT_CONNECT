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
      className="items-center justify-center overflow-hidden rounded-2xl bg-kemix-elevated"
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
        <View
          style={{
            width: size * 0.42,
            height: size * 0.2,
            borderRadius: size * 0.1,
            backgroundColor: '#cbd5e1',
            borderWidth: 1,
            borderColor: '#94a3b8',
          }}
        />
      )}
    </View>
  );
}
