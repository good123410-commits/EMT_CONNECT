import { Ionicons } from '@expo/vector-icons';
import { Pressable, ActivityIndicator, LayoutAnimation, Platform, Switch, Text, UIManager, View } from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import type { HomeCommerceItem } from '@/types/homeDashboard';
import { withStopPropagation } from '@/utils/pressEvent';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AdminCommerceCurationAccordionProps = {
  item: HomeCommerceItem;
  index: number;
  expanded: boolean;
  saving?: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<HomeCommerceItem>) => void;
  onSave: () => void;
  onDelete: () => void;
};

export function AdminCommerceCurationAccordion({
  item,
  index,
  expanded,
  saving = false,
  onToggle,
  onChange,
  onSave,
  onDelete,
}: AdminCommerceCurationAccordionProps) {
  const summaryTitle = item.title.trim() || '제목 없음';

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-kemix-border bg-kemix-surface">
      <View className="flex-row items-center px-3 py-3.5">
        <Pressable
          className="min-w-0 flex-1 flex-row items-center active:opacity-85"
          onPress={handleToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={18}
            color="#64748b"
          />
          <View className="ml-2 min-w-0 flex-1">
            <Text className="text-xs font-bold text-kemix-text-secondary">
              큐레이션 {index + 1}
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-kemix-text" numberOfLines={1}>
              {summaryTitle}
            </Text>
          </View>
        </Pressable>
        <Switch
          value={item.isActive}
          onValueChange={(value) => onChange({ isActive: value })}
        />
      </View>

      {expanded ? (
        <View className="border-t border-kemix-border-light px-3 pb-3 pt-2">
          <AdminFormField
            label="제목"
            value={item.title}
            onChangeText={(text) => onChange({ title: text })}
            placeholder="예: 가정용 체온계"
          />
          <AdminFormField
            label="설명"
            value={item.description}
            onChangeText={(text) => onChange({ description: text })}
            placeholder="상품·서비스 한 줄 설명"
            multiline
          />
          <AdminFormField
            label="제휴 링크 URL"
            value={item.partnerUrl}
            onChangeText={(text) => onChange({ partnerUrl: text })}
            placeholder="https://"
          />
          <AdminFormField
            label="제휴 표시명"
            value={item.partnerLabel}
            onChangeText={(text) => onChange({ partnerLabel: text })}
            placeholder="예: 쿠팡 파트너스, 네이버"
          />

          <View className="mt-1 flex-row gap-2">
            <Pressable
              className={`flex-1 items-center rounded-xl py-2.5 ${saving ? 'bg-violet-300' : 'bg-violet-600 active:bg-violet-700'}`}
              disabled={saving}
              onPress={withStopPropagation(onSave)}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-sm font-bold text-white">저장</Text>
              )}
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl border border-red-200 bg-red-50 py-2.5 active:bg-red-100"
              disabled={saving}
              onPress={withStopPropagation(onDelete)}
            >
              <Text className="text-sm font-bold text-red-600">삭제</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
