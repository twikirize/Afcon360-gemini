import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../api/client';
import { colors, radii, spacing } from '../theme/tokens';
import type { RideRequest, ScheduledRoute } from '../types/domain';

export function TransportScreen() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [serviceType, setServiceType] = useState<'standard' | 'executive' | 'shuttle'>('standard');
  const [routes, setRoutes] = useState<ScheduledRoute[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);

  const load = () => {
    mobileApi.getTransport().then((res) => {
      setRoutes(res.routes);
      setRides(res.activeRequests);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleRequestRide = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Missing Locations', 'Enter both pickup and dropoff addresses.');
      return;
    }
    try {
      const res = await mobileApi.requestRide({ pickup, dropoff, serviceType });
      Alert.alert('Ride Dispatched', `Reference: ${res.ride.ref}`);
      setPickup('');
      setDropoff('');
      load();
    } catch (err: any) {
      Alert.alert('Request Failed', err.message || 'Unable to request ride.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Request a Ride</Text>
        <TextInput
          style={styles.input}
          placeholder="Pickup location (e.g. Entebbe Arrivals)"
          placeholderTextColor={colors.textMuted}
          value={pickup}
          onChangeText={setPickup}
        />
        <TextInput
          style={styles.input}
          placeholder="Dropoff destination (e.g. Kololo)"
          placeholderTextColor={colors.textMuted}
          value={dropoff}
          onChangeText={setDropoff}
        />
        <View style={styles.segmentRow}>
          {(['standard', 'executive', 'shuttle'] as const).map((tier) => (
            <Pressable
              key={tier}
              style={[styles.segmentBtn, serviceType === tier && styles.segmentActive]}
              onPress={() => setServiceType(tier)}
            >
              <Text style={[styles.segmentText, serviceType === tier && styles.segmentTextActive]}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.primaryBtn} onPress={handleRequestRide}>
          <Text style={styles.primaryBtnText}>Request Ride</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Scheduled Corridor Shuttles</Text>
      {routes.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.meta}>
            {r.code} · {r.city} · {r.nextDeparture}
          </Text>
          <Text style={styles.routeTitle}>
            {r.origin} → {r.destination}
          </Text>
          <Text style={styles.price}>
            {r.currency} {r.baseFare.toLocaleString()} · {r.estimatedMinutes} min
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Your Active Requests</Text>
      {rides.map((ride) => (
        <View key={ride.id} style={styles.card}>
          <Text style={styles.meta}>
            {ride.ref} · {ride.status.toUpperCase()}
          </Text>
          <Text style={styles.routeTitle}>
            {ride.pickup} → {ride.dropoff}
          </Text>
          <Text style={styles.meta}>Driver: {ride.driverName}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody },
  content: { padding: spacing.lg, paddingBottom: 32 },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 10,
    fontSize: 15,
  },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  segmentBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.brandPrimaryLight, borderColor: colors.brandPrimary },
  segmentText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  segmentTextActive: { color: colors.brandPrimaryDark, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: colors.brandPrimary,
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginVertical: 10 },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  routeTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '700', color: colors.brandPrimaryDark },
});
