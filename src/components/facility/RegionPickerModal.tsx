import { useMemo } from 'react';
import { Pressable, FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_FONT } from '@/constants/appTheme';
import { KEMIX_TOUCH_MIN_HEIGHT } from '@/theme/kemixSemantic';
import { useThemedColors } from '@/hooks/useThemedColors';

type RegionPickerModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const LIST_MAX_HEIGHT = 360;

export function RegionPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: RegionPickerModalProps) {
  const { colors, semantic, status } = useThemedColors();
  const insets = useSafeAreaInsets();

  const scrimStyle = useMemo(
    () => ({ backgroundColor: colors.overlay }),
    [colors.overlay],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={scrimStyle} onPress={onClose}>
        <Pressable
          className="rounded-t-3xl bg-kemix-elevated"
          style={{ maxHeight: '72%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="border-b border-kemix-border-light px-4 py-3">
            <Text className="text-base text-kemix-text" style={{ fontFamily: APP_FONT.bold }}>
              {title}
            </Text>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={{ maxHeight: LIST_MAX_HEIGHT }}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: Math.max(insets.bottom, 20),
            }}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: option }) => {
              const active = selected === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className="border-b border-kemix-border-light px-4"
                  style={{
                    minHeight: KEMIX_TOUCH_MIN_HEIGHT,
                    justifyContent: 'center',
                    paddingVertical: 12,
                    backgroundColor: active ? status.gps.bg : 'transparent',
                  }}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <Text
                    className="text-sm text-kemix-text"
                    style={{
                      fontFamily: active ? APP_FONT.bold : APP_FONT.regular,
                      color: active ? status.gps.fg : semantic.text,
                    }}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
