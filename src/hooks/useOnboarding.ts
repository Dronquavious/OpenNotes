import { useCallback, useEffect, useState } from 'react';
import {
  completeOnboarding,
  hasCompletedOnboarding,
} from '../services/onboardingService';

export function useOnboarding() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void hasCompletedOnboarding()
      .then((complete) => setVisible(!complete))
      .catch((error) => {
        if (__DEV__) console.warn('[useOnboarding] read state failed', error);
        setVisible(true);
      })
      .finally(() => setReady(true));
  }, []);

  const show = useCallback(() => setVisible(true), []);
  const finish = useCallback(async () => {
    setVisible(false);
    try {
      await completeOnboarding();
    } catch (error) {
      if (__DEV__) console.warn('[useOnboarding] save state failed', error);
    }
  }, []);

  return { finish, ready, show, visible };
}
