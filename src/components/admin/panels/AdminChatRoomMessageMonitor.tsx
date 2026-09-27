import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

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
  return (
    <>
      <Pressable
        className="mt-2 flex-row items-center justify-between rounded-xl border border-kemix-border bg-kemix-surface px-4 py-3 active:bg-kemix-bg"
        onPress={onToggleMonitor}
      >
        <Text className="flex-1 pr-2 text-sm font-bold text-kemix-text">{monitorHeaderTitle}</Text>
        <Ionicons name={monitorOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
      </Pressable>

      {monitorOpen ? (
        <View className="mt-2 min-h-0 flex-1 rounded-2xl border border-kemix-border bg-kemix-surface p-3">
          {!selectedRoomId ? (
            <Text className="py-6 text-center text-sm text-kemix-text-secondary">{emptyRoomHint}</Text>
          ) : messagesLoading ? (
            <ActivityIndicator color="#7c3aed" className="py-6" />
          ) : (
            <>
              {visibleMessages.length > 0 ? (
                <View className="mb-2 flex-row flex-wrap items-center gap-2">
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
              ) : null}
              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {visibleMessages.length === 0 ? (
                  <Text className="py-8 text-center text-sm text-kemix-text-secondary">메시지가 없습니다.</Text>
                ) : (
                  visibleMessages.map((message) => {
                    const checked = selectedMessageIds.has(message.id);
                    return (
                      <Pressable
                        key={message.id}
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
                            <Text className="mt-1 text-sm text-kemix-text">{message.content}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>
      ) : null}
    </>
  );
}
