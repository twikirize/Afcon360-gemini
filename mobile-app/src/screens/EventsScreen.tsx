import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../api/client';
import { colors, radii, spacing } from '../theme/tokens';
import type { EventItem, EventRegistration } from '../types/domain';

export function EventsScreen({ navigation }: { navigation: any }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [passes, setPasses] = useState<EventRegistration[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mobileApi.getEvents(query),
      mobileApi.getUserSummary().catch(() => ({ registrations: [] as EventRegistration[] })),
    ])
      .then(([evtRes, summaryRes]) => {
        setEvents(evtRes.events);
        setPasses(summaryRes.registrations || []);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Filter events by name or city..."
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
      />
      {loading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginVertical: 16 }} /> : null}
      <FlatList
        data={events}
        keyExtractor={(e) => e.publicId}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          passes.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.bgSurfaceAlt }]}>
              <Text style={styles.kicker}>MY TICKETS &amp; PASSES ({passes.length})</Text>
              {passes.map((p) => (
                <Pressable
                  key={p.ref}
                  style={styles.passRow}
                  onPress={() =>
                    Alert.alert(
                      'Verified Event Pass',
                      `${p.eventName}\n${p.ticketTypeName} · Qty ${p.quantity}\nRef: ${p.ref}`
                    )
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passTitle}>{p.eventName}</Text>
                    <Text style={styles.meta}>
                      {p.ticketTypeName} · {p.ref}
                    </Text>
                  </View>
                  <Text style={styles.cta}>View Pass</Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('EventDetail', { event: item })}
          >
            <Text style={styles.meta}>
              {item.category} · {item.city}, {item.country} · {item.startDate}
            </Text>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.price}>
                From {item.ticketTypes[0]?.currency} {item.ticketTypes[0]?.price.toLocaleString()}
              </Text>
              <Text style={styles.cta}>Select Pass →</Text>
            </View>
          </Pressable>
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
  kicker: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6 },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  passTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 14, fontWeight: '700', color: colors.brandPrimaryDark },
  cta: { fontSize: 14, fontWeight: '700', color: colors.brandPrimary },
});
