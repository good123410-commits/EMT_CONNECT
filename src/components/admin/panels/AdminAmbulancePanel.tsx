import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  fetchAdminPrivateAmbulanceCatalog,
  getAmbulanceSidoOptions,
  getAmbulanceSigunguOptionsForSido,
  refreshPrivateAmbulanceDbOverrides,
  resolveAmbulanceUpsertIds,
  type AdminPrivateAmbulanceCatalogItem,
} from '@/services/privateAmbulanceService';
import { adminDeletePrivateAmbulance, adminUpsertPrivateAmbulance, AdminServiceError } from '@/services/adminService';

const EMPTY_FORM = {
  name: '',
  vehicleType: '',
  vehicleCount: '1',
  region: '',
  address: '',
  phone: '',
  sido: '',
  sigungu: '',
};

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function AdminAmbulancePanel() {
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<AdminPrivateAmbulanceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminPrivateAmbulanceCatalogItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminPrivateAmbulanceCatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sidoOptions = useMemo(() => getAmbulanceSidoOptions(), []);
  const sigunguOptions = useMemo(
    () => (sido ? getAmbulanceSigunguOptionsForSido(sido) : []),
    [sido],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminPrivateAmbulanceCatalog({
        sido: sido || undefined,
        sigungu: sigungu || undefined,
        search: search.trim() || undefined,
        limit: 300,
      });
      setRows(data);
    } catch (error) {
      showAlert(
        '조회 실패',
        error instanceof AdminServiceError
          ? error.message
          : '민간 구급차 목록을 불러올 수 없습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [sido, sigungu, search]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const openCreate = () => {
    setEditingRow(null);
    setForm({ ...EMPTY_FORM, sido: sido || sidoOptions[0] || '', sigungu: sigungu || '' });
    setFormVisible(true);
  };

  const openEdit = (row: AdminPrivateAmbulanceCatalogItem) => {
    setEditingRow(row);
    setForm({
      name: row.name,
      vehicleType: row.vehicle_type ?? '',
      vehicleCount: String(row.vehicle_count),
      region: row.region ?? '',
      address: row.address ?? '',
      phone: row.phone,
      sido: row.sido,
      sigungu: row.sigungu,
    });
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.sido.trim() || !form.sigungu.trim()) {
      Alert.alert('입력 필요', '기관명, 전화, 시도, 시군구는 필수입니다.');
      return;
    }
    setSubmitting(true);
    try {
      const ids = editingRow ? resolveAmbulanceUpsertIds(editingRow) : {};
      await adminUpsertPrivateAmbulance({
        id: ids.dbId,
        externalId: ids.externalId,
        name: form.name.trim(),
        vehicleType: form.vehicleType.trim() || undefined,
        vehicleCount: Number(form.vehicleCount) || 1,
        region: form.region.trim() || `${form.sido} ${form.sigungu}`,
        address: form.address.trim() || undefined,
        phone: form.phone.trim(),
        sido: form.sido.trim(),
        sigungu: form.sigungu.trim(),
      });
      await refreshPrivateAmbulanceDbOverrides();
      setFormVisible(false);
      setEditingRow(null);
      await loadRows();
      showAlert('완료', editingRow ? '수정되었습니다.' : '등록되었습니다.');
    } catch (error) {
      showAlert('실패', error instanceof AdminServiceError ? error.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id.startsWith('bundled:')) {
      showAlert('안내', '기본 목록(앱 내장 CSV) 항목은 삭제할 수 없습니다. 내용 수정만 가능합니다.');
      setDeleteTarget(null);
      return;
    }
    setSubmitting(true);
    try {
      await adminDeletePrivateAmbulance(deleteTarget.id);
      await refreshPrivateAmbulanceDbOverrides();
      setDeleteTarget(null);
      await loadRows();
      showAlert('완료', '삭제되었습니다.');
    } catch (error) {
      showAlert('실패', error instanceof AdminServiceError ? error.message : '삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <Text className="mb-2 text-xs leading-5 text-slate-500">
        앱에 내장된 민간구급차 CSV 전체가 표시됩니다. 저장 시 Supabase에 반영되며 사용자 앱 검색에도 적용됩니다.
      </Text>
      <RegionFilterScroller>
        <FilterChip label="전체 시도" active={!sido} onPress={() => { setSido(''); setSigungu(''); }} />
        {sidoOptions.map((opt) => (
          <FilterChip
            key={opt}
            label={opt}
            active={sido === opt}
            onPress={() => { setSido(opt); setSigungu(''); }}
          />
        ))}
      </RegionFilterScroller>

      {sido ? (
        <RegionFilterScroller>
          <FilterChip label="전체 구군" active={!sigungu} onPress={() => setSigungu('')} />
          {sigunguOptions.map((opt) => (
            <FilterChip key={opt} label={opt} active={sigungu === opt} onPress={() => setSigungu(opt)} />
          ))}
        </RegionFilterScroller>
      ) : null}

      <AdminFormField label="기관명/전화 검색" value={search} onChangeText={setSearch} placeholder="검색어 입력 후 새로고침" />
      <View className="mb-3 flex-row gap-2">
        <Pressable className="flex-1 items-center rounded-xl bg-slate-200 py-2.5" onPress={() => void loadRows()}>
          <Text className="text-sm font-bold text-slate-700">새로고침</Text>
        </Pressable>
        <Pressable className="flex-1 items-center rounded-xl bg-violet-700 py-2.5" onPress={openCreate}>
          <Text className="text-sm font-bold text-white">+ 추가</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-12">
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.catalog_id}
          contentContainerClassName="pb-6"
          ListEmptyComponent={
            <Text className="py-8 text-center text-sm text-slate-500">
              조건에 맞는 민간 구급차가 없습니다.
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                {item.sido} {item.sigungu} · {item.phone}
              </Text>
              {item.vehicle_type ? (
                <Text className="mt-1 text-xs text-slate-600">
                  {item.vehicle_type} ({item.vehicle_count}대)
                </Text>
              ) : null}
              <View className="mt-2 flex-row gap-2">
                <Pressable className="rounded-lg bg-slate-100 px-2.5 py-1" onPress={() => openEdit(item)}>
                  <Text className="text-[11px] font-bold text-slate-700">수정</Text>
                </Pressable>
                <Pressable className="rounded-lg bg-red-100 px-2.5 py-1" onPress={() => setDeleteTarget(item)}>
                  <Text className="text-[11px] font-bold text-red-700">삭제</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={formVisible} animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <View className="flex-1 bg-slate-50">
          <ScrollView contentContainerClassName="p-4 pb-10">
            <Text className="mb-4 text-lg font-bold text-slate-900">
              {editingRow ? '민간 구급차 수정' : '민간 구급차 추가'}
            </Text>
            <AdminFormField label="기관명 *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
            <AdminFormField label="대표전화 *" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
            <AdminFormField label="시도 *" value={form.sido} onChangeText={(v) => setForm((p) => ({ ...p, sido: v }))} />
            <AdminFormField label="시군구 *" value={form.sigungu} onChangeText={(v) => setForm((p) => ({ ...p, sigungu: v }))} />
            <AdminFormField label="차종" value={form.vehicleType} onChangeText={(v) => setForm((p) => ({ ...p, vehicleType: v }))} />
            <AdminFormField label="보유 대수" value={form.vehicleCount} onChangeText={(v) => setForm((p) => ({ ...p, vehicleCount: v }))} keyboardType="numeric" />
            <AdminFormField label="지역 라벨" value={form.region} onChangeText={(v) => setForm((p) => ({ ...p, region: v }))} />
            <AdminFormField label="주소" value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} />
            <Pressable
              className={`items-center rounded-xl py-3 ${submitting ? 'bg-violet-300' : 'bg-violet-700'}`}
              disabled={submitting}
              onPress={() => void handleSave()}
            >
              <Text className="font-bold text-white">{submitting ? '저장 중...' : '저장'}</Text>
            </Pressable>
            <Pressable className="mt-3 items-center py-2" onPress={() => setFormVisible(false)}>
              <Text className="font-semibold text-slate-500">취소</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <AdminConfirmModal
        visible={!!deleteTarget}
        title="민간 구급차 삭제"
        message={`"${deleteTarget?.name}" 항목을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        destructive
        loading={submitting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const filterScrollerStyles = StyleSheet.create({
  track: {
    width: '100%',
    maxWidth: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  trackWeb: Platform.select({
    web: {
      overflowX: 'auto',
      overflowY: 'hidden',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    },
    default: {},
  }),
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingRight: 8,
    paddingVertical: 2,
    gap: 6,
  },
  chip: {
    flexGrow: 0,
    flexShrink: 0,
  },
});

function RegionFilterScroller({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      className="mb-2 w-full max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={[filterScrollerStyles.track, filterScrollerStyles.trackWeb]}
      contentContainerStyle={filterScrollerStyles.content}
    >
      {children}
    </ScrollView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={filterScrollerStyles.chip}
      className={`rounded-full px-3 py-1.5 ${active ? 'bg-violet-700' : 'bg-slate-100'}`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-600'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
