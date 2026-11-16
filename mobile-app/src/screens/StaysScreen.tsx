import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../api/client';
import { colors, radii, spacing } from '../theme/tokens';
import type { PropertyItem } from '../types/domain';

export function StaysScreen() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (c = city) => {
    mobileApi
      .getProperties(c)
      .then((res) => setProperties(res.properties))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(city);
  }, [city]);

  const handleBook = async (prop: PropertyItem) => {
    try {
      const res = await mobileApi.bookStay({
        propertyId: prop.id,
        nights: 2,
        guests: 1,
        checkIn: '2027-06-14',
        paymentMethod: 'Pamoja Wallet',
      });
      Alert.alert('Stay Booked', `${prop.name} reserved (${res.booking.ref})`);
      load(city);
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Could not complete reservation.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Filter by city (Kampala, Nairobi, Zanzibar)..."
        placeholderTextColor={colors.textMuted}
        value={city}
        onChangeText={setCity}
      />
      {loading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginVertical: 16 }} /> : null}
      <FlatList
        data={properties}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.meta}>
              {item.propertyType.toUpperCase()} · {item.city}, {item.country} · ★ {item.rating} · {item.availableRooms} rooms left
            </Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.amenities}>{item.amenities.join(' · ')}</Text>
            <View style={styles.footer}>
              <Text style={styles.price}>
                {item.currency} {item.pricePerNight.toLocaleString()} / night
              </Text>
              <Pressable
                style={[styles.btn, item.availableRooms < 1 && styles.btnDisabled]}
                disabled={item.availableRooms < 1}
                onPress={() => handleBook(item)}
              >
                <Text style={styles.btnText}>{item.availableRooms < 1 ? 'Sold Out' : 'Book 2 Nights'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBody, padding: spacing.lg },
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
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  amenities: { fontSize: 12, color: colors.brandPrimary, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '700', color: colors.brandPrimaryDark },
  btn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
