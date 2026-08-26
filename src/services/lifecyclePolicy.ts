export const COMMUNITY_NOTE_THRESHOLD = 3;
export const REVIEW_NOTE_THRESHOLD = 5;
export const REVIEW_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const REVIEW_AFTER_COMMUNITY_DELAY_MS = 24 * 60 * 60 * 1000;

export type CommunityPromptState = 'pending' | 'joined' | 'dismissed';

export interface LifecycleState {
  firstSeenAt: string;
  lastSuccessfulSaveAt: string | null;
  savedNoteIds: string[];
  communityPromptState: CommunityPromptState;
  communityHandledAt: string | null;
  reviewPromptedVersions: string[];
}

export function createLifecycleState(now: string): LifecycleState {
  return {
    firstSeenAt: now,
    lastSuccessfulSaveAt: null,
    savedNoteIds: [],
    communityPromptState: 'pending',
    communityHandledAt: null,
    reviewPromptedVersions: [],
  };
}

export function normalizeLifecycleState(
  value: Partial<LifecycleState> | null | undefined,
  now: string,
): LifecycleState {
  const fallback = createLifecycleState(now);
  if (!value) return fallback;

  const communityPromptState =
    value.communityPromptState === 'joined' ||
    value.communityPromptState === 'dismissed'
      ? value.communityPromptState
      : 'pending';

  return {
    firstSeenAt: isIsoDate(value.firstSeenAt) ? value.firstSeenAt : now,
    lastSuccessfulSaveAt: isIsoDate(value.lastSuccessfulSaveAt)
      ? value.lastSuccessfulSaveAt
      : null,
    savedNoteIds: uniqueStrings(value.savedNoteIds).slice(0, REVIEW_NOTE_THRESHOLD),
    communityPromptState,
    communityHandledAt: isIsoDate(value.communityHandledAt)
      ? value.communityHandledAt
      : null,
    reviewPromptedVersions: uniqueStrings(value.reviewPromptedVersions),
  };
}

export function recordUniqueNoteSave(
  state: LifecycleState,
  noteId: string,
  now: string,
): LifecycleState {
  const savedNoteIds = state.savedNoteIds.includes(noteId)
    ? state.savedNoteIds
    : [...state.savedNoteIds, noteId].slice(0, REVIEW_NOTE_THRESHOLD);

  return {
    ...state,
    lastSuccessfulSaveAt: now,
    savedNoteIds,
  };
}

export function shouldOfferCommunity(state: LifecycleState): boolean {
  return (
    state.communityPromptState === 'pending' &&
    state.savedNoteIds.length >= COMMUNITY_NOTE_THRESHOLD
  );
}

export function shouldRequestReview(
  state: LifecycleState,
  appVersion: string,
  nowMs: number,
): boolean {
  if (state.savedNoteIds.length < REVIEW_NOTE_THRESHOLD) return false;
  if (
    state.communityPromptState !== 'joined' &&
    state.communityPromptState !== 'dismissed'
  ) {
    return false;
  }
  if (state.reviewPromptedVersions.includes(appVersion)) return false;

  const firstSeenMs = Date.parse(state.firstSeenAt);
  const communityHandledMs = state.communityHandledAt
    ? Date.parse(state.communityHandledAt)
    : Number.NaN;
  if (!Number.isFinite(firstSeenMs) || !Number.isFinite(communityHandledMs)) {
    return false;
  }
  return (
    nowMs - firstSeenMs >= REVIEW_MIN_AGE_MS &&
    nowMs - communityHandledMs >= REVIEW_AFTER_COMMUNITY_DELAY_MS
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))];
}
