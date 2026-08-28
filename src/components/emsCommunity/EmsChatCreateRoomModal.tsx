import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import {
  LoungeInput,
  LoungePrimaryButton,
} from '@/components/emsCommunity/loungeUi';
import { EMS_LOUNGE_SPACING, useEmsLoungeTheme } from '@/constants/emsLoungeTheme';
import {
  EMS_CHAT_CATEGORIES,
  type EmsChatCategory,
} from '@/services/emsChatRoomService';

const EMPTY_FORM = {
  roomName: '',
  region: '',
  category: '지역' as EmsChatCategory,
  description: '',
};

type EmsChatCreateRoomModalProps = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    roomName: string;
    region?: string;
    category?: string;
    description?: string;
  }) => Promise<void>;
};

export function EmsChatCreateRoomModal({
  visible,
  submitting,
  onClose,
  onSubmit,
}: EmsChatCreateRoomModalProps) {
  const { lounge } = useEmsLoungeTheme();
  const [form, setForm] = useState(EMPTY_FORM);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit({
      roomName: form.roomName,
      region: form.region || undefined,
      category: form.category,
      description: form.description || undefined,
    });
    setForm(EMPTY_FORM);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: lounge.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: EMS_LOUNGE_SPACING.screen,
            paddingTop: 24,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              marginBottom: 4,
              fontFamily: 'Pretendard-Bold',
              fontSize: 20,
              color: lounge.text,
            }}
          >
            채팅방 개설하기
          </Text>
          <Text
            style={{
              marginBottom: 20,
              fontFamily: 'Pretendard',
              fontSize: 14,
              color: lounge.textSecondary,
            }}
          >
            주제·지역별 오픈채팅방을 만들고 실시간으로 소통해 보세요.
          </Text>

          <Text
            style={{
              marginBottom: 8,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 14,
              color: lounge.text,
            }}
          >
            방 제목
          </Text>
          <LoungeInput
            value={form.roomName}
            onChangeText={(roomName) => setForm((prev) => ({ ...prev, roomName }))}
            placeholder="예: 강원 현장 소통방"
          />

          <Text
            style={{
              marginBottom: 8,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 14,
              color: lounge.text,
            }}
          >
            분류
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {EMS_CHAT_CATEGORIES.map((category) => {
              const active = form.category === category;
              return (
                <Pressable
                  key={category}
                  className="rounded-full px-3 py-2 active:opacity-90"
                  style={{
                    backgroundColor: active ? lounge.accent : lounge.surface,
                    borderWidth: 1,
                    borderColor: active ? lounge.accent : lounge.border,
                  }}
                  onPress={() => setForm((prev) => ({ ...prev, category }))}
                >
                  <Text
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: 12,
                      color: active ? '#fff' : lounge.textSecondary,
                    }}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              marginBottom: 8,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 14,
              color: lounge.text,
            }}
          >
            지역 (선택)
          </Text>
          <LoungeInput
            value={form.region}
            onChangeText={(region) => setForm((prev) => ({ ...prev, region }))}
            placeholder="예: 강원특별자치도"
          />

          <Text
            style={{
              marginBottom: 8,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: 14,
              color: lounge.text,
            }}
          >
            방 소개 (선택)
          </Text>
          <TextInput
            style={{
              marginBottom: 24,
              minHeight: 80,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: lounge.border,
              backgroundColor: lounge.surface,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontFamily: 'Pretendard',
              fontSize: 14,
              color: lounge.text,
              textAlignVertical: 'top',
            }}
            placeholder="채팅방 이용 안내를 간단히 적어 주세요."
            placeholderTextColor={lounge.textMuted}
            value={form.description}
            onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
            multiline
            maxLength={200}
          />

          <LoungePrimaryButton
            label={submitting ? '개설 중…' : '채팅방 개설'}
            onPress={() => {
              if (!submitting) void handleSubmit();
            }}
            icon="add-circle-outline"
          />

          <Pressable className="mt-3 items-center py-2" onPress={handleClose}>
            <Text
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: 14,
                color: lounge.textMuted,
              }}
            >
              취소
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
