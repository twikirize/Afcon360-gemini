import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme/tokens';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const ARCHITECTURE_SECTIONS = [
  {
    title: 'Expo Runtime & Native Capabilities',
    icon: 'layers-outline' as const,
    summary:
      'Built on Expo SDK 52 with React Native 0.76 and TypeScript for unified iOS and Android delivery from a single codebase.',
    points: [
      'expo-secure-store stores JWT/Bearer access tokens inside iOS Keychain and Android Keystore.',
      'expo-status-bar and react-native-safe-area-context handle notch, status bar, and gesture insets across devices.',
      'Configured in app.json with bundle identifiers (space.pamoja.app) and EAS build profiles for preview .apk and TestFlight .ipa releases.',
    ],
  },
  {
    title: 'React Navigation Topology',
    icon: 'git-branch-outline' as const,
    summary:
      'Combines a top-level Bottom Tab Navigator with nested Native Stack navigators for deep customer journeys.',
    points: [
      'Top-level Bottom Tabs: Home, Events, Stays, Rides, Wallet, Account, and About.',
      'EventsNavigator wraps EventsList and EventDetail in a Native Stack for pass selection and instant registration.',
      'AuthContext wraps NavigationContainer so Bearer session restoration from SecureStore stays active across all tabs.',
    ],
  },
  {
    title: 'Pamoja Flask Backend Integration',
    icon: 'server-outline' as const,
    summary:
      'Connects directly to the Pamoja Flask REST & mobile API endpoints configured via EXPO_PUBLIC_API_URL.',
    points: [
      'Auth routes (/api/auth/mobile/login, /register, /me) align with app/auth/mobile_api.py using Authorization: Bearer <token>.',
      'Unified discovery & domain endpoints: /api/home/feed, /api/events, /api/accommodation/properties, /api/transport/routes, and /api/wallet.',
      'Centralized fetch wrapper in src/api/client.ts injects JSON headers, attaches SecureStore tokens, and normalizes API errors.',
    ],
  },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/api/auth/mobile/login', purpose: 'Bearer token sign-in (app/auth/mobile_api.py)' },
  { method: 'POST', path: '/api/auth/mobile/register', purpose: 'Customer onboarding & wallet setup' },
  { method: 'GET', path: '/api/home/feed', purpose: 'Unified events, stays, routes & offers feed' },
  { method: 'POST', path: '/api/events/:slug/register', purpose: 'Ticket reservation & pass confirmation' },
  { method: 'POST', path: '/api/accommodation/book', purpose: 'Verified stay booking checkout' },
  { method: 'POST', path: '/api/transport/ride-request', purpose: 'On-demand pickup & dropoff dispatch' },
  { method: 'GET', path: '/api/wallet', purpose: 'Multi-currency balance & transaction ledger' },
];

export function AboutScreen() {
  const [healthState, setHealthState] = useState<'idle' | 'checking' | 'online' | 'error'>('idle');
  const [healthMessage, setHealthMessage] = useState('Tap below to verify connectivity to your configured backend.');

  const checkBackendHealth = async () => {
    setHealthState('checking');
    try {
      const res = await fetch(`${API_BASE}/api/health/ping`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealthState('online');
      setHealthMessage(`Connected (${data.status || 'ok'}) at ${API_BASE}`);
    } catch (err: any) {
      setHealthState('error');
      setHealthMessage(err?.message || `Unable to reach ${API_BASE}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>ARCHITECTURE OVERVIEW</Text>
        <Text style={styles.heroTitle}>Pamoja Mobile Client Stack</Text>
        <Text style={styles.heroBody}>
          Cross-platform iOS &amp; Android customer app built with Expo, React Navigation, and typed Bearer-authenticated Flask API integration.
        </Text>
        <View style={styles.envRow}>
          <Text style={styles.envLabel}>Configured API Base</Text>
          <Text style={styles.envValue} numberOfLines={1}>
            {API_BASE}
          </Text>
        </View>
      </View>

      {ARCHITECTURE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name={section.icon} size={20} color={colors.brandPrimary} />
            </View>
            <Text style={styles.cardTitle}>{section.title}</Text>
          </View>
          <Text style={styles.cardSummary}>{section.summary}</Text>
          {section.points.map((point) => (
            <View key={point} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend API Contract</Text>
        <Text style={styles.cardSummary}>Core endpoints consumed by src/api/client.ts:</Text>
        {API_ENDPOINTS.map((ep, idx) => (
          <View key={ep.path} style={[styles.endpointRow, idx === API_ENDPOINTS.length - 1 ? styles.endpointLast : null]}>
            <View style={styles.endpointTop}>
              <Text style={styles.method}>{ep.method}</Text>
              <Text style={styles.path}>{ep.path}</Text>
            </View>
            <Text style={styles.purpose}>{ep.purpose}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Connectivity Check</Text>
        <Text style={[styles.healthText, healthState === 'online' ? styles.healthOk : healthState === 'error' ? styles.healthErr : null]}>
          {healthMessage}
        </Text>
        <Pressable style={styles.primaryBtn} onPress={checkBackendHealth} disabled={healthState === 'checking'}>
          {healthState === 'checking' ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryBtnText}>Ping /api/health/ping</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody },
  content: { padding: spacing.lg, paddingBottom: 32 },
  heroCard: {
    backgroundColor: colors.brandPrimaryDark,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  eyebrow: {
    color: colors.brandAccent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginBottom: 8 },
  heroBody: { color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  envRow: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  envLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  envValue: { color: colors.brandAccent, fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.brandPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  cardSummary: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  bullet: { color: colors.brandPrimary, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  endpointRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  endpointLast: { borderBottomWidth: 0, paddingBottom: 0 },
  endpointTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  method: { fontSize: 12, fontWeight: '800', color: colors.brandPrimary },
  path: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  purpose: { fontSize: 12, color: colors.textMuted },
  healthText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },
  healthOk: { color: colors.success, fontWeight: '600' },
  healthErr: { color: colors.danger, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    minHeight: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
