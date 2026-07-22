import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_POLICY_ACK_KEY = 'ems_service_policy_ack_v1';

export async function hasAcknowledgedServicePolicy(): Promise<boolean> {
  const value = await AsyncStorage.getItem(SERVICE_POLICY_ACK_KEY);
  return value === 'true';
}

export async function acknowledgeServicePolicy(): Promise<void> {
  await AsyncStorage.setItem(SERVICE_POLICY_ACK_KEY, 'true');
  // TODO: Supabase user_consents 테이블에 동의 시각 기록
}
