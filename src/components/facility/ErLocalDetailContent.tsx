import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { ErBedAvailabilitySection } from '@/components/facility/ErBedAvailabilitySection';
import { ErBedErrorBoundary } from '@/components/facility/ErBedErrorBoundary';
import { ErBedSkeleton } from '@/components/facility/ErBedSkeleton';
import { ErDutyContactButtons, ErHospitalSpecsPanel } from '@/components/facility/ErHospitalSpecsPanel';
import {
  MedicalFacilityStatusPill,
} from '@/components/facility/MedicalFacilityListCard';
import { PartnerHospitalBadge } from '@/components/facility/PartnerHospitalBadge';
import { HospitalSpecialtyTags } from '@/components/facility/HospitalSpecialtyTags';
import { HospitalWeeklyHours } from '@/components/facility/HospitalWeeklyHours';
import { MoonlightHospitalBadge } from '@/components/facility/MoonlightHospitalBadge';
import {
  MedicalDetailBody,
  MedicalDetailCard,
  MedicalDetailInfoTile,
  MedicalDetailLocationHeader,
  MedicalDetailSectionTitle,
  MedicalDetailText,
} from '@/components/map/MedicalDetailPrimitives';
import { useErBedStatusPalette } from '@/constants/erBedTheme';
import { MEDICAL_DETAIL } from '@/constants/medicalDetailTheme';
import { useErBedInfo } from '@/hooks/useErBedInfo';
import { ER_STATUS_LABELS } from '@/mockData/aedAndEmergency';
import {
  EmergencyApiError,
  formatCount,
  formatEmergencyUpdatedAt,
  isMoonlightChildrenHospital,
  safeErStatus,
  type HospitalDetail,
} from '@/services/emergencyApi';
import {
  fetchErHospitalFullDetail,
  getHybridHospitalDetailFromStore,
  type LocalHospitalMarkerWithLive,
} from '@/services/hybridErService';
import { getHospitalErOverride } from '@/services/customHospitalService';
import type { LocationRegion } from '@/services/locationService';
import type { DistanceUnitMode } from '@/utils/formatDistance';
import { formatDistanceMeters } from '@/utils/formatDistance';
import { buildEmergencyHospitalSpecs } from '@/utils/emergencyHospitalSpecs';
import {
  mergeEmergencyBedWithOverride,
  mergeSpecsWithErOverride,
} from '@/utils/hospitalEquipmentOverride';

type ErLocalDetailContentProps = {
  place: LocalHospitalMarkerWithLive;
  liveApiRegion: LocationRegion;
  coordinate: { latitude: number; longitude: number };
  distanceUnitMode: DistanceUnitMode;
  onDistanceUnitToggle: () => void;
};

export function ErLocalDetailContent({
  place,
  liveApiRegion,
  coordinate,
  distanceUnitMode,
  onDistanceUnitToggle,
}: ErLocalDetailContentProps) {
  const palette = useErBedStatusPalette();
  const [detail, setDetail] = useState<HospitalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const {
    snapshot: bedSnapshot,
    availability,
    loading: bedLoading,
    error: bedError,
    hasFetched: bedFetched,
  } = useErBedInfo({
    hpid: place.i,
    hospitalName: place.n,
    region: liveApiRegion,
    enabled: true,
  });

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setDetailError(null);

    if (!place.i) return undefined;

    void (async () => {
      setDetailLoading(true);
      try {
        const result = await fetchErHospitalFullDetail(place.i, {
          coordinate,
          region: liveApiRegion,
        });

        if (cancelled) return;

        if (result) {
          setDetail(result);
        } else {
          const fallback = getHybridHospitalDetailFromStore(place.i, coordinate, null);
          if (fallback) {
            setDetail({
              ...fallback,
              specialties: place.specialties?.length ? place.specialties : fallback.specialties,
              weeklySchedule: place.weeklySchedule?.length
                ? place.weeklySchedule
                : fallback.weeklySchedule,
              isOpenNow:
                place.openStatusLabel !== '확인 필요' ? place.isOpenNow : fallback.isOpenNow,
              openStatusLabel:
                place.openStatusLabel !== '확인 필요'
                  ? place.openStatusLabel
                  : fallback.openStatusLabel,
            });
          } else {
            setDetailError('기관 상세 정보를 불러오지 못했습니다. 아래 기본 정보를 참고해 주세요.');
          }
        }
      } catch (error) {
        if (cancelled) return;
        setDetailError(
          error instanceof EmergencyApiError
            ? error.message
            : '기관 상세 정보를 불러오지 못했습니다. 아래 기본 정보를 참고해 주세요.',
        );
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [place.i, coordinate.latitude, coordinate.longitude, liveApiRegion.stage1, liveApiRegion.stage2, liveApiRegion.label]);

  const status = safeErStatus(bedSnapshot?.status ?? detail?.status ?? place.status);
  const availableErBeds = bedFetched
    ? availability.availableErBeds
    : Number.isFinite(detail?.availableErBeds ?? place.availableErBeds)
      ? (detail?.availableErBeds ?? place.availableErBeds)
      : 0;
  const availablePediatricBeds = bedFetched
    ? availability.availablePediatricErBeds
    : Number.isFinite(detail?.availablePediatricErBeds ?? place.availablePediatricErBeds)
      ? (detail?.availablePediatricErBeds ?? place.availablePediatricErBeds)
      : 0;

  const phone = (detail?.phone || place.p)?.trim();
  const erPhone = (detail?.erPhone || detail?.erDoctorPhone || place.p)?.trim();
  const callPhone = [erPhone, phone].find((value) => value && value !== '-') ?? null;
  const isMoonlight = isMoonlightChildrenHospital(place.n);
  const specialties = detail?.specialties?.length ? detail.specialties : place.specialties ?? [];
  const weeklySchedule = detail?.weeklySchedule?.length
    ? detail.weeklySchedule
    : place.weeklySchedule ?? [];
  const openStatusLabel = detail?.openStatusLabel ?? place.openStatusLabel;
  const isOpenNow = detail?.isOpenNow ?? place.isOpenNow;
  const erOverride = getHospitalErOverride(place.i);

  const hospitalSpecs = useMemo(() => {
    if (detail) {
      const merged = mergeEmergencyBedWithOverride(detail, erOverride);
      return mergeSpecsWithErOverride(buildEmergencyHospitalSpecs(merged), erOverride);
    }
    if (bedSnapshot?.specs) {
      return mergeSpecsWithErOverride(bedSnapshot.specs, erOverride);
    }
    return mergeSpecsWithErOverride(place.specs, erOverride);
  }, [detail, bedSnapshot?.specs, place.specs, erOverride]);

  const bedRows = useMemo(() => {
    if (!detail) return [];
    return [
      { label: '응급실', value: bedFetched ? availableErBeds : detail.availableErBeds },
      {
        label: '소아응급',
        value: bedFetched ? availablePediatricBeds : detail.availablePediatricErBeds,
      },
      { label: '수술실', value: detail.availableSurgeryBeds },
      { label: '신경중환자', value: detail.availableNeuroIcuBeds },
      { label: '신생아중환자', value: detail.availableNeonatalIcuBeds },
      { label: '흉부중환자', value: detail.availableChestIcuBeds },
      { label: '일반중환자', value: detail.availableGeneralIcuBeds },
      { label: '입원실', value: detail.availableInpatientBeds },
    ].filter((row) => row.value > 0 || row.label === '응급실' || row.label === '소아응급');
  }, [detail, bedFetched, availableErBeds, availablePediatricBeds]);

  const statusColor = palette[status];
  const hospitalName = detail?.hospitalName || place.n || '병원';
  const hospitalAddress = detail?.address?.trim() || place.a?.trim() || '주소 정보 없음';
  const phoneSublabel = erPhone && erPhone === callPhone ? '응급실' : undefined;

  const leadingContent = (
    <>
      {place.isPartner ? (
        <View className="mb-2">
          <PartnerHospitalBadge compact appearance="detail" />
        </View>
      ) : null}

      {place.isErPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="🚨 응급실 운영" tone="er" />
        </View>
      ) : isMoonlight ? (
        <View className="mb-2">
          <MoonlightHospitalBadge compact appearance="detail" />
        </View>
      ) : place.isPediatricPriority ? (
        <View className="mb-2 self-start">
          <MedicalFacilityStatusPill label="👶 소아 특화" tone="pediatric" />
        </View>
      ) : null}

      <ErDutyContactButtons
        specs={hospitalSpecs}
        hospitalName={hospitalName}
        appearance="light"
      />
    </>
  );

  const titleExtras = (
    <>
      {(detail?.emergencyClassName || place.td)?.trim() ? (
        <MedicalDetailText variant="secondary">
          {detail?.emergencyClassName || place.td}
        </MedicalDetailText>
      ) : null}
      {place.sg?.trim() ? <MedicalDetailText variant="muted">{place.sg}</MedicalDetailText> : null}
      {openStatusLabel !== '확인 필요' ? (
        <View
          className="mt-2 self-start rounded-full px-2.5 py-1"
          style={{ backgroundColor: isOpenNow ? '#dcfce7' : MEDICAL_DETAIL.cardMuted }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: isOpenNow ? '#15803d' : MEDICAL_DETAIL.textSecondary,
            }}
          >
            {openStatusLabel}
          </Text>
        </View>
      ) : null}
    </>
  );

  const distanceBlock = (
    <View className="flex-row gap-3">
      <MedicalDetailInfoTile
        icon="navigate"
        label="거리"
        value={formatDistanceMeters(place.distanceM ?? 0, distanceUnitMode)}
        onPress={onDistanceUnitToggle}
      />
      <MedicalDetailInfoTile icon="walk" label="도보" value={`${place.walkMin ?? 0}분`} />
    </View>
  );

  return (
    <MedicalDetailBody>
      {detailLoading ? (
        <View className="mb-3">
          <ErBedSkeleton />
          <MedicalDetailText variant="muted">기관 정보 불러오는 중...</MedicalDetailText>
        </View>
      ) : null}

      {detailError ? (
        <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="text-sm text-amber-800">{detailError}</Text>
        </View>
      ) : null}

      <MedicalDetailLocationHeader
        name={hospitalName}
        address={hospitalAddress}
        latitude={place.lat}
        longitude={place.lng}
        phone={callPhone}
        phoneSublabel={phoneSublabel}
        mapKind="er"
        leadingContent={leadingContent}
        titleExtras={titleExtras}
        distanceBlock={distanceBlock}
      />

      <ErHospitalSpecsPanel
        specs={hospitalSpecs}
        hospitalName={hospitalName}
        showDutyContacts={false}
        appearance="light"
      />

      {specialties.length > 0 ? (
        <View className="mt-3">
          <MedicalDetailSectionTitle>진료 과목</MedicalDetailSectionTitle>
          <HospitalSpecialtyTags specialties={specialties} maxTags={12} appearance="light" />
        </View>
      ) : null}

      {weeklySchedule.length > 0 ? (
        <View className="mt-4">
          <MedicalDetailSectionTitle>요일별 진료시간</MedicalDetailSectionTitle>
          <HospitalWeeklyHours schedule={weeklySchedule} appearance="light" />
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-between">
        <MedicalDetailSectionTitle>응급실 병상</MedicalDetailSectionTitle>
        {bedFetched && !bedLoading ? (
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: `${statusColor}18` }}
          >
            <Text className="text-xs font-bold" style={{ color: statusColor }}>
              {availability.hasLiveData ? ER_STATUS_LABELS[status] : '확인중'}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-2">
        <ErBedErrorBoundary>
          <ErBedAvailabilitySection
            availability={availability}
            loading={bedLoading}
            error={bedError}
            hasFetched={bedFetched}
            showStatusPill={false}
          />
        </ErBedErrorBoundary>
      </View>

      {bedRows.length > 0 && detail && !bedLoading ? (
        <MedicalDetailCard>
          <MedicalDetailSectionTitle>가용 병상 현황</MedicalDetailSectionTitle>
          {bedRows.map((row) => (
            <View key={row.label} className="flex-row items-center justify-between py-1">
              <MedicalDetailText variant="secondary">{row.label}</MedicalDetailText>
              <Text style={{ fontSize: 12, fontWeight: '600', color: MEDICAL_DETAIL.text }}>
                {row.value}병상
              </Text>
            </View>
          ))}
        </MedicalDetailCard>
      ) : bedLoading ? (
        <View className="mt-2">
          <ErBedSkeleton />
        </View>
      ) : availablePediatricBeds > 0 ? (
        <View className="mt-2 rounded-lg bg-pink-50 px-3 py-2">
          <Text className="text-xs font-semibold text-pink-700">
            소아 응급 가용 병상: {formatCount(availablePediatricBeds, '0')}병상
          </Text>
        </View>
      ) : null}

      {detail?.onCallDoctor?.trim() ? (
        <MedicalDetailText variant="secondary">당직의: {detail.onCallDoctor}</MedicalDetailText>
      ) : null}

      {(bedSnapshot?.updatedAt || detail?.updatedAt) ? (
        <MedicalDetailText variant="muted">
          갱신: {formatEmergencyUpdatedAt(bedSnapshot?.updatedAt ?? detail?.updatedAt ?? '')}
        </MedicalDetailText>
      ) : null}

      {detail?.description?.trim() ? (
        <MedicalDetailText variant="secondary">{detail.description}</MedicalDetailText>
      ) : null}

      {place.customMemo ? (
        <View className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <Text className="text-xs font-semibold text-amber-800">안내</Text>
          <Text className="mt-1 text-xs leading-5 text-amber-900">{place.customMemo}</Text>
        </View>
      ) : null}
    </MedicalDetailBody>
  );
}
