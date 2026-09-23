export type PlaceVoteKind = 'aed' | 'shelter' | 'pharmacy' | 'er' | 'pediatric';

export type PlaceVoteType = 'like' | 'dislike';

export type PlaceVoteRequest = {
  place_kind: PlaceVoteKind;
  place_id: string;
};

export type PlaceVoteSummary = {
  place_kind: PlaceVoteKind;
  place_id: string;
  like_count: number;
  dislike_count: number;
  my_vote: PlaceVoteType | null;
};

export function placeVoteKey(placeKind: PlaceVoteKind, placeId: string): string {
  return `${placeKind}:${placeId}`;
}

export function getPediatricPlaceId(hospital: {
  hpid?: string | null;
  name: string;
  address: string;
}): string {
  const hpid = hospital.hpid?.trim();
  if (hpid) return hpid;
  return `${hospital.name}-${hospital.address}`;
}

export function emptyPlaceVoteSummary(
  placeKind: PlaceVoteKind,
  placeId: string,
): PlaceVoteSummary {
  return {
    place_kind: placeKind,
    place_id: placeId,
    like_count: 0,
    dislike_count: 0,
    my_vote: null,
  };
}
