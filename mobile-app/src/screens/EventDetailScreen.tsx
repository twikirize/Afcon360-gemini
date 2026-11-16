import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mobileApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { EventItem } from '../types/domain';

export function EventDetailScreen({ route }: { route: { params: { event: EventItem } } }) {
  const { event } = route.params;
  const { user } = useAuth();
  const [selectedTierId, setSelectedTierId] = useState(event.ticketTypes[0]?.id ?? 0);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setSubmitting(true);
    try {
      const res = await mobileApi.registerForEvent(event.slug, {
        ticketTypeId: selectedTierId,
        quantity: 1,
        attendeeName: user?.fullName || 'Guest Attendee',
        attendeeEmail: user?.email || 'guest@pamoja.space',
      });
      Alert.alert('Ticket Confirmed', `Reference: ${res.registration.ref}`);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Unable to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>
        {event.category} · {event.city}, {event.country}
      </Text>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.body}>{event.description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoLine}>Dates: {event.startDate} to {event.endDate}</Text>
        <Text style={styles.infoLine}>Venue: {event.venue}</Text>
        <Text style={styles.infoLine}>Organizer: {event.organizer}</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Pass Tier</Text>
      {event.ticketTypes.map((tier) => {
        const active = tier.id === selectedTierId;
        return (
          <Pressable
            key={tier.id}
            style={[styles.tierCard, active && styles.tierActive]}
            onPress={() => setSelectedTierId(tier.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierDesc}>{tier.description} · {tier.available} left</Text>
            </View>
            <Text style={styles.tierPrice}>
              {tier.currency} {tier.price.toLocaleString()}
            </Text>
          </Pressable>
        );
      })}

      <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={submitting}>
        <Text style={styles.primaryBtnText}>{submitting ? 'Confirming...' : 'Confirm Registration'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody },
  content: { padding: spacing.lg, paddingBottom: 40 },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  infoBox: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: 6,
    marginBottom: 20,
  },
  infoLine: { fontSize: 14, color: colors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgSurface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: 10,
  },
  tierActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimaryLight },
  tierName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  tierDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  tierPrice: { fontSize: 15, fontWeight: '800', color: colors.brandPrimaryDark },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: colors.brandPrimary,
    minHeight: 50,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
