import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserRole } from '@/contexts/UserRoleContext';

type GuideAdminCodeModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function GuideAdminCodeModal({ visible, onClose }: GuideAdminCodeModalProps) {
  const insets = useSafeAreaInsets();
  const { verifyGuideAdminCode, isGuideAdmin } = useUserRole();
  const [code, setCode] = useState('');

  const handleVerify = () => {
    const ok = verifyGuideAdminCode(code);
    if (ok) {
      Alert.alert('인증 완료', '가이드 관리자 권한이 활성화되었습니다.');
      setCode('');
      onClose();
      return;
    }
    Alert.alert('인증 실패', '관리자 비밀코드가 올바르지 않습니다.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-2xl bg-white p-5"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-900">관리자 인증</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </Pressable>
          </View>

          <Text className="mb-3 text-sm leading-5 text-slate-600">
            가이드 관리자 비밀코드를 입력하면 글쓰기 기능이 활성화됩니다.
            {isGuideAdmin ? '\n\n현재 관리자 권한이 적용 중입니다.' : ''}
          </Text>

          <TextInput
            className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900"
            value={code}
            onChangeText={setCode}
            placeholder="관리자 비밀코드"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Pressable className="items-center rounded-xl bg-slate-900 py-3" onPress={handleVerify}>
            <Text className="font-bold text-white">인증하기</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
