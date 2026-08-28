import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ActivityIndicator, Alert, ScrollView, Switch, Text, View } from 'react-native';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  adminDeleteContentShortcode,
  adminListContentShortcodes,
  adminUpsertContentShortcode,
} from '@/services/shortcodeService';
import type {
  ContentShortcode,
  ShortcodeActionType,
  ShortcodeTargetRole,
  UpsertContentShortcodeInput,
} from '@/types/shortcode';

const EMPTY_FORM: UpsertContentShortcodeInput = {
  shortcut: '',
  title: '',
  action_type: 'template',
  action_payload: { body: '' },
  target_role: 'all',
  sort_order: 0,
  is_active: true,
};

function actionTypeLabel(type: ShortcodeActionType): string {
  switch (type) {
    case 'call_button':
      return '전화 버튼';
    case 'ad_banner':
      return '광고 배너';
    case 'template':
      return '글 양식';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function AdminShortcodesPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<ContentShortcode[]>([]);
  const [form, setForm] = useState<UpsertContentShortcodeInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminListContentShortcodes();
      setRows(data);
    } catch (error) {
      Alert.alert('조회 실패', error instanceof Error ? error.message : '숏코드를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (row: ContentShortcode) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      shortcut: row.shortcut,
      title: row.title,
      action_type: row.action_type,
      action_payload: row.action_payload,
      target_role: row.target_role,
      sort_order: row.sort_order,
      is_active: row.is_active,
    });
  };

  const setActionType = (actionType: ShortcodeActionType) => {
    setForm((prev) => {
      if (prev.action_type === actionType) return prev;
      switch (actionType) {
        case 'call_button':
          return { ...prev, action_type: actionType, action_payload: { phone: '119', label: '' } };
        case 'ad_banner':
          return { ...prev, action_type: actionType, action_payload: { bannerId: '' } };
        case 'template':
          return { ...prev, action_type: actionType, action_payload: { body: '' } };
        default: {
          const _exhaustive: never = actionType;
          return _exhaustive;
        }
      }
    });
  };

  const handleSave = async () => {
    if (!form.shortcut.trim() || !form.title.trim()) {
      Alert.alert('입력 확인', '숏코드 키워드와 제목은 필수입니다.');
      return;
    }

    setSaving(true);
    try {
      await adminUpsertContentShortcode({
        ...form,
        shortcut: form.shortcut.trim(),
        title: form.title.trim(),
      });
      await reload();
      resetForm();
      Alert.alert('저장 완료', '숏코드가 반영되었습니다.');
    } catch (error) {
      Alert.alert('저장 실패', error instanceof Error ? error.message : '숏코드 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ContentShortcode) => {
    Alert.alert('숏코드 삭제', `"${row.title}" 숏코드를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await adminDeleteContentShortcode(row.id);
              if (editingId === row.id) resetForm();
              await reload();
            } catch (error) {
              Alert.alert('삭제 실패', error instanceof Error ? error.message : '삭제에 실패했습니다.');
            }
          })();
        },
      },
    ]);
  };

  const renderActionFields = () => {
    switch (form.action_type) {
      case 'call_button':
        return (
          <>
            <AdminFormField
              label="전화번호"
              value={(form.action_payload as { phone?: string }).phone ?? ''}
              onChangeText={(phone) =>
                setForm((prev) => ({
                  ...prev,
                  action_payload: { ...(prev.action_payload as object), phone },
                }))
              }
              keyboardType="phone-pad"
              placeholder="119"
            />
            <AdminFormField
              label="버튼 라벨"
              value={(form.action_payload as { label?: string }).label ?? ''}
              onChangeText={(label) =>
                setForm((prev) => ({
                  ...prev,
                  action_payload: { ...(prev.action_payload as object), label },
                }))
              }
              placeholder="응급 신고 119"
            />
          </>
        );
      case 'ad_banner':
        return (
          <AdminFormField
            label="배너 ID (선택)"
            value={(form.action_payload as { bannerId?: string }).bannerId ?? ''}
            onChangeText={(bannerId) =>
              setForm((prev) => ({
                ...prev,
                action_payload: { bannerId },
              }))
            }
            placeholder="비우면 최신 활성 배너"
          />
        );
      case 'template':
        return (
          <AdminFormField
            label="양식 본문"
            value={(form.action_payload as { body?: string }).body ?? ''}
            onChangeText={(body) =>
              setForm((prev) => ({
                ...prev,
                action_payload: { body },
              }))
            }
            multiline
            placeholder="삽입될 글 양식 내용"
          />
        );
      default: {
        const _exhaustive: never = form.action_type;
        return _exhaustive;
      }
    }
  };

  if (loading) {
    return (
      <View className="items-center py-16">
        <ActivityIndicator color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
      <View className="mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
        <Text className="text-sm font-bold text-violet-900">숏코드 트리거 안내</Text>
        <Text className="mt-2 text-xs leading-5 text-violet-800">
          {'• 관리자: 입력창에 [@ㅅ@] 를 입력하면 전체 숏코드 메뉴가 열립니다.\n'}
          {'• 일반 유저: @ 를 입력하면 target_role이 all인 숏코드만 노출됩니다.'}
        </Text>
      </View>

      <View className="mb-4 rounded-2xl border border-kemix-border bg-kemix-surface p-4">
        <Text className="mb-3 text-sm font-bold text-kemix-text">
          {editingId ? '숏코드 수정' : '새 숏코드 등록'}
        </Text>
        <AdminFormField
          label="숏코드 키워드"
          value={form.shortcut}
          onChangeText={(shortcut) => setForm((prev) => ({ ...prev, shortcut }))}
          placeholder="[call:119]"
        />
        <AdminFormField
          label="노출 이름"
          value={form.title}
          onChangeText={(title) => setForm((prev) => ({ ...prev, title }))}
          placeholder="119 긴급 전화"
        />

        <Text className="mb-1.5 text-xs font-bold text-kemix-text-secondary">동작 유형</Text>
        <View className="mb-3 flex-row flex-wrap gap-2">
          {(['call_button', 'ad_banner', 'template'] as ShortcodeActionType[]).map((type) => {
            const active = form.action_type === type;
            return (
              <Pressable
                key={type}
                onPress={() => setActionType(type)}
                className={`rounded-full border px-3 py-1.5 ${active ? 'border-violet-700 bg-violet-700' : 'border-kemix-border bg-kemix-bg'}`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-kemix-text-secondary'}`}>
                  {actionTypeLabel(type)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {renderActionFields()}

        <Text className="mb-1.5 text-xs font-bold text-kemix-text-secondary">접근 권한</Text>
        <View className="mb-3 flex-row gap-2">
          {(['admin', 'all'] as ShortcodeTargetRole[]).map((role) => {
            const active = form.target_role === role;
            return (
              <Pressable
                key={role}
                onPress={() => setForm((prev) => ({ ...prev, target_role: role }))}
                className={`rounded-full border px-3 py-1.5 ${active ? 'border-violet-700 bg-violet-700' : 'border-kemix-border bg-kemix-bg'}`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-kemix-text-secondary'}`}>
                  {role === 'admin' ? '관리자 전용' : '전체 유저'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AdminFormField
          label="정렬 순서"
          value={String(form.sort_order)}
          onChangeText={(value) =>
            setForm((prev) => ({ ...prev, sort_order: Number.parseInt(value, 10) || 0 }))
          }
          keyboardType="numeric"
        />

        <View className="mb-4 flex-row items-center justify-between rounded-xl border border-kemix-border px-3 py-2.5">
          <Text className="text-sm font-semibold text-kemix-text">활성화</Text>
          <Switch
            value={form.is_active}
            onValueChange={(is_active) => setForm((prev) => ({ ...prev, is_active }))}
          />
        </View>

        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 items-center rounded-xl bg-violet-700 py-3 active:opacity-90"
            disabled={saving}
            onPress={() => void handleSave()}
          >
            <Text className="text-sm font-bold text-white">{saving ? '저장 중…' : '저장'}</Text>
          </Pressable>
          {editingId ? (
            <Pressable
              className="items-center rounded-xl border border-kemix-border px-4 py-3 active:opacity-90"
              onPress={resetForm}
            >
              <Text className="text-sm font-semibold text-kemix-text-secondary">취소</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text className="mb-2 text-sm font-bold text-kemix-text">등록된 숏코드 ({rows.length})</Text>
      {rows.map((row) => (
        <View
          key={row.id}
          className="mb-2 rounded-2xl border border-kemix-border bg-kemix-surface p-4"
        >
          <View className="flex-row items-start justify-between">
            <View className="mr-3 flex-1">
              <Text className="text-sm font-bold text-kemix-text">{row.title}</Text>
              <Text className="mt-1 text-xs text-kemix-text-secondary">{row.shortcut}</Text>
              <Text className="mt-1 text-[11px] text-kemix-muted">
                {actionTypeLabel(row.action_type)} · {row.target_role === 'admin' ? '관리자' : '전체'} · 순서 {row.sort_order}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable onPress={() => startEdit(row)} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color="#64748b" />
              </Pressable>
              <Pressable onPress={() => handleDelete(row)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </View>
          </View>
          {!row.is_active ? (
            <Text className="mt-2 text-[11px] font-semibold text-amber-700">비활성</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
