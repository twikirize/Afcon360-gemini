import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mobileApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { EventItem, PropertyItem, RideRequest, ScheduledRoute, TourismListing } from '../types/domain';

const PAMOJA_GREEN = '#0E5B36';
const PAMOJA_DARK = '#093E24';
const BG_CREAM = '#F5F6F2';
const MINT_CARD = '#D6EBDD';
const MINT_ICON = '#E8F4EC';
const PEACH_ICON = '#FCEEE2';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

type SearchScope = 'all' | 'transport' | 'stays' | 'events' | 'adventure';

interface SearchResultItem {
  id: string;
  scope: Exclude<SearchScope, 'all'> | 'wallet';
  categoryLabel: string;
  title: string;
  meta: string;
  keywords: string;
  tab: string;
}

const HOME_GRID = [
  {
    key: 'transport',
    title: 'Transport',
    subtitle: 'Find your ride',
    icon: 'bus-outline' as const,
    iconBg: MINT_ICON,
    tab: 'Rides',
  },
  {
    key: 'stays',
    title: 'Stays',
    subtitle: 'Find a place to stay',
    icon: 'bed-outline' as const,
    iconBg: PEACH_ICON,
    tab: 'Stays',
  },
  {
    key: 'events',
    title: 'Events & Tickets',
    subtitle: 'Events & QR passes',
    icon: 'calendar-outline' as const,
    iconBg: PEACH_ICON,
    tab: 'Events',
  },
  {
    key: 'adventure',
    title: 'Adventure',
    subtitle: 'Organise & join tours',
    icon: 'compass-outline' as const,
    iconBg: MINT_ICON,
    tab: 'Adventure',
  },
];

const SEARCH_SCOPES: Array<{ id: SearchScope; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'transport', label: 'Transport' },
  { id: 'stays', label: 'Stays' },
  { id: 'events', label: 'Events' },
  { id: 'adventure', label: 'Adventure' },
];

export function HomeScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [tours, setTours] = useState<TourismListing[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [routes, setRoutes] = useState<ScheduledRoute[]>([]);
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tourRes, evtRes, propRes, trnRes] = await Promise.all([
        mobileApi.getTourism(),
        mobileApi.getEvents(),
        mobileApi.getProperties(),
        mobileApi.getTransport(),
      ]);
      setTours(tourRes.listings || []);
      setEvents(evtRes.events || []);
      setProperties(propRes.properties || []);
      setRoutes(trnRes.routes || []);
      setRides(trnRes.activeRequests || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const searchCatalogue = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    routes.forEach((r) => {
      list.push({
        id: `route-${r.id}`,
        scope: 'transport',
        categoryLabel: 'Transport',
        title: `${r.origin} -> ${r.destination}`,
        meta: `${r.city} · ${r.vehicleClass} · ${r.currency} ${r.baseFare.toLocaleString()}`,
        keywords: `transport ride shuttle bus airport transfer ${r.code} ${r.city} ${r.origin} ${r.destination}`,
        tab: 'Rides',
      });
    });

    rides.forEach((ride) => {
      list.push({
        id: `ride-${ride.id}`,
        scope: 'transport',
        categoryLabel: 'Active Ride',
        title: `${ride.pickup} -> ${ride.dropoff}`,
        meta: `${ride.ref} · ${ride.status} · ${ride.currency} ${ride.estimatedFare.toLocaleString()}`,
        keywords: `transport ride cab driver ${ride.ref} ${ride.pickup} ${ride.dropoff} ${ride.serviceType}`,
        tab: 'Rides',
      });
    });

    properties.forEach((p) => {
      list.push({
        id: `stay-${p.id}`,
        scope: 'stays',
        categoryLabel: 'Accommodation',
        title: p.name,
        meta: `${p.city}, ${p.country} · ${p.currency} ${p.pricePerNight.toLocaleString()} / night`,
        keywords: `stays accommodation hotel apartment lodge riad ${p.city} ${p.country} ${p.propertyType} ${p.amenities.join(' ')}`,
        tab: 'Stays',
      });
    });

    events.forEach((e) => {
      const leadTier = e.ticketTypes?.[0];
      const priceLabel = leadTier ? `From ${leadTier.currency} ${leadTier.price.toLocaleString()}` : e.category;
      list.push({
        id: `event-${e.id}`,
        scope: 'events',
        categoryLabel: 'Event',
        title: e.name,
        meta: `${e.city} · ${e.startDate} · ${priceLabel}`,
        keywords: `events tickets pass festival marathon conference ${e.city} ${e.country} ${e.venue} ${e.category}`,
        tab: 'Events',
      });
    });

    tours.forEach((t) => {
      list.push({
        id: `tour-${t.id}`,
        scope: 'adventure',
        categoryLabel: 'Adventure Tour',
        title: t.title,
        meta: `${t.region}, ${t.country} · ${t.operatorName} · ${t.currency} ${t.price.toLocaleString()}`,
        keywords: `tourism safari adventure tour operator join organise ${t.region} ${t.country} ${t.category} ${t.operatorName} ${t.meetingPoint} ${t.summary}`,
        tab: 'Adventure',
      });
    });

    list.push({
      id: 'shortcut-wallet',
      scope: 'wallet',
      categoryLabel: 'Wallet',
      title: 'Your Pamoja Wallet',
      meta: 'Payments, mobile money & top-up',
      keywords: 'wallet balance money pay deposit transfer',
      tab: 'Wallet',
    });

    return list;
  }, [routes, rides, properties, events, tours]);

  const hasActiveSearch = query.trim().length > 0 || scope !== 'all';

  const filtered = useMemo(() => {
    if (!hasActiveSearch) return [];
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return searchCatalogue.filter((item) => {
      if (scope !== 'all' && item.scope !== scope) return false;
      if (!tokens.length) return true;
      const haystack = `${item.title} ${item.meta} ${item.categoryLabel} ${item.keywords}`.toLowerCase();
      return tokens.every((tk) => haystack.includes(tk));
    });
  }, [hasActiveSearch, query, scope, searchCatalogue]);

  const showAlerts = () => {
    Alert.alert(
      'Pamoja Updates',
      user
        ? `Signed in as ${user.fullName}. All passes and bookings are synced.`
        : 'Sign in from Account to sync your tickets and bookings.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={PAMOJA_GREEN}
            onRefresh={() => {
              setRefreshing(true);
              loadAll();
            }}
          />
        }
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.topHeader}>
              <View style={styles.brandRow}>
                <View style={styles.emblemOuter}>
                  <View style={styles.emblemInner}>
                    <Ionicons name="triangle" size={14} color="#F5B700" />
                  </View>
                </View>
                <Text style={styles.brandTitle}>Pamoja</Text>
              </View>

              <View style={styles.topActions}>
                <Pressable style={styles.circleBtn} onPress={showAlerts}>
                  <Ionicons name="notifications-outline" size={20} color={PAMOJA_GREEN} />
                </Pressable>
                <Pressable style={[styles.circleBtn, styles.circleBtnMint]} onPress={() => navigation.navigate('Account')}>
                  <Ionicons name="person-outline" size={20} color={PAMOJA_GREEN} />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroStage}>
              <View style={styles.heroCard}>
                <View style={styles.heroGlowOrb} />
                <View style={styles.heroLeft}>
                  <Text style={styles.heroEyebrow}>EAST AFRICA</Text>
                  <Text style={styles.heroTitle}>Your world,{'\n'}together.</Text>
                  <Text style={styles.heroSub}>One app. More to explore.</Text>
                </View>
                <View style={styles.heroIllustration}>
                  <View style={styles.sunHalo}>
                    <View style={styles.sunDot} />
                  </View>
                  <View style={styles.skylineBack}>
                    <View style={[styles.tower, { height: 40 }]} />
                    <View style={[styles.tower, { height: 58, backgroundColor: '#5D9A74' }]} />
                    <View style={[styles.tower, { height: 34 }]} />
                    <View style={[styles.tower, { height: 50, backgroundColor: '#498762' }]} />
                  </View>
                  <View style={styles.travelerRow}>
                    <View style={styles.travelerCircleWarm}>
                      <Ionicons name="people" size={24} color="#FFFFFF" />
                    </View>
                  </View>
                </View>

                <View style={styles.heroHillBand} />

                <View style={styles.floatingSearchLayer}>
                  <Ionicons name="search-outline" size={19} color={PAMOJA_DARK} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search transport, stays, adventure..."
                    placeholderTextColor="#164029"
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                  />
                  {hasActiveSearch ? (
                    <Pressable
                      onPress={() => {
                        setQuery('');
                        setScope('all');
                      }}
                    >
                      <Ionicons name="close-circle" size={19} color="#093E24" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {hasActiveSearch ? (
                <View style={styles.scopeTabsRow}>
                  {SEARCH_SCOPES.map((tab) => {
                    const active = scope === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        style={[styles.scopeTabBtn, active && styles.scopeTabBtnActive]}
                        onPress={() => setScope(tab.id)}
                      >
                        <Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>{tab.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {loading && hasActiveSearch ? <ActivityIndicator size="small" color={PAMOJA_GREEN} style={{ marginBottom: 10 }} /> : null}
            {hasActiveSearch ? (
              <Text style={styles.searchHeading}>
                Search results ({filtered.length})
              </Text>
            ) : null}

            <Text style={styles.sectionTitle}>Make yourself feel at home</Text>

            <View style={styles.grid}>
              {HOME_GRID.map((card) => (
                <Pressable key={card.key} style={styles.gridCard} onPress={() => navigation.navigate(card.tab)}>
                  <View style={styles.gridCardTop}>
                    <View style={[styles.gridIconCircle, { backgroundColor: card.iconBg }]}>
                      <Ionicons name={card.icon} size={20} color={PAMOJA_GREEN} />
                    </View>
                    <Ionicons name="arrow-up-outline" size={17} color="#4A554C" style={styles.diagArrow} />
                  </View>
                  <Text style={styles.gridTitle}>{card.title}</Text>
                  <Text style={styles.gridSub} numberOfLines={1}>
                    {card.subtitle}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.walletBanner} onPress={() => navigation.navigate('Wallet')}>
              <View style={styles.bannerLeft}>
                <View style={styles.walletIconBox}>
                  <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.walletTitle}>Your Pamoja wallet</Text>
                  <Text style={styles.walletSub}>Payments, all in one place</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable style={styles.bookingsCard} onPress={() => navigation.navigate('Stays')}>
              <View style={styles.bannerLeft}>
                <View style={[styles.gridIconCircle, { backgroundColor: MINT_ICON }]}>
                  <Ionicons name="calendar-clear-outline" size={20} color={PAMOJA_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingsTitle}>My bookings</Text>
                  <Text style={styles.bookingsSub}>Manage your stays and rides</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6C766E" />
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.resultRow} onPress={() => navigation.navigate(item.tab)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultMeta}>
                {item.categoryLabel} · {item.meta}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PAMOJA_GREEN} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_CREAM },
  content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emblemOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5B700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PAMOJA_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontSize: 22, fontWeight: '800', color: PAMOJA_GREEN, letterSpacing: -0.4 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnMint: { backgroundColor: '#E6EFE8', borderColor: 'transparent' },
  heroStage: {
    position: 'relative',
    marginBottom: 18,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: MINT_CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 204,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowOrb: {
    position: 'absolute',
    top: -32,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(252, 238, 226, 0.55)',
  },
  heroHillBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    backgroundColor: 'rgba(30, 91, 57, 0.72)',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 80,
    zIndex: 1,
  },
  heroLeft: { flex: 1, justifyContent: 'space-between', paddingRight: 8, zIndex: 2 },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#1F5C3D',
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 25,
    fontWeight: '700',
    color: PAMOJA_DARK,
    lineHeight: 28,
    marginBottom: 12,
  },
  heroSub: { fontSize: 13, fontWeight: '500', color: '#214A34' },
  heroIllustration: {
    width: 118,
    height: 112,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
    zIndex: 2,
  },
  sunHalo: {
    position: 'absolute',
    top: 0,
    left: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 183, 0, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#EA8426',
  },
  skylineBack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    opacity: 0.35,
    marginBottom: 8,
  },
  tower: { width: 12, backgroundColor: PAMOJA_GREEN, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  travelerRow: { alignItems: 'center' },
  travelerCircleWarm: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E5B39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSearchLayer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 16,
    minHeight: 48,
    shadowColor: '#082918',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#082918' },
  scopeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginHorizontal: 10,
  },
  scopeTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4DD',
  },
  scopeTabBtnActive: {
    backgroundColor: PAMOJA_GREEN,
    borderColor: PAMOJA_GREEN,
  },
  scopeTabText: { fontSize: 12, fontWeight: '600', color: '#48524A' },
  scopeTabTextActive: { color: '#FFFFFF' },
  sectionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: '#122419',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  gridCard: {
    width: '48.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EAE4',
    padding: 14,
  },
  gridCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagArrow: { transform: [{ rotate: '45deg' }] },
  gridTitle: { fontSize: 16, fontWeight: '700', color: '#141915', marginBottom: 2 },
  gridSub: { fontSize: 12, color: '#6C766E' },
  walletBanner: {
    backgroundColor: PAMOJA_GREEN,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  walletIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  walletSub: { fontSize: 12, color: 'rgba(255,255,255,0.82)' },
  bookingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EAE4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingsTitle: { fontSize: 16, fontWeight: '700', color: '#141915', marginBottom: 2 },
  bookingsSub: { fontSize: 12, color: '#6C766E' },
  searchHeading: { fontSize: 13, fontWeight: '700', color: '#48524A', marginBottom: 8 },
  resultRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EAE4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#141915', marginBottom: 2 },
  resultMeta: { fontSize: 12, color: '#6C766E' },
});
