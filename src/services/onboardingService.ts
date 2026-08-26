import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@opennotes:onboarding:v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'complete';
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'complete');
}
