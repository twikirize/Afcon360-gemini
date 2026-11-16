import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { mobileApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme/tokens';
import type { TourBooking, TourismListing } from '../types/domain';

export function AdventureScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'join' | 'organise'>('join');
  const [query, setQuery] = useState('');
  const [tours, setTours] = useState<TourismListing[]>([]);
  const [bookings, setBookings] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Uganda');
  const [category, setCategory] = useState('Guided Expedition');
  const [operatorName, setOperatorName] = useState(user?.fullName || 'Nile Crest Expeditions');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [departureDate, setDepartureDate] = useState('2027-07-24 · 07:30');
  const [duration, setDuration] = useState('Full Day (8 hrs)');
  const [price, setPrice] = useState('180000');
  const [spotsTotal, setSpotsTotal] = useState('12');
  const [summary, setSummary] = useState('');

  const loadTours = async (q = query) => {
    setLoading(true);
    try {
      const res = await mobileApi.getTourism(q);
      setTours(res.listings || []);
      setBookings(res.bookings || []);
    } catch (e: any) {
      Alert.alert('Unable to load tours', e.message || 'Check connection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTours(query);
  }, [query]);

  const handleJoinTour = async (tour: TourismListing) => {
    setSubmitting(true);
    try {
      const res = await mobileApi.joinTour({
        tourId: tour.id,
        guests: 1,
        guestName: user?.fullName,
      });
      await loadTours(query);
      Alert.alert(
        'Tour Confirmed',
        `Joined ${res.booking.tourTitle} (${res.booking.ref}). Meet ${res.booking.operatorName} at ${res.booking.meetingPoint}.`
      );
    } catch (e: any) {
      Alert.alert('Booking failed', e.message || 'Could not join tour');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishTour = async () => {
    if (!title.trim() || !region.trim() || !meetingPoint.trim()) {
      Alert.alert('Missing fields', 'Enter tour title, region, and meeting point.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await mobileApi.organiseTour({
        title: title.trim(),
        region: region.trim(),
        country: country.trim() || 'Uganda',
        category: category.trim() || 'Guided Expedition',
        operatorName: operatorName.trim() || 'Verified Pamoja Operator',
        meetingPoint: meetingPoint.trim(),
        departureDate: departureDate.trim(),
        duration: duration.trim(),
        price: Number(price) || 150000,
        spotsTotal: Number(spotsTotal) || 12,
        summary: summary.trim(),
      });
      setTitle('');
      setRegion('');
      setMeetingPoint('');
      setSummary('');
      setMode('join');
      await loadTours('');
      Alert.alert('Tour Published', `${res.listing.title} is now open for travellers to join.`);
    } catch (e: any) {
      Alert.alert('Publish failed', e.message || 'Could not publish tour');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.modeSwitch}>
        <Pressable
          style={[styles.modeBtn, mode === 'join' && styles.modeBtnActive]}
          onPress={() => setMode('join')}
        >
          <Text style={[styles.modeText, mode === 'join' && styles.modeTextActive]}>Find &amp; Join</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, mode === 'organise' && styles.modeBtnActive]}
          onPress={() => setMode('organise')}
        >
          <Text style={[styles.modeText, mode === 'organise' && styles.modeTextActive]}>Organise Tour</Text>
        </Pressable>
      </View>

      {mode === 'organise' ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>TOUR OPERATOR PORTAL</Text>
          <Text style={styles.title}>Publish a Guided Tour</Text>
          <Text style={styles.desc}>
            List your departure so tourists on Pamoja can find your meeting point and join directly.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tour title (e.g. Jinja Nile Sunrise Kayaking)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Region / City (e.g. Jinja)"
            placeholderTextColor={colors.textMuted}
            value={region}
            onChangeText={setRegion}
          />
          <TextInput
            style={styles.input}
            placeholder="Country"
            placeholderTextColor={colors.textMuted}
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder="Category (e.g. Water & Wildlife)"
            placeholderTextColor={colors.textMuted}
            value={category}
            onChangeText={setCategory}
          />
          <TextInput
            style={styles.input}
            placeholder="Operator Name"
            placeholderTextColor={colors.textMuted}
            value={operatorName}
            onChangeText={setOperatorName}
          />
          <TextInput
            style={styles.input}
            placeholder="Meeting Point (e.g. Jinja Sailing Club Pier)"
            placeholderTextColor={colors.textMuted}
            value={meetingPoint}
            onChangeText={setMeetingPoint}
          />
          <TextInput
            style={styles.input}
            placeholder="Departure Date & Time"
            placeholderTextColor={colors.textMuted}
            value={departureDate}
            onChangeText={setDepartureDate}
          />
          <TextInput
            style={styles.input}
            placeholder="Duration"
            placeholderTextColor={colors.textMuted}
            value={duration}
            onChangeText={setDuration}
          />
          <View style={styles.rowTwo}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Price (UGX)"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Spots"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={spotsTotal}
              onChangeText={setSpotsTotal}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Tour summary & inclusions"
            placeholderTextColor={colors.textMuted}
            value={summary}
            onChangeText={setSummary}
          />

          <Pressable style={styles.primaryBtn} onPress={handlePublishTour} disabled={submitting}>
            <Text style={styles.primaryBtnText}>{submitting ? 'Publishing...' : 'Publish Tour'}</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <TextInput
            style={styles.search}
            placeholder="Filter tours by city, operator, wildlife..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />

          {loading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginVertical: 16 }} /> : null}

          {bookings.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.bgSurfaceAlt }]}>
              <Text style={styles.kicker}>MY JOINED TOURS ({bookings.length})</Text>
              {bookings.map((b) => (
                <View key={b.ref} style={styles.bookingRow}>
                  <Text style={styles.bookingTitle}>{b.tourTitle}</Text>
                  <Text style={styles.meta}>
                    {b.ref} · {b.operatorName} · Meet: {b.meetingPoint} ({b.departureDate})
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {tours.map((item) => (
            <View key={item.slug} style={styles.card}>
              <Text style={styles.meta}>
                {item.category} · {item.region}, {item.country} · {item.departureDate}
              </Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.summary}</Text>
              <Text style={styles.operatorMeta}>
                Operator: {item.operatorName} · Meet: {item.meetingPoint} · {item.spotsLeft} spots left
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>
                  {item.currency} {item.price.toLocaleString()}
                </Text>
                <Pressable
                  style={[styles.joinBtn, item.spotsLeft < 1 && styles.joinBtnDisabled]}
                  disabled={item.spotsLeft < 1 || submitting}
                  onPress={() => handleJoinTour(item)}
                >
                  <Text style={styles.joinBtnText}>{item.spotsLeft < 1 ? 'Full' : 'Join Tour'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody, padding: spacing.lg },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: '#E5E9E4',
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: { backgroundColor: colors.bgSurface },
  modeText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  modeTextActive: { color: colors.brandPrimaryDark, fontWeight: '700' },
  search: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    minHeight: 46,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  kicker: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  operatorMeta: { fontSize: 12, color: colors.brandPrimary, fontWeight: '600', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '700', color: colors.brandPrimaryDark },
  joinBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  bookingRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.borderLight },
  bookingTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  input: {
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    minHeight: 44,
    fontSize: 14,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  rowTwo: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    backgroundColor: colors.brandPrimaryDark,
    borderRadius: radii.md,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
