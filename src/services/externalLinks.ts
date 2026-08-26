import { Alert, Linking } from 'react-native';

export const OPEN_NOTES_LINKS = {
  github: 'https://github.com/mathnotes-app/OpenNotes',
  privacy: 'https://mathnotes-app.github.io/OpenNotes/privacy/',
  support: 'https://mathnotes-app.github.io/OpenNotes/support/',
  terms: 'https://mathnotes-app.github.io/OpenNotes/terms/',
  x: 'https://x.com/markpm39',
} as const;

export async function openExternalLink(url: string, source: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (error) {
    if (__DEV__) console.warn(`[${source}] open link failed`, error);
    Alert.alert('Could not open link', 'Please try again.');
  }
}
