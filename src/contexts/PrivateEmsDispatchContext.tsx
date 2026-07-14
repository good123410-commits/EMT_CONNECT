import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EmptyReturnRequest, TransportRequest } from '@/data/privateEmsMockData';

export type AcceptedDispatch = {
  id: string;
  type: 'regular' | 'empty_return';
  from: string;
  to: string;
  patientInfo: string;
  notes: string;
  fare: number;
  distance: string;
  acceptedAt: string;
  status: 'accepted' | 'in_progress' | 'completed';
};

type PrivateEmsDispatchContextValue = {
  acceptedDispatches: AcceptedDispatch[];
  hiddenRequestIds: Set<string>;
  acceptTransportRequest: (request: TransportRequest) => void;
  acceptEmptyReturnRequest: (request: EmptyReturnRequest) => void;
  completeDispatch: (id: string) => void;
};

const PrivateEmsDispatchContext = createContext<PrivateEmsDispatchContextValue | null>(null);

function nowLabel(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function PrivateEmsDispatchProvider({ children }: { children: ReactNode }) {
  const [acceptedDispatches, setAcceptedDispatches] = useState<AcceptedDispatch[]>([]);
  const [hiddenRequestIds, setHiddenRequestIds] = useState<Set<string>>(new Set());

  const acceptTransportRequest = useCallback((request: TransportRequest) => {
    setHiddenRequestIds((prev) => new Set(prev).add(request.id));
    setAcceptedDispatches((prev) => [
      {
        id: request.id,
        type: 'regular',
        from: request.from,
        to: request.to,
        patientInfo: request.patientInfo,
        notes: request.notes,
        fare: request.fare,
        distance: request.distance,
        acceptedAt: nowLabel(),
        status: 'accepted',
      },
      ...prev,
    ]);
  }, []);

  const acceptEmptyReturnRequest = useCallback((request: EmptyReturnRequest) => {
    setHiddenRequestIds((prev) => new Set(prev).add(request.id));
    setAcceptedDispatches((prev) => [
      {
        id: request.id,
        type: 'empty_return',
        from: request.from,
        to: request.to,
        patientInfo: request.patientInfo,
        notes: request.notes,
        fare: request.fare + request.emptyReturnBonus,
        distance: request.distance,
        acceptedAt: nowLabel(),
        status: 'accepted',
      },
      ...prev,
    ]);
  }, []);

  const completeDispatch = useCallback((id: string) => {
    setAcceptedDispatches((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'completed' as const } : d)),
    );
  }, []);

  const value = useMemo(
    () => ({
      acceptedDispatches,
      hiddenRequestIds,
      acceptTransportRequest,
      acceptEmptyReturnRequest,
      completeDispatch,
    }),
    [acceptedDispatches, hiddenRequestIds, acceptTransportRequest, acceptEmptyReturnRequest, completeDispatch],
  );

  return (
    <PrivateEmsDispatchContext.Provider value={value}>{children}</PrivateEmsDispatchContext.Provider>
  );
}

export function usePrivateEmsDispatch() {
  const context = useContext(PrivateEmsDispatchContext);
  if (!context) {
    throw new Error('usePrivateEmsDispatch must be used within PrivateEmsDispatchProvider');
  }
  return context;
}
