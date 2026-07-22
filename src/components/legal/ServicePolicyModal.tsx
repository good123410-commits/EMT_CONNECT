import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServicePolicyContent } from '@/components/legal/ServicePolicyContent';
import { SERVICE_POLICY_TITLE } from '@/constants/servicePolicyContent';

type ServicePolicyModalProps = {
  visible: boolean;
  onClose?: () => void;
  /** 최초 진입 시 확인 버튼 표시 */
  requireAcknowledgment?: boolean;
  onAcknowledge?: () => void | Promise<void>;
  acknowledging?: boolean;
};

export function ServicePolicyModal({
  visible,
  onClose,
  requireAcknowledgment = false,
  onAcknowledge,
  acknowledging = false,
}: ServicePolicyModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={requireAcknowledgment ? undefined : onClose}>
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-bold text-slate-900">{SERVICE_POLICY_TITLE}</Text>
            {requireAcknowledgment ? (
              <Text className="mt-0.5 text-xs text-slate-500">커뮤니티 이용 전 필수 확인</Text>
            ) : null}
          </View>
          {!requireAcknowledgment ? (
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView className="flex-1 px-4 py-5" contentContainerClassName="pb-8">
          <ServicePolicyContent />
        </ScrollView>

        {requireAcknowledgment ? (
          <View className="border-t border-slate-200 bg-white px-4 pb-6 pt-4">
            <Pressable
              className={`items-center rounded-2xl py-4 ${acknowledging ? 'bg-slate-300' : 'bg-slate-900'}`}
              disabled={acknowledging}
              onPress={() => void onAcknowledge?.()}
            >
              {acknowledging ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">확인했습니다</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="border-t border-slate-200 bg-white px-4 pb-6 pt-4">
            <Pressable
              className="items-center rounded-2xl border border-slate-200 py-3.5 active:bg-slate-50"
              onPress={() => onClose?.()}
            >
              <Text className="font-semibold text-slate-700">닫기</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
