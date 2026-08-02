import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { EmergencyQrCard } from '@/components/utilities/EmergencyQrCard';
import type { EmergencyContactCardData } from '@/types/emergencyContactCard';
import { hasEmergencyCardContent } from '@/utils/emergencyCardEncoding';

type EmergencyPublicCardProps = {
  data: EmergencyContactCardData;
  variant?: 'dark' | 'light';
};

export function EmergencyPublicCard({ data, variant = 'dark' }: EmergencyPublicCardProps) {
  const isDark = variant === 'dark';
  const ready = hasEmergencyCardContent(data);

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="medical" size={22} color="#fff" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>KEMIX 응급 의료 카드</Text>
          <Text style={styles.headerSubtitle}>Emergency Medical Profile</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SOS</Text>
        </View>
      </View>

      <View style={[styles.body, isDark ? styles.bodyDark : styles.bodyLight]}>
        {ready ? (
          <>
            <Text style={[styles.lead, isDark ? styles.leadDark : styles.leadLight]}>
              개인정보는 QR 스캔 후에만 확인됩니다
            </Text>
            <Text style={[styles.leadSub, isDark ? styles.leadSubDark : styles.leadSubLight]}>
              구급대원·보호자가 스마트폰으로 아래 QR을 스캔하면 응급 연락망과 의료 정보를 확인할 수
              있습니다.
            </Text>
            <View style={styles.qrWrap}>
              <EmergencyQrCard data={data} variant={variant} />
            </View>
          </>
        ) : (
          <View style={styles.emptyWrap}>
            <Ionicons name="alert-circle-outline" size={40} color={isDark ? '#fca5a5' : '#dc2626'} />
            <Text style={[styles.emptyTitle, isDark ? styles.leadDark : styles.leadLight]}>
              등록된 응급 정보가 없습니다
            </Text>
            <Text style={[styles.emptySub, isDark ? styles.leadSubDark : styles.leadSubLight]}>
              앱에서 응급 정보를 저장한 뒤 다시 열어 주세요.
            </Text>
          </View>
        )}

        <View style={[styles.footer, isDark ? styles.footerDark : styles.footerLight]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
          <Text style={[styles.footerText, isDark ? styles.footerTextDark : styles.footerTextLight]}>
            잠금화면·위젯에는 전화번호·병력이 표시되지 않습니다
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardDark: {
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: '#0f172a',
  },
  cardLight: {
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  headerDark: {
    backgroundColor: '#991b1b',
  },
  headerLight: {
    backgroundColor: '#dc2626',
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  body: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  bodyDark: {
    backgroundColor: '#111827',
  },
  bodyLight: {
    backgroundColor: '#fff7f7',
  },
  lead: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  leadDark: {
    color: '#f8fafc',
  },
  leadLight: {
    color: '#0f172a',
  },
  leadSub: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
  leadSubDark: {
    color: '#94a3b8',
  },
  leadSubLight: {
    color: '#64748b',
  },
  qrWrap: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  footerDark: {
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  footerLight: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  footerTextDark: {
    color: '#94a3b8',
  },
  footerTextLight: {
    color: '#64748b',
  },
});
