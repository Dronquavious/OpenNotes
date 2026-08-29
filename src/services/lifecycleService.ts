import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import {
  createLifecycleState,
  normalizeLifecycleState,
  recordUniqueNoteSave,
  shouldOfferCommunity,
  shouldRequestReview,
  type CommunityPromptState,
  type LifecycleState,
} from './lifecyclePolicy';
import { createPromiseQueue } from '../utils/promiseQueue';

const LIFECYCLE_KEY = '@opennotes:lifecycle:v1';
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

const stateQueue = createPromiseQueue();
let reviewRequest: Promise<boolean> | null = null;
let communityPromptClaimedThisSession = false;

function withStateLock<T>(operation: () => Promise<T>): Promise<T> {
  return stateQueue.enqueue(operation);
}

async function readStateUnlocked(): Promise<LifecycleState> {
  const now = new Date().toISOString();
  const raw = await AsyncStorage.getItem(LIFECYCLE_KEY);
  if (!raw) return createLifecycleState(now);

  try {
    return normalizeLifecycleState(
      JSON.parse(raw) as Partial<LifecycleState>,
      now,
    );
  } catch (error) {
    if (__DEV__) console.warn('[lifecycleService] invalid stored state', error);
    return createLifecycleState(now);
  }
}

async function writeStateUnlocked(state: LifecycleState): Promise<void> {
  await AsyncStorage.setItem(LIFECYCLE_KEY, JSON.stringify(state));
}

export async function recordSuccessfulNoteSave(noteId: string): Promise<void> {
  if (!noteId) return;
  await withStateLock(async () => {
    const state = await readStateUnlocked();
    const next = recordUniqueNoteSave(state, noteId, new Date().toISOString());
    await writeStateUnlocked(next);
  });
}

export async function claimCommunityPrompt(): Promise<boolean> {
  return withStateLock(async () => {
    if (communityPromptClaimedThisSession) return false;
    const state = await readStateUnlocked();
    if (!shouldOfferCommunity(state)) return false;
    communityPromptClaimedThisSession = true;
    return true;
  });
}

export async function resolveCommunityPrompt(
  resolution: Extract<CommunityPromptState, 'joined' | 'dismissed'>,
): Promise<void> {
  await withStateLock(async () => {
    const state = await readStateUnlocked();
    await writeStateUnlocked({
      ...state,
      communityPromptState: resolution,
      communityHandledAt: new Date().toISOString(),
    });
  });
}

export function requestAutomaticReviewIfEligible(): Promise<boolean> {
  if (reviewRequest) return reviewRequest;
  reviewRequest = requestAutomaticReview().finally(() => {
    reviewRequest = null;
  });
  return reviewRequest;
}

async function requestAutomaticReview(): Promise<boolean> {
  const state = await withStateLock(readStateUnlocked);
  if (!shouldRequestReview(state, APP_VERSION, Date.now())) return false;

  const available = await StoreReview.isAvailableAsync();
  if (!available || !(await StoreReview.hasAction())) return false;

  await StoreReview.requestReview();
  await markReviewRequested();
  return true;
}

export async function requestManualReview(): Promise<boolean> {
  const available = await StoreReview.isAvailableAsync();
  if (!available || !(await StoreReview.hasAction())) return false;

  await StoreReview.requestReview();
  await markReviewRequested();
  return true;
}

async function markReviewRequested(): Promise<void> {
  await withStateLock(async () => {
    const state = await readStateUnlocked();
    if (state.reviewPromptedVersions.includes(APP_VERSION)) return;
    await writeStateUnlocked({
      ...state,
      reviewPromptedVersions: [...state.reviewPromptedVersions, APP_VERSION],
    });
  });
}
