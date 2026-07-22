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
  Switch,
  Text,
  View,
} from 'react-native';
import { AdminConfirmModal } from '@/components/admin/AdminConfirmModal';
import { AdminFormField } from '@/components/admin/AdminFormField';
import {
  CUSTOM_HOSPITAL_TYPE_LABELS,
  type CustomHospitalType,
} from '@/types/customHospital';
import {
  fetchAdminCustomHospitalCatalog,
  formatDepartmentsInput,
  getHospitalSidoOptions,
  getHospitalSigunguOptionsForSido,
  parseDepartmentsInput,
  parseOperatingHoursForSave,
  refreshCustomHospitalDbOverrides,
  resolveCustomHospitalUpsertIds,
  serializeOperatingHoursForForm,
  type AdminCustomHospitalCatalogItem,
} from '@/services/customHospitalService';
import { invalidateHospitalFacilityIndex } from '@/services/localFacilityStore';
import {
  adminDeleteCustomHospital,
  adminUpsertCustomHospital,
  AdminServiceError,
} from '@/services/adminService';
import { queryClient } from '@/lib/queryClient';

const HOSPITAL_TYPES: CustomHospitalType[] = ['er', 'moonlight', 'pediatric', 'general'];

const EMPTY_FORM = {
  name: '',
  hospitalType: 'general' as CustomHospitalType,
  externalId: '',
  hpid: '',
  sido: '',
  sigungu: '',
  address: '',
  tel: '',
  departments: '',
  operatingHours: '',
  customMemo: '',
  isHidden: false,
  isPartner: false,
  erCapable: false,
  latitude: '',
  longitude: '',
  hvctayn: '',
  hvmriayn: '',
  hvangioayn: '',
  hvventiayn: '',
  hvamyn: '',
  hv120: '',
  hv122: '',
  hv2: '',
  hv3: '',
  hv4: '',
  hv5: '',
  hv6: '',
  hv7: '',
  hv8: '',
  hv9: '',
  hv10: '',
  hv11: '',
};

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function AdminHospitalsPanel() {
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<AdminCustomHospitalCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRow, setEditingRow] = useState<AdminCustomHospitalCatalogItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomHospitalCatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sidoOptions = useMemo(() => getHospitalSidoOptions(), []);
  const sigunguOptions = useMemo(
    () => (sido ? getHospitalSigunguOptionsForSido(sido) : []),
    [sido],
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCustomHospitalCatalog({
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
          : '병원 목록을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [sido, sigungu, search]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const invalidateUserCaches = async () => {
    await refreshCustomHospitalDbOverrides();
    invalidateHospitalFacilityIndex();
    void queryClient.invalidateQueries({ queryKey: ['facility-markers'] });
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm({
      ...EMPTY_FORM,
      sido: sido || sidoOptions[0] || '',
      sigungu: sigungu || '',
    });
    setFormVisible(true);
  };

  const openEdit = (row: AdminCustomHospitalCatalogItem) => {
    setEditingRow(row);
    setForm({
      name: row.name,
      hospitalType: row.hospital_type,
      externalId: row.external_id ?? '',
      hpid: row.hpid ?? '',
      sido: row.sido,
      sigungu: row.sigungu,
      address: row.address ?? '',
      tel: row.tel,
      departments: formatDepartmentsInput(row.departments),
      operatingHours: serializeOperatingHoursForForm(row.operating_hours),
      customMemo: row.custom_memo ?? '',
      isHidden: row.is_hidden,
      isPartner: row.is_partner,
      erCapable: row.er_capable,
      latitude: row.latitude != null ? String(row.latitude) : '',
      longitude: row.longitude != null ? String(row.longitude) : '',
      hvctayn: row.hvctayn ?? '',
      hvmriayn: row.hvmriayn ?? '',
      hvangioayn: row.hvangioayn ?? '',
      hvventiayn: row.hvventiayn ?? '',
      hvamyn: row.hvamyn ?? '',
      hv120: row.hv120 ?? '',
      hv122: row.hv122 ?? '',
      hv2: row.hv2 != null ? String(row.hv2) : '',
      hv3: row.hv3 != null ? String(row.hv3) : '',
      hv4: row.hv4 != null ? String(row.hv4) : '',
      hv5: row.hv5 != null ? String(row.hv5) : '',
      hv6: row.hv6 != null ? String(row.hv6) : '',
      hv7: row.hv7 != null ? String(row.hv7) : '',
      hv8: row.hv8 != null ? String(row.hv8) : '',
      hv9: row.hv9 != null ? String(row.hv9) : '',
      hv10: row.hv10 ?? '',
      hv11: row.hv11 ?? '',
    });
    setFormVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sido.trim() || !form.sigungu.trim()) {
      Alert.alert('입력 필요', '병원명, 시도, 시군구는 필수입니다.');
      return;
    }

    setSubmitting(true);
    try {
      const ids = editingRow ? resolveCustomHospitalUpsertIds(editingRow) : {};
      const operatingHours = parseOperatingHoursForSave(form.operatingHours);
      const erCapable = form.erCapable || form.hospitalType === 'er';

      await adminUpsertCustomHospital({
        id: ids.dbId,
        externalId: form.externalId.trim() || ids.externalId,
        hpid: form.hpid.trim() || undefined,
        name: form.name.trim(),
        hospitalType: form.hospitalType,
        sido: form.sido.trim(),
        sigungu: form.sigungu.trim(),
        address: form.address.trim() || undefined,
        tel: form.tel.trim() || '-',
        operatingHours,
        departments: parseDepartmentsInput(form.departments),
        customMemo: form.customMemo.trim() || undefined,
        isHidden: form.isHidden,
        isPartner: form.isPartner,
        erCapable,
        latitude: form.latitude.trim() ? Number(form.latitude) : null,
        longitude: form.longitude.trim() ? Number(form.longitude) : null,
        hvctayn: form.hvctayn.trim() || null,
        hvmriayn: form.hvmriayn.trim() || null,
        hvangioayn: form.hvangioayn.trim() || null,
        hvventiayn: form.hvventiayn.trim() || null,
        hvamyn: form.hvamyn.trim() || null,
        hv120: form.hv120.trim() || null,
        hv122: form.hv122.trim() || null,
        hv2: form.hv2.trim() ? Number(form.hv2) : null,
        hv3: form.hv3.trim() ? Number(form.hv3) : null,
        hv4: form.hv4.trim() ? Number(form.hv4) : null,
        hv5: form.hv5.trim() ? Number(form.hv5) : null,
        hv6: form.hv6.trim() ? Number(form.hv6) : null,
        hv7: form.hv7.trim() ? Number(form.hv7) : null,
        hv8: form.hv8.trim() ? Number(form.hv8) : null,
        hv9: form.hv9.trim() ? Number(form.hv9) : null,
        hv10: form.hv10.trim() || null,
        hv11: form.hv11.trim() || null,
      });

      await invalidateUserCaches();
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
      showAlert('안내', '내장 데이터 항목은 삭제할 수 없습니다. 숨김 처리 또는 수정만 가능합니다.');
      setDeleteTarget(null);
      return;
    }

    setSubmitting(true);
    try {
      await adminDeleteCustomHospital(deleteTarget.id);
      await invalidateUserCaches();
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
        공공 API 보완용 자체 병원 데이터입니다. 저장 즉시 응급실·소아 탭에 반영되며, 숨김 처리된 병원은
        사용자 화면에서 제외됩니다.
      </Text>

      <Text className="mb-1 text-xs font-semibold text-slate-600">시·도</Text>
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
        <>
          <Text className="mb-1 mt-1 text-xs font-semibold text-slate-600">시·군·구</Text>
          <RegionFilterScroller>
          <FilterChip label="전체 구군" active={!sigungu} onPress={() => setSigungu('')} />
          {sigunguOptions.map((opt) => (
            <FilterChip key={opt} label={opt} active={sigungu === opt} onPress={() => setSigungu(opt)} />
          ))}
          </RegionFilterScroller>
        </>
      ) : null}

      <AdminFormField
        label="병원명/전화/HPID 검색"
        value={search}
        onChangeText={setSearch}
        placeholder="검색어 입력 후 새로고침"
      />

      <View className="mb-3 flex-row gap-2">
        <Pressable className="flex-1 items-center rounded-xl bg-slate-200 py-2.5" onPress={() => void loadRows()}>
          <Text className="text-sm font-bold text-slate-700">새로고침</Text>
        </Pressable>
        <Pressable className="flex-1 items-center rounded-xl bg-violet-700 py-2.5" onPress={openCreate}>
          <Text className="text-sm font-bold text-white">+ 병원 추가</Text>
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
              조건에 맞는 병원이 없습니다.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              className={`mb-2 rounded-xl border bg-white p-3 ${
                item.is_hidden ? 'border-slate-300 opacity-70' : 'border-slate-200'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 font-semibold text-slate-900">{item.name}</Text>
                <Text className="text-[10px] font-bold text-violet-700">
                  {CUSTOM_HOSPITAL_TYPE_LABELS[item.hospital_type]}
                </Text>
              </View>
              <Text className="mt-0.5 text-xs text-slate-500">
                {item.sido} {item.sigungu} · {item.tel || '-'}
              </Text>
              {item.is_partner ? (
                <Text className="mt-1 text-[10px] font-bold text-amber-700">⭐ 제휴</Text>
              ) : null}
              {item.is_hidden ? (
                <Text className="mt-1 text-[10px] font-bold text-slate-500">숨김</Text>
              ) : null}
              {item.custom_memo ? (
                <Text className="mt-1 text-xs text-slate-600" numberOfLines={2}>
                  {item.custom_memo}
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
              {editingRow ? '병원 정보 수정' : '병원 추가'}
            </Text>

            <AdminFormField label="병원명 *" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
            <Text className="mb-2 text-xs font-semibold text-slate-600">분류</Text>
            <View className="mb-3 flex-row flex-wrap gap-2">
              {HOSPITAL_TYPES.map((type) => (
                <Pressable
                  key={type}
                  className={`rounded-full px-3 py-1.5 ${
                    form.hospitalType === type ? 'bg-violet-700' : 'bg-slate-200'
                  }`}
                  onPress={() =>
                    setForm((p) => ({
                      ...p,
                      hospitalType: type,
                      erCapable: type === 'er' ? true : p.erCapable,
                    }))
                  }
                >
                  <Text
                    className={`text-xs font-bold ${
                      form.hospitalType === type ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {CUSTOM_HOSPITAL_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AdminFormField
              label="연동 ID (external_id / 내장 HPID)"
              value={form.externalId}
              onChangeText={(v) => setForm((p) => ({ ...p, externalId: v }))}
              placeholder="기존 병원 덮어쓰기 시 입력"
            />
            <AdminFormField label="HPID" value={form.hpid} onChangeText={(v) => setForm((p) => ({ ...p, hpid: v }))} />
            <AdminFormField label="시도 *" value={form.sido} onChangeText={(v) => setForm((p) => ({ ...p, sido: v }))} />
            <AdminFormField label="시군구 *" value={form.sigungu} onChangeText={(v) => setForm((p) => ({ ...p, sigungu: v }))} />
            <AdminFormField label="주소" value={form.address} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} />
            <AdminFormField label="전화" value={form.tel} onChangeText={(v) => setForm((p) => ({ ...p, tel: v }))} keyboardType="phone-pad" />
            <AdminFormField
              label="진료과목 (쉼표 구분)"
              value={form.departments}
              onChangeText={(v) => setForm((p) => ({ ...p, departments: v }))}
            />
            <AdminFormField
              label="진료시간"
              value={form.operatingHours}
              onChangeText={(v) => setForm((p) => ({ ...p, operatingHours: v }))}
              placeholder={'월 09:00-18:00\n화 09:00-18:00'}
              multiline
            />
            <AdminFormField
              label="관리자 메모"
              value={form.customMemo}
              onChangeText={(v) => setForm((p) => ({ ...p, customMemo: v }))}
              multiline
            />
            <AdminFormField label="위도" value={form.latitude} onChangeText={(v) => setForm((p) => ({ ...p, latitude: v }))} keyboardType="numeric" />
            <AdminFormField label="경도" value={form.longitude} onChangeText={(v) => setForm((p) => ({ ...p, longitude: v }))} keyboardType="numeric" />

            <View className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Text className="text-sm font-semibold text-slate-700">응급실 운영</Text>
              <Switch value={form.erCapable} onValueChange={(v) => setForm((p) => ({ ...p, erCapable: v }))} />
            </View>
            <View className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Text className="text-sm font-semibold text-slate-700">제휴 병원</Text>
              <Switch value={form.isPartner} onValueChange={(v) => setForm((p) => ({ ...p, isPartner: v }))} />
            </View>
            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Text className="text-sm font-semibold text-slate-700">숨김 (사용자 화면 제외)</Text>
              <Switch value={form.isHidden} onValueChange={(v) => setForm((p) => ({ ...p, isHidden: v }))} />
            </View>

            <Text className="mb-2 text-sm font-bold text-slate-800">응급 장비·연락처 오버라이드</Text>
            <Text className="mb-3 text-xs text-slate-500">Y/N 또는 병상 수. 비우면 공공 API 값을 따릅니다.</Text>
            <AdminFormField label="CT (hvctayn)" value={form.hvctayn} onChangeText={(v) => setForm((p) => ({ ...p, hvctayn: v }))} placeholder="Y / N" />
            <AdminFormField label="MRI (hvmriayn)" value={form.hvmriayn} onChangeText={(v) => setForm((p) => ({ ...p, hvmriayn: v }))} placeholder="Y / N" />
            <AdminFormField label="조영촬영 (hvangioayn)" value={form.hvangioayn} onChangeText={(v) => setForm((p) => ({ ...p, hvangioayn: v }))} placeholder="Y / N" />
            <AdminFormField label="인공호흡기 (hvventiayn)" value={form.hvventiayn} onChangeText={(v) => setForm((p) => ({ ...p, hvventiayn: v }))} placeholder="Y / N" />
            <AdminFormField label="구급차 (hvamyn)" value={form.hvamyn} onChangeText={(v) => setForm((p) => ({ ...p, hvamyn: v }))} placeholder="Y / N" />
            <AdminFormField label="응급실 당직 직통 (hv120)" value={form.hv120} onChangeText={(v) => setForm((p) => ({ ...p, hv120: v }))} keyboardType="phone-pad" />
            <AdminFormField label="소아 당직 직통 (hv122)" value={form.hv122} onChangeText={(v) => setForm((p) => ({ ...p, hv122: v }))} keyboardType="phone-pad" />
            <AdminFormField label="내과중환자 (hv2)" value={form.hv2} onChangeText={(v) => setForm((p) => ({ ...p, hv2: v }))} keyboardType="numeric" />
            <AdminFormField label="외과중환자 (hv3)" value={form.hv3} onChangeText={(v) => setForm((p) => ({ ...p, hv3: v }))} keyboardType="numeric" />
            <AdminFormField label="소아 VENTI (hv10)" value={form.hv10} onChangeText={(v) => setForm((p) => ({ ...p, hv10: v }))} placeholder="Y / N" />
            <AdminFormField label="인큐베이터 (hv11)" value={form.hv11} onChangeText={(v) => setForm((p) => ({ ...p, hv11: v }))} placeholder="Y / N" />

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
        title="병원 데이터 삭제"
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
      className={`rounded-full px-3 py-2 ${active ? 'bg-violet-700' : 'bg-slate-100'}`}
      onPress={onPress}
    >
      <Text
        className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-700'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
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
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
