import { createContext, useContext, type ReactNode } from 'react';
import { usePlaceVoteSummaries } from '@/hooks/usePlaceVoteSummaries';
import type {
  PlaceVoteKind,
  PlaceVoteRequest,
  PlaceVoteSummary,
  PlaceVoteType,
} from '@/types/placeVote';

type PlaceVoteContextValue = {
  getSummary: (placeKind: PlaceVoteKind, placeId: string) => PlaceVoteSummary;
  toggle: (placeKind: PlaceVoteKind, placeId: string, voteType: PlaceVoteType) => Promise<PlaceVoteSummary>;
  isLoading: boolean;
  isToggling: boolean;
};

const PlaceVoteContext = createContext<PlaceVoteContextValue | null>(null);

type PlaceVoteProviderProps = {
  requests: PlaceVoteRequest[];
  children: ReactNode;
};

export function PlaceVoteProvider({ requests, children }: PlaceVoteProviderProps) {
  const value = usePlaceVoteSummaries(requests);

  return <PlaceVoteContext.Provider value={value}>{children}</PlaceVoteContext.Provider>;
}

export function usePlaceVoteContext(): PlaceVoteContextValue | null {
  return useContext(PlaceVoteContext);
}
