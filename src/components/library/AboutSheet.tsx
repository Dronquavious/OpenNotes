import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Sheet } from '../ui/Sheet';
import { OPEN_NOTES_LINKS, openExternalLink } from '../../services/externalLinks';

export function AboutSheet({
  visible,
  onClose,
  onViewIntroduction,
}: {
  visible: boolean;
  onClose: () => void;
  onViewIntroduction: () => void;
}) {
  const theme = useTheme();
  const openUrl = useCallback((url: string) => openExternalLink(url, 'AboutSheet'), []);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: theme.colors.accentMuted }]}>
          <Ionicons name="information-circle-outline" size={22} color={theme.colors.accent} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[typography.title, { color: theme.colors.text }]}>About OpenNotes</Text>
          <Text style={[typography.footnote, { color: theme.colors.textSecondary }]}>Simple notes, open foundations.</Text>
        </View>
      </View>

      <Text style={[typography.callout, styles.body, { color: theme.colors.text }]}>
        OpenNotes is meant to be a no-bloat, simple, free, open source notes app.
        Most notes apps collect years of extra features, put important tools behind
        a subscription, and keep the underlying ink technology closed source.
      </Text>
      <Text style={[typography.callout, styles.body, { color: theme.colors.text }]}>
        It is also local and privacy focused: we do not collect anything, and your
        notes never leave your device.
      </Text>
      <Text style={[typography.callout, styles.body, { color: theme.colors.text }]}>
        This app starts from the opposite idea: keep the experience focused, make
        the core technology inspectable, and build only what actually helps people write.
      </Text>
      <Text style={[typography.footnote, styles.body, { color: theme.colors.textSecondary }]}>
        OpenNotes is powered by the open source Mobile Ink engine.
      </Text>
      <View style={styles.links}>
        <AboutLink label="View introduction" onPress={onViewIntroduction} />
        <AboutLink label="Privacy" onPress={() => void openUrl(OPEN_NOTES_LINKS.privacy)} />
        <AboutLink label="Terms" onPress={() => void openUrl(OPEN_NOTES_LINKS.terms)} />
        <AboutLink label="Support" onPress={() => void openUrl(OPEN_NOTES_LINKS.support)} />
      </View>
    </Sheet>
  );
}

function AboutLink({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.link,
        { borderColor: theme.colors.divider },
        pressed && { opacity: 0.65 },
      ]}
    >
      <Text style={[typography.callout, styles.linkText, { color: theme.colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.lg },
  icon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 36,
  },
  titleBlock: { flex: 1 },
  body: { lineHeight: 22, marginBottom: spacing.md },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  link: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  linkText: { fontWeight: '600' },
});
