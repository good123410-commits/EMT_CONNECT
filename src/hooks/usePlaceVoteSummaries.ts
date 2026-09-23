import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPlaceVoteSummaries,
  getPlaceVoteErrorMessage,
  togglePlaceVote,
} from '@/services/placeVoteService';
import type {
  PlaceVoteKind,
  PlaceVoteRequest,
  PlaceVoteSummary,
  PlaceVoteType,
} from '@/types/placeVote';
import { emptyPlaceVoteSummary, placeVoteKey } from '@/types/placeVote';

const PLACE_VOTE_STALE_MS = 30_000;

function buildRequestsKey(requests: PlaceVoteRequest[]): string {
  return requests
    .map((request) => `${request.place_kind}:${request.place_id.trim()}`)
    .filter((key) => !key.endsWith(':'))
    .sort()
    .join('|');
}

export function usePlaceVoteSummaries(requests: PlaceVoteRequest[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const normalizedRequests = useMemo(
    () =>
      requests
        .map((request) => ({
          place_kind: request.place_kind,
          place_id: request.place_id.trim(),
        }))
        .filter((request) => request.place_id.length > 0),
    [requests],
  );

  const requestsKey = useMemo(
    () => buildRequestsKey(normalizedRequests),
    [normalizedRequests],
  );

  const query = useQuery({
    queryKey: ['place-vote-summaries', requestsKey, user?.id ?? 'guest'],
    queryFn: () => fetchPlaceVoteSummaries(normalizedRequests),
    enabled: normalizedRequests.length > 0,
    staleTime: PLACE_VOTE_STALE_MS,
  });

  const summariesMap = useMemo(() => {
    const map = new Map<string, PlaceVoteSummary>();
    for (const summary of query.data ?? []) {
      map.set(placeVoteKey(summary.place_kind, summary.place_id), summary);
    }
    for (const request of normalizedRequests) {
      const key = placeVoteKey(request.place_kind, request.place_id);
      if (!map.has(key)) {
        map.set(key, emptyPlaceVoteSummary(request.place_kind, request.place_id));
      }
    }
    return map;
  }, [normalizedRequests, query.data]);

  const toggleMutation = useMutation({
    mutationFn: ({
      placeKind,
      placeId,
      voteType,
    }: {
      placeKind: PlaceVoteKind;
      placeId: string;
      voteType: PlaceVoteType;
    }) => togglePlaceVote(placeKind, placeId, voteType),
    onMutate: async ({ placeKind, placeId, voteType }) => {
      const key = placeVoteKey(placeKind, placeId);
      const queryKey = ['place-vote-summaries', requestsKey, user?.id ?? 'guest'];

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<PlaceVoteSummary[]>(queryKey);
      const current =
        summariesMap.get(key) ?? emptyPlaceVoteSummary(placeKind, placeId);

      let nextLike = current.like_count;
      let nextDislike = current.dislike_count;
      let nextMyVote: PlaceVoteType | null = voteType;

      if (current.my_vote === voteType) {
        if (voteType === 'like') nextLike = Math.max(0, nextLike - 1);
        else nextDislike = Math.max(0, nextDislike - 1);
        nextMyVote = null;
      } else if (current.my_vote === null) {
        if (voteType === 'like') nextLike += 1;
        else nextDislike += 1;
      } else {
        if (voteType === 'like') {
          nextLike += 1;
          nextDislike = Math.max(0, nextDislike - 1);
        } else {
          nextDislike += 1;
          nextLike = Math.max(0, nextLike - 1);
        }
      }

      const optimistic: PlaceVoteSummary = {
        place_kind: placeKind,
        place_id: placeId,
        like_count: nextLike,
        dislike_count: nextDislike,
        my_vote: nextMyVote,
      };

      queryClient.setQueryData<PlaceVoteSummary[]>(queryKey, (old) => {
        const list = Array.isArray(old) ? [...old] : [];
        const index = list.findIndex(
          (item) => placeVoteKey(item.place_kind, item.place_id) === key,
        );
        if (index >= 0) list[index] = optimistic;
        else list.push(optimistic);
        return list;
      });

      return { previous, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSuccess: (summary) => {
      const queryKey = ['place-vote-summaries', requestsKey, user?.id ?? 'guest'];
      queryClient.setQueryData<PlaceVoteSummary[]>(queryKey, (old) => {
        const key = placeVoteKey(summary.place_kind, summary.place_id);
        const list = Array.isArray(old) ? [...old] : [];
        const index = list.findIndex(
          (item) => placeVoteKey(item.place_kind, item.place_id) === key,
        );
        if (index >= 0) list[index] = summary;
        else list.push(summary);
        return list;
      });
    },
  });

  const getSummary = useCallback(
    (placeKind: PlaceVoteKind, placeId: string): PlaceVoteSummary => {
      const trimmedId = placeId.trim();
      return (
        summariesMap.get(placeVoteKey(placeKind, trimmedId)) ??
        emptyPlaceVoteSummary(placeKind, trimmedId)
      );
    },
    [summariesMap],
  );

  const toggle = useCallback(
    async (placeKind: PlaceVoteKind, placeId: string, voteType: PlaceVoteType) => {
      return toggleMutation.mutateAsync({ placeKind, placeId, voteType });
    },
    [toggleMutation],
  );

  return {
    getSummary,
    toggle,
    isLoading: query.isLoading,
    isToggling: toggleMutation.isPending,
    error: query.error ? getPlaceVoteErrorMessage(query.error) : null,
    toggleError: toggleMutation.error ? getPlaceVoteErrorMessage(toggleMutation.error) : null,
  };
}
