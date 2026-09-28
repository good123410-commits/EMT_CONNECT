import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type AdminMonitorMessageRow = {
  id: string;
  anonymousLabel: string;
  content: string;
  timeLabel: string;
};

type AdminChatRoomMessageMonitorProps = {
  monitorOpen: boolean;
  onToggleMonitor: () => void;
  monitorHeaderTitle: string;
  selectedRoomId: string | null;
  emptyRoomHint: string;
  messagesLoading: boolean;
  visibleMessages: AdminMonitorMessageRow[];
  submitting: boolean;
  messageSelectionMode: boolean;
  selectedMessageIds: Set<string>;
  onEnterSelectionMode: () => void;
  onClearMessageSelection: () => void;
  onToggleSelectAll: () => void;
  allVisibleSelected: boolean;
  onToggleMessageSelection: (messageId: string) => void;
  onOpenDeleteConfirm: () => void;
};

export function AdminChatRoomMessageMonitor({
  monitorOpen,
  onToggleMonitor,
  monitorHeaderTitle,
  selectedRoomId,
  emptyRoomHint,
  messagesLoading,
  visibleMessages,
  submitting,
  messageSelectionMode,
  selectedMessageIds,
  onEnterSelectionMode,
  onClearMessageSelection,
  onToggleSelectAll,
  allVisibleSelected,
  onToggleMessageSelection,
  onOpenDeleteConfirm,
}: AdminChatRoomMessageMonitorProps) {
  const renderToolbar = () => {
    if (!selectedRoomId || visibleMessages.length === 0) {
      return null;
    }

    return (
      <View className="mb-2 flex-row flex-wrap items-center gap-2 border-b border-kemix-border-light px-4 pb-3">
        <Pressable
          className={`rounded-lg px-2.5 py-1 ${messageSelectionMode ? 'bg-violet-100' : 'bg-kemix-bg'}`}
          onPress={() => {
            if (messageSelectionMode) onClearMessageSelection();
            else onEnterSelectionMode();
          }}
        >
          <Text
            className={`text-[11px] font-bold ${messageSelectionMode ? 'text-violet-800' : 'text-kemix-text-secondary'}`}
          >
            {messageSelectionMode ? '선택 취소' : '선택'}
          </Text>
        </Pressable>
        {messageSelectionMode ? (
          <>
            <Pressable className="rounded-lg bg-kemix-bg px-2.5 py-1" onPress={onToggleSelectAll}>
              <Text className="text-[11px] font-bold text-kemix-text-secondary">
                {allVisibleSelected ? '전체 해제' : '전체 선택'}
              </Text>
            </Pressable>
            <Pressable
              className={`rounded-lg px-2.5 py-1 ${selectedMessageIds.size > 0 ? 'bg-red-100' : 'bg-kemix-bg'}`}
              disabled={selectedMessageIds.size === 0 || submitting}
              onPress={onOpenDeleteConfirm}
            >
              <Text
                className={`text-[11px] font-bold ${selectedMessageIds.size > 0 ? 'text-red-700' : 'text-kemix-muted'}`}
              >
                선택 삭제 ({selectedMessageIds.size})
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  };

  const renderMessage = ({ item: message }: { item: AdminMonitorMessageRow }) => {
    const checked = selectedMessageIds.has(message.id);
    return (
      <Pressable
        className={`mb-2 rounded-xl border p-3 ${checked ? 'border-violet-400 bg-violet-50' : 'border-kemix-border-light bg-kemix-bg'}`}
        onPress={() => {
          if (messageSelectionMode) onToggleMessageSelection(message.id);
        }}
        disabled={!messageSelectionMode}
      >
        <View className="flex-row items-start gap-2">
          {messageSelectionMode ? (
            <Ionicons
              name={checked ? 'checkbox' : 'square-outline'}
              size={20}
              color={checked ? '#6d28d9' : '#94a3b8'}
              style={{ marginTop: 1 }}
            />
          ) : null}
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-bold text-kemix-text">{message.anonymousLabel}</Text>
              <Text className="text-[10px] text-kemix-muted">{message.timeLabel}</Text>
            </View>
            <Text className="mt-1 text-sm leading-5 text-kemix-text">{message.content}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        className="mt-2 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3 active:bg-kemix-bg"
        onPress={onToggleMonitor}
        accessibilityRole="button"
        accessibilityState={{ expanded: monitorOpen }}
      >
        <Text className="flex-1 pr-2 text-sm font-bold text-kemix-text">{monitorHeaderTitle}</Text>
        <Ionicons name={monitorOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
      </Pressable>

      <Modal
        visible={monitorOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={onToggleMonitor}
      >
        <SafeAreaView className="flex-1 bg-kemix-surface" edges={['top', 'bottom']}>
          <View style={styles.fullscreenHeader}>
            <View className="min-w-0 flex-1 pr-3">
              <Text className="text-xs font-semibold text-kemix-muted">대화 모니터링</Text>
              <Text className="mt-0.5 text-base font-bold text-kemix-text" numberOfLines={2}>
                {monitorHeaderTitle}
              </Text>
            </View>
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-kemix-bg active:opacity-80"
              onPress={onToggleMonitor}
              accessibilityRole="button"
              accessibilityLabel="모니터링 닫기"
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>

          {renderToolbar()}

          {!selectedRoomId ? (
            <View style={styles.centerFill}>
              <Text className="px-6 text-center text-sm leading-6 text-kemix-text-secondary">
                {emptyRoomHint}
              </Text>
            </View>
          ) : messagesLoading ? (
            <View style={styles.centerFill}>
              <ActivityIndicator color="#7c3aed" size="large" />
            </View>
          ) : (
            <FlatList
              data={visibleMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              showsVerticalScrollIndicator
              ListEmptyComponent={
                <Text className="py-12 text-center text-sm text-kemix-text-secondary">
                  메시지가 없습니다.
                </Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    flex: 1,
    minHeight: 0,
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
});
