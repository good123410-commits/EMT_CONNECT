import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchErBedForHospital,
  peekErBedCache,
  type ErBedFetchResult,
} from '@/services/erBedCacheService';
import type { ErLiveSnapshot } from '@/services/hybridErService';
import type { LocationRegion } from '@/services/locationService';
import { computeErBedAvailability, type ErBedAvailability } from '@/utils/erBedAvailability';

export type ErBedInfoState = {
  snapshot: ErLiveSnapshot | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  hasFetched: boolean;
};

type UseErBedInfoOptions = {
  hpid: string;
  hospitalName: string;
  region: LocationRegion;
  /** false면 페치하지 않음 (뷰포트 진입 전) */
  enabled?: boolean;
};

const IDLE_STATE: ErBedInfoState = {
  snapshot: null,
  loading: false,
  error: null,
  fromCache: false,
  hasFetched: false,
};

function toState(result: ErBedFetchResult, loading: boolean): ErBedInfoState {
  return {
    snapshot: result.snapshot,
    loading,
    error: result.error ?? null,
    fromCache: result.fromCache,
    hasFetched: !loading,
  };
}

export function useErBedInfo({
  hpid,
  hospitalName,
  region,
  enabled = false,
}: UseErBedInfoOptions) {
  const [state, setState] = useState<ErBedInfoState>(() => {
    if (!enabled || !hpid) return IDLE_STATE;
    const cached = peekErBedCache({ hpid, region });
    return cached ? toState(cached, false) : IDLE_STATE;
  });

  const requestIdRef = useRef(0);

  const load = useCallback(
    async (force = false) => {
      if (!hpid?.trim()) return;

      const cached = !force ? peekErBedCache({ hpid, region }) : null;
      if (cached) {
        setState(toState(cached, false));
        return;
      }

      const requestId = ++requestIdRef.current;
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const result = await fetchErBedForHospital({
        hpid,
        hospitalName,
        region,
        force,
      });

      if (requestId !== requestIdRef.current) return;
      setState(toState(result, false));
    },
    [hpid, hospitalName, region],
  );

  useEffect(() => {
    if (!enabled || !hpid) {
      requestIdRef.current += 1;
      setState(IDLE_STATE);
      return undefined;
    }

    void load(false);
    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled, hpid, hospitalName, region.stage1, region.stage2, region.label, load]);

  const availability: ErBedAvailability = useMemo(
    () =>
      computeErBedAvailability(state.snapshot, {
        hasError: Boolean(state.error && state.hasFetched),
      }),
    [state.snapshot, state.error, state.hasFetched],
  );

  const refetch = useCallback(() => load(true), [load]);

  return {
    ...state,
    availability,
    refetch,
  };
}
