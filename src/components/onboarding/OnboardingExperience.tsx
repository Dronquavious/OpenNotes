import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { OPEN_NOTES_LINKS, openExternalLink } from '../../services/externalLinks';

const SLIDES = [
  {
    key: 'write',
    eyebrow: 'OPENNOTES',
    title: 'Write freely.',
    body: 'A focused place for handwriting, PDFs, and ideas—without subscriptions or bloat.',
    image: require('../../../assets/onboarding/write-freely.png'),
    imageLabel: 'Floating paper pages and a stylus drawing a blue line',
    lightTint: '#F2F5FF',
    darkTint: '#10172B',
  },
  {
    key: 'privacy',
    eyebrow: 'PRIVATE BY DESIGN',
    title: 'Your notes stay yours.',
    body: 'No account. No analytics. No cloud storage. Your notebooks stay on your device unless you choose to share them.',
    image: require('../../../assets/onboarding/private-by-design.png'),
    imageLabel: 'A paper note protected by a glass shield and blue lock',
    lightTint: '#F0F7FF',
    darkTint: '#0E1A27',
  },
  {
    key: 'mission',
    eyebrow: 'FREE & OPEN SOURCE',
    title: 'Help open tools grow.',
    body: 'OpenNotes is free for everyone. If it earns a place in your workflow, a star or review helps more people find it.',
    image: require('../../../assets/onboarding/help-it-grow.png'),
    imageLabel: 'A blue star floating above an open notebook',
    lightTint: '#F5F2FF',
    darkTint: '#171329',
  },
] as const;

export interface OnboardingExperienceProps {
  visible: boolean;
  onComplete: () => void | Promise<void>;
}

export function OnboardingExperience({
  visible,
  onComplete,
}: OnboardingExperienceProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setPage(0);
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
  }, [visible]);

  const finish = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void onComplete();
  }, [onComplete]);

  const next = useCallback(() => {
    if (page >= SLIDES.length - 1) {
      finish();
      return;
    }
    void Haptics.selectionAsync();
    listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    setPage(page + 1);
  }, [finish, page]);

  const openGitHub = useCallback(async () => {
    await openExternalLink(OPEN_NOTES_LINKS.github, 'Onboarding');
  }, []);

  const requestReview = useCallback(async () => {
    try {
      const available = await StoreReview.isAvailableAsync();
      const hasAction = available && (await StoreReview.hasAction());
      if (!hasAction) {
        Alert.alert(
          'Thank you for the support',
          'Store reviews are available after OpenNotes is installed from the App Store or Play Store.',
        );
        return;
      }
      await StoreReview.requestReview();
    } catch (error) {
      if (__DEV__) console.warn('[Onboarding] review request failed', error);
      Alert.alert('Could not open the store review', 'Please try again later.');
    }
  }, []);

  const renderSlide = useCallback(
    ({ item, index }: ListRenderItemInfo<(typeof SLIDES)[number]>) => (
      <OnboardingSlide
        item={item}
        width={width}
        isDark={theme.isDark}
        isActive={page === index}
      />
    ),
    [page, theme.isDark, width],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={finish}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <View style={styles.wordmark} accessibilityLabel="OpenNotes">
            <View style={[styles.wordmarkIcon, { backgroundColor: theme.colors.accent }]}>
              <Ionicons name="pencil" color="#FFFFFF" size={15} />
            </View>
            <Text style={[styles.wordmarkText, { color: theme.colors.text }]}>OpenNotes</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
            onPress={finish}
            hitSlop={10}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
          >
            <Text style={[typography.subhead, styles.skipText, { color: theme.colors.textSecondary }]}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            setPage(Math.round(event.nativeEvent.contentOffset.x / width));
          }}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        />

        <View style={styles.footer}>
          {page === SLIDES.length - 1 ? (
            <View style={styles.supportActions}>
              <SupportButton icon="logo-github" label="Star on GitHub" onPress={() => void openGitHub()} />
              <SupportButton icon="star-outline" label="Leave a review" onPress={() => void requestReview()} />
            </View>
          ) : (
            <View style={styles.supportPlaceholder} />
          )}

          <View accessibilityRole="tablist" accessibilityLabel="Introduction progress" style={styles.dots}>
            {SLIDES.map((slide, index) => (
              <View
                key={slide.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: page === index }}
                style={[
                  styles.dot,
                  { backgroundColor: page === index ? theme.colors.accent : theme.colors.divider },
                  page === index && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={next}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.colors.accent },
              pressed && styles.primaryPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {page === SLIDES.length - 1 ? 'Start writing' : 'Continue'}
            </Text>
            <Ionicons
              name={page === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
              color="#FFFFFF"
              size={19}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function OnboardingSlide({
  item,
  width,
  isDark,
  isActive,
}: {
  item: (typeof SLIDES)[number];
  width: number;
  isDark: boolean;
  isActive: boolean;
}) {
  const theme = useTheme();
  const float = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      float.value = 0;
      return;
    }
    float.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
      -1,
      true,
    );
  }, [float, isActive]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value * -8 }, { rotate: `${float.value * 0.6 - 0.3}deg` }],
  }));

  const artSize = Math.min(width - spacing.xxl * 2, 430);

  return (
    <View style={[styles.slide, { width }]}>
      <View
        style={[
          styles.artStage,
          {
            backgroundColor: isDark ? item.darkTint : item.lightTint,
            height: Math.min(artSize, 410),
            width: artSize,
          },
        ]}
      >
        <View style={[styles.glow, { backgroundColor: theme.colors.accentMuted }]} />
        <Animated.View style={[styles.artworkWrap, artStyle]}>
          <Image
            source={item.image}
            resizeMode="contain"
            accessibilityLabel={item.imageLabel}
            style={{ height: '100%', width: '100%' }}
          />
        </Animated.View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{item.eyebrow}</Text>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>{item.body}</Text>
      </View>
    </View>
  );
}

function SupportButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.supportButton,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} color={theme.colors.text} size={17} />
      <Text numberOfLines={1} style={[styles.supportButtonText, { color: theme.colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  wordmark: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  wordmarkIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  wordmarkText: { ...typography.headline, letterSpacing: -0.2 },
  skip: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  skipText: { fontWeight: '600' },
  pressed: { opacity: 0.62 },
  slide: { alignItems: 'center', flex: 1, paddingHorizontal: spacing.xxl },
  artStage: {
    alignItems: 'center',
    borderRadius: 40,
    justifyContent: 'center',
    marginTop: spacing.md,
    maxHeight: '53%',
    overflow: 'hidden',
  },
  glow: {
    borderRadius: radius.pill,
    height: '62%',
    opacity: 0.75,
    position: 'absolute',
    width: '62%',
  },
  artworkWrap: { height: '96%', width: '96%' },
  copy: { alignItems: 'center', maxWidth: 540, paddingTop: spacing.xxl },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.45,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 42,
    textAlign: 'center',
  },
  body: {
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.md,
    maxWidth: 470,
    textAlign: 'center',
  },
  footer: { paddingBottom: spacing.md, paddingHorizontal: spacing.xl },
  supportActions: { flexDirection: 'row', gap: spacing.sm, height: 44 },
  supportPlaceholder: { height: 44 },
  supportButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  supportButtonText: { ...typography.subhead, fontWeight: '600' },
  dots: { alignItems: 'center', flexDirection: 'row', gap: 7, height: 34, justifyContent: 'center' },
  dot: { borderRadius: radius.pill, height: 6, width: 6 },
  activeDot: { width: 20 },
  primaryButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  primaryPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
});
