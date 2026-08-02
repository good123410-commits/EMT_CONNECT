// DISABLED: 비상연락망 & 응급카드 (ICE) — 기능 일시 비활성화

export function EmergencyQrCard() { return null; }

/*
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getEmergencyShareUrl } from '@/utils/emergencyCardEncoding';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';

type EmergencyQrCardProps = {
  data: EmergencyContactCardData;
  size?: number;
  variant?: 'dark' | 'light';
  onPressUrl?: string;
};

export function EmergencyQrCard({
  data,
  size = 208,
  variant = 'dark',
  onPressUrl,
}: EmergencyQrCardProps) {
  const shareUrl = onPressUrl ?? getEmergencyShareUrl(data);
  const isDark = variant === 'dark';

  const handleOpen = () => {
    void Linking.openURL(shareUrl).catch(() => undefined);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="응급 의료 정보 QR 코드. 탭하면 웹 프로필을 엽니다."
      onPress={handleOpen}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <View style={[styles.qrFrame, isDark ? styles.qrFrameDark : styles.qrFrameLight]}>
        <QRCode
          value={shareUrl}
          size={size}
          color={isDark ? '#0f172a' : '#111827'}
          backgroundColor="#ffffff"
          quietZone={10}
        />
      </View>
      <View style={styles.captionRow}>
        <Ionicons name="scan-outline" size={14} color={isDark ? '#fca5a5' : '#dc2626'} />
        <Text style={[styles.caption, isDark ? styles.captionDark : styles.captionLight]}>
          응급 시 스캔해 주세요
        </Text>
      </View>
      <Text style={[styles.captionEn, isDark ? styles.captionEnDark : styles.captionEnLight]}>
        Emergency QR · Tap to open profile
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  qrFrame: {
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  qrFrameDark: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  qrFrameLight: {
    backgroundColor: '#ffffff',
    borderColor: '#fecaca',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  caption: {
    fontSize: 14,
    fontWeight: '700',
  },
  captionDark: {
    color: '#fecaca',
  },
  captionLight: {
    color: '#b91c1c',
  },
  captionEn: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  captionEnDark: {
    color: '#94a3b8',
  },
  captionEnLight: {
    color: '#64748b',
  },
});

*/
