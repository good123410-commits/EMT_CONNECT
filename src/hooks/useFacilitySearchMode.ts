import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { FacilityRegionFilter } from '@/services/facilityRegionFilter';
import {
  getRegionCenterCoordinate,
  refreshLocationCache,
  type GeoCoordinate,
  type LocationSnapshot,
} from '@/services/locationService';

export type FacilitySearchMode = 'gps' | 'manual';

export type FacilitySearchParams = {
  mode: FacilitySearchMode;
  textQuery: string;
  regionFilter?: FacilityRegionFilter;
  coordinate: GeoCoordinate;
  permissionGranted: boolean;
};

type UseFacilitySearchModeOptions = {
  locationSnapshot: LocationSnapshot;
  defaultMode?: FacilitySearchMode;
};

export function useFacilitySearchMode({
  locationSnapshot,
  defaultMode = 'manual',
}: UseFacilitySearchModeOptions) {
  const [mode, setMode] = useState<FacilitySearchMode>(defaultMode);
  const [textQuery, setTextQuery] = useState('');
  const [sido, setSido] = useState(() => locationSnapshot.region.stage1 || '');
  const [sigungu, setSigungu] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [manualCoordinate, setManualCoordinate] = useState<GeoCoordinate | null>(null);
  const [activeSnapshot, setActiveSnapshot] = useState(locationSnapshot);

  useEffect(() => {
    setActiveSnapshot(locationSnapshot);
  }, [locationSnapshot]);

  useEffect(() => {
    if (mode !== 'manual') return;
    if (!sido && locationSnapshot.region.stage1) {
      setSido(locationSnapshot.region.stage1);
    }
  }, [locationSnapshot.region.stage1, mode, sido]);

  const regionFilter = useMemo<FacilityRegionFilter | undefined>(() => {
    if (mode === 'gps' || !sido) return undefined;
    return { stage1: sido, stage2: sigungu || undefined };
  }, [mode, sido, sigungu]);

  useEffect(() => {
    if (mode !== 'manual' || !sido) {
      setManualCoordinate(null);
      return undefined;
    }

    let cancelled = false;
    void getRegionCenterCoordinate({
      stage1: sido,
      stage2: sigungu,
      label: sigungu ? `${sido} ${sigungu}` : sido,
    }).then((coord) => {
      if (!cancelled) setManualCoordinate(coord);
    });

    return () => {
      cancelled = true;
    };
  }, [mode, sido, sigungu]);

  const searchCoordinate = useMemo(() => {
    if (mode === 'manual' && manualCoordinate) return manualCoordinate;
    return activeSnapshot.coordinate;
  }, [mode, manualCoordinate, activeSnapshot.coordinate]);

  const activateGpsSearch = useCallback(async () => {
    setGpsLoading(true);
    try {
      const snapshot = await refreshLocationCache();
      setActiveSnapshot(snapshot);
      setMode('gps');
      setTextQuery('');

      if (!snapshot.permissionGranted) {
        Alert.alert(
          '위치 권한 필요',
          '설정 > 앱 권한에서 위치 접근을 허용하면 주변 AED·응급실·약국 검색이 더 정확해집니다.',
        );
      }
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const handleSidoChange = useCallback((value: string) => {
    setMode('manual');
    setSido(value);
    setSigungu('');
    setTextQuery('');
  }, []);

  const handleSigunguChange = useCallback((value: string) => {
    setMode('manual');
    setSigungu(value);
    setTextQuery('');
  }, []);

  const handleTextQueryChange = useCallback((value: string) => {
    if (value.trim()) setMode('manual');
    setTextQuery(value);
  }, []);

  const searchParams = useMemo<FacilitySearchParams>(
    () => ({
      mode,
      textQuery: textQuery.trim(),
      regionFilter,
      coordinate: searchCoordinate,
      permissionGranted: mode === 'gps' ? activeSnapshot.permissionGranted : true,
    }),
    [mode, textQuery, regionFilter, searchCoordinate, activeSnapshot.permissionGranted],
  );

  const statusLabel = useMemo(() => {
    if (mode === 'gps') {
      return activeSnapshot.permissionGranted
        ? `${activeSnapshot.region.label} · GPS 기준`
        : 'GPS 권한 없음 · 기본 위치 기준';
    }
    if (sigungu) return `${sido} ${sigungu}`;
    if (sido) return sido;
    return '시·도를 선택해 주세요';
  }, [mode, activeSnapshot, sido, sigungu]);

  return {
    mode,
    textQuery,
    sido,
    sigungu,
    gpsLoading,
    searchParams,
    statusLabel,
    activateGpsSearch,
    handleSidoChange,
    handleSigunguChange,
    handleTextQueryChange,
  };
}
