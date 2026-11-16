import crypto from 'node:crypto';

export interface UserRecord {
  id: number;
  publicId: string;
  email: string;
  fullName: string;
  phone: string;
  country: string;
  role: 'fan' | 'driver' | 'organizer' | 'admin';
  kycTier: number;
  passwordHash: string;
}

export interface TicketTypeRecord {
  id: number;
  name: string;
  price: number;
  currency: string;
  available: number;
  description: string;
}

export interface EventRecord {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  country: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: 'published' | 'draft';
  organizer: string;
  description: string;
  featured: boolean;
  ticketTypes: TicketTypeRecord[];
}

export interface EventRegistrationRecord {
  id: number;
  ref: string;
  eventId: number;
  eventSlug: string;
  eventName: string;
  userId: number;
  attendeeName: string;
  attendeeEmail: string;
  ticketTypeName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
}

export interface PropertyRecord {
  id: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  propertyType: 'hotel' | 'apartment' | 'lodge' | 'riad';
  pricePerNight: number;
  currency: string;
  rating: number;
  availableRooms: number;
  amenities: string[];
  description: string;
}

export interface AccommodationBookingRecord {
  id: number;
  ref: string;
  propertyId: number;
  propertyName: string;
  city: string;
  userId: number;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
}

export interface ScheduledRouteRecord {
  id: number;
  code: string;
  origin: string;
  destination: string;
  city: string;
  vehicleClass: string;
  estimatedMinutes: number;
  baseFare: number;
  currency: string;
  nextDeparture: string;
}

export interface RideRequestRecord {
  id: number;
  ref: string;
  userId: number;
  passengerName: string;
  pickup: string;
  dropoff: string;
  serviceType: 'standard' | 'executive' | 'shuttle';
  estimatedFare: number;
  currency: string;
  status: 'requested' | 'assigned' | 'completed';
  driverName: string;
  createdAt: string;
}

export interface DriverProfileState {
  driverCode: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  rating: number;
  isOnline: boolean;
  statusLabel: string;
  vehicle: {
    id: number;
    makeModel: string;
    plate: string;
    color: string;
    year: number;
    insuranceExpiry: string;
    complianceStatus: string;
  };
  earnings: {
    currency: string;
    today: number;
    week: number;
    month: number;
    hourlyRate: number;
    dailyGoal: number;
  };
  trips: Array<{
    id: number;
    time: string;
    date: string;
    duration: string;
    route: string;
    fare: number;
    distanceKm: number;
    status: string;
  }>;
}

export interface TourismListingRecord {
  id: number;
  slug: string;
  title: string;
  region: string;
  country: string;
  duration: string;
  price: number;
  currency: string;
  category: string;
  operatorName: string;
  meetingPoint: string;
  departureDate: string;
  spotsTotal: number;
  spotsLeft: number;
  summary: string;
}

export interface TourBookingRecord {
  id: number;
  ref: string;
  tourId: number;
  tourTitle: string;
  region: string;
  operatorName: string;
  meetingPoint: string;
  departureDate: string;
  userId: number;
  guestName: string;
  guests: number;
  totalAmount: number;
  currency: string;
  status: 'confirmed' | 'pending';
  createdAt: string;
}

export interface WalletAccountRecord {
  id: string;
  userId: number;
  accountName: string;
  currency: string;
  balance: number;
  status: 'ACTIVE' | 'FROZEN';
  verified: boolean;
  kycTier: number;
  dailyLimit: number;
}

export interface WalletTransactionRecord {
  id: string;
  userId: number;
  type: 'deposit' | 'transfer_out' | 'transfer_in' | 'booking_payment';
  sourceOrRecipient: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending';
  reference: string;
  createdAt: string;
}

// MOCKED — in-memory Redis replacement, data resets on container restart
const redisStore = new Map<string, string | number>();
export const redis = {
  get: async (k: string) => redisStore.get(k) ?? null,
  set: async (k: string, v: string | number) => {
    redisStore.set(k, v);
    return 'OK';
  },
  del: async (k: string) => redisStore.delete(k),
  incr: async (k: string) => {
    const n = Number(redisStore.get(k) || 0) + 1;
    redisStore.set(k, n);
    return n;
  },
};

export function hashPassword(password: string): string {
  const salt = 'pamoja-afcon360-salt';
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

export function verifyPassword(password: string, expectedHash: string): boolean {
  return hashPassword(password) === expectedHash;
}

export const sessions = new Map<string, number>();

export const users = new Map<number, UserRecord>();
const seededUsers: UserRecord[] = [
  {
    id: 1,
    publicId: 'usr-amina-001',
    email: 'amina@pamoja.space',
    fullName: 'Amina Namukasa',
    phone: '+256 700 123 456',
    country: 'UG',
    role: 'fan',
    kycTier: 2,
    passwordHash: hashPassword('Pamoja2027!'),
  },
  {
    id: 2,
    publicId: 'usr-john-drv-002',
    email: 'john@driver.com',
    fullName: 'John Driver',
    phone: '+254 700 000 101',
    country: 'KE',
    role: 'driver',
    kycTier: 3,
    passwordHash: hashPassword('Driver2027!'),
  },
];
for (const u of seededUsers) {
  users.set(u.id, u);
}

export const events: EventRecord[] = [
  {
    id: 1,
    publicId: 'evt-kampala-summit-2027',
    slug: 'east-africa-mobility-hospitality-summit',
    name: 'East Africa Mobility & Hospitality Summit',
    category: 'Conference',
    city: 'Kampala',
    country: 'Uganda',
    venue: 'Speke Resort Convention Centre, Munyonyo',
    startDate: '2027-06-14',
    endDate: '2027-06-16',
    status: 'published',
    organizer: 'Pamoja Civic & Business Network',
    description:
      'Three-day cross-border forum connecting transport operators, boutique hoteliers, fintech teams, and city organizers across East Africa.',
    featured: true,
    ticketTypes: [
      { id: 101, name: 'General Delegate Pass', price: 120000, currency: 'UGX', available: 180, description: 'Full access to keynotes and exhibitor concourse' },
      { id: 102, name: 'VIP Partner Pass', price: 320000, currency: 'UGX', available: 45, description: 'Executive lounge, shuttle priority, and gala dinner' },
    ],
  },
  {
    id: 2,
    publicId: 'evt-afcon-fan-festival-2027',
    slug: 'pamoja-host-city-cultural-festival',
    name: 'Pamoja Host-City Cultural & Matchweek Festival',
    category: 'Sports & Culture',
    city: 'Nairobi',
    country: 'Kenya',
    venue: 'Uhuru Gardens Pavilion',
    startDate: '2027-06-21',
    endDate: '2027-06-24',
    status: 'published',
    organizer: 'AFCON360 Host Community Coalition',
    description:
      'Live music, regional cuisine stalls, screening zones, and coordinated shuttle links connecting Nairobi neighbourhoods.',
    featured: true,
    ticketTypes: [
      { id: 201, name: 'Day Pass', price: 2500, currency: 'KES', available: 620, description: 'Single-day festival grounds entry' },
      { id: 202, name: 'Weekend Family Bundle', price: 6500, currency: 'KES', available: 110, description: 'Entry for up to 4 guests across Saturday and Sunday' },
    ],
  },
  {
    id: 3,
    publicId: 'evt-zanzibar-marathon-2027',
    slug: 'zanzibar-coastal-half-marathon',
    name: 'Zanzibar Coastal Half Marathon',
    category: 'Athletics',
    city: 'Zanzibar',
    country: 'Tanzania',
    venue: 'Forodhani Waterfront Promenade',
    startDate: '2027-07-04',
    endDate: '2027-07-04',
    status: 'published',
    organizer: 'Islands Athletics Collective',
    description:
      'Sunrise 21km and 10km coastal route through Stone Town with ferry-linked stays and hydration support.',
    featured: false,
    ticketTypes: [
      { id: 301, name: '10km Fun Run', price: 65000, currency: 'TZS', available: 240, description: 'Bib, timing chip, and finisher medal' },
      { id: 302, name: '21km Half Marathon', price: 95000, currency: 'TZS', available: 150, description: 'Official race kit and recovery lounge access' },
    ],
  },
  {
    id: 4,
    publicId: 'evt-entebbe-creators-forum-2027',
    slug: 'lake-victoria-creators-sound-night',
    name: 'Lake Victoria Creators & Sound Night',
    category: 'Music & Arts',
    city: 'Entebbe',
    country: 'Uganda',
    venue: 'Botanical Gardens Amphitheatre',
    startDate: '2027-07-12',
    endDate: '2027-07-12',
    status: 'published',
    organizer: 'Nile Sound Labs',
    description:
      'Lakeside evening showcase of East African acoustic, jazz, and electronic artists with verified transport pickup.',
    featured: false,
    ticketTypes: [
      { id: 401, name: 'Lawn Admission', price: 75000, currency: 'UGX', available: 310, description: 'Open amphitheatre lawn seating' },
    ],
  },
];

export const eventRegistrations: EventRegistrationRecord[] = [
  {
    id: 1,
    ref: 'REG-PAM-8041',
    eventId: 1,
    eventSlug: 'east-africa-mobility-hospitality-summit',
    eventName: 'East Africa Mobility & Hospitality Summit',
    userId: 1,
    attendeeName: 'Amina Namukasa',
    attendeeEmail: 'amina@pamoja.space',
    ticketTypeName: 'General Delegate Pass',
    quantity: 1,
    totalAmount: 120000,
    currency: 'UGX',
    status: 'confirmed',
    createdAt: '2026-11-10T09:15:00Z',
  },
];

export const properties: PropertyRecord[] = [
  {
    id: 1,
    slug: 'kololo-hills-boutique-hotel',
    name: 'Kololo Hills Boutique Hotel',
    city: 'Kampala',
    country: 'Uganda',
    propertyType: 'hotel',
    pricePerNight: 380000,
    currency: 'UGX',
    rating: 4.8,
    availableRooms: 9,
    amenities: ['Airport Shuttle', 'High-Speed Wi-Fi', 'Breakfast Included', '24/7 Concierge'],
    description: 'Quiet garden suites in Kololo with dedicated Pamoja driver pickup and instant wallet checkout.',
  },
  {
    id: 2,
    slug: 'westlands-executive-residences',
    name: 'Westlands Executive Residences',
    city: 'Nairobi',
    country: 'Kenya',
    propertyType: 'apartment',
    pricePerNight: 14500,
    currency: 'KES',
    rating: 4.9,
    availableRooms: 6,
    amenities: ['Full Kitchen', 'Workspace Desk', 'Gym Access', 'Secure Parking'],
    description: 'Serviced 1- and 2-bedroom apartments minutes from Westlands business corridor and festival shuttles.',
  },
  {
    id: 3,
    slug: 'serena-lakeside-suites-entebbe',
    name: 'Lakeside Veranda Suites',
    city: 'Entebbe',
    country: 'Uganda',
    propertyType: 'lodge',
    pricePerNight: 420000,
    currency: 'UGX',
    rating: 4.7,
    availableRooms: 5,
    amenities: ['Lake View', '10 min to EBB Airport', 'Pool', 'Solar Backup'],
    description: 'Breezy waterfront rooms ideal for early-morning airport arrivals and weekend retreats.',
  },
  {
    id: 4,
    slug: 'stone-town-heritage-riad',
    name: 'Stone Town Heritage Riad',
    city: 'Zanzibar',
    country: 'Tanzania',
    propertyType: 'riad',
    pricePerNight: 290000,
    currency: 'TZS',
    rating: 4.9,
    availableRooms: 4,
    amenities: ['Rooftop Terrace', 'Harbour Walk', 'Air Conditioning', 'Cultural Tours'],
    description: 'Restored coral-stone courtyard residence a short walk from Forodhani waterfront.',
  },
];

export const accommodationBookings: AccommodationBookingRecord[] = [
  {
    id: 1,
    ref: 'STAY-PAM-3102',
    propertyId: 1,
    propertyName: 'Kololo Hills Boutique Hotel',
    city: 'Kampala',
    userId: 1,
    guestName: 'Amina Namukasa',
    checkIn: '2027-06-14',
    checkOut: '2027-06-16',
    guests: 2,
    nights: 2,
    totalAmount: 760000,
    currency: 'UGX',
    paymentMethod: 'Pamoja Wallet',
    status: 'confirmed',
    createdAt: '2026-11-11T14:20:00Z',
  },
];

export const scheduledRoutes: ScheduledRouteRecord[] = [
  {
    id: 1,
    code: 'RT-EBB-KLA',
    origin: 'Entebbe International Airport (EBB)',
    destination: 'Kampala CBD & Kololo',
    city: 'Kampala',
    vehicleClass: 'Express Shuttle',
    estimatedMinutes: 45,
    baseFare: 45000,
    currency: 'UGX',
    nextDeparture: 'Every 30 mins',
  },
  {
    id: 2,
    code: 'RT-NBO-WST',
    origin: 'JKIA Terminal 1A',
    destination: 'Westlands & Uhuru Gardens',
    city: 'Nairobi',
    vehicleClass: 'Executive Van',
    estimatedMinutes: 32,
    baseFare: 1200,
    currency: 'KES',
    nextDeparture: 'Every 20 mins',
  },
  {
    id: 3,
    code: 'RT-DAR-ZNZ',
    origin: 'Azam Marine Ferry Terminal',
    destination: 'Stone Town Promenade',
    city: 'Zanzibar',
    vehicleClass: 'Harbour Transfer',
    estimatedMinutes: 15,
    baseFare: 25000,
    currency: 'TZS',
    nextDeparture: 'Aligned with ferry',
  },
];

export const rideRequests: RideRequestRecord[] = [
  {
    id: 1,
    ref: 'RIDE-PAM-5520',
    userId: 1,
    passengerName: 'Amina Namukasa',
    pickup: 'Entebbe Airport Arrivals',
    dropoff: 'Kololo Hills Boutique Hotel',
    serviceType: 'executive',
    estimatedFare: 65000,
    currency: 'UGX',
    status: 'assigned',
    driverName: 'John Driver',
    createdAt: '2026-11-14T08:00:00Z',
  },
];

export const driverProfile: DriverProfileState = {
  driverCode: 'AFCTESTDRV001',
  name: 'John Driver',
  email: 'john@driver.com',
  phone: '+254 700 000 101',
  licenseNumber: 'DL12345678',
  rating: 4.8,
  isOnline: true,
  statusLabel: 'Approved',
  vehicle: {
    id: 1,
    makeModel: 'Toyota Corolla',
    plate: 'TEST-DRV-001',
    color: 'Silver',
    year: 2022,
    insuranceExpiry: '15 Jan 2027',
    complianceStatus: 'Approved',
  },
  earnings: {
    currency: 'KES',
    today: 2450,
    week: 14800,
    month: 52300,
    hourlyRate: 450,
    dailyGoal: 5000,
  },
  trips: [
    {
      id: 101,
      time: '08:30',
      date: '16 Nov',
      duration: '25 min',
      route: 'CBD → Westlands',
      fare: 450,
      distanceKm: 8.5,
      status: 'Completed',
    },
    {
      id: 102,
      time: '06:15',
      date: '16 Nov',
      duration: '18 min',
      route: 'JKIA Airport → CBD',
      fare: 1200,
      distanceKm: 18.2,
      status: 'Completed',
    },
    {
      id: 103,
      time: '19:40',
      date: '15 Nov',
      duration: '22 min',
      route: 'Kilimani → Uhuru Gardens',
      fare: 800,
      distanceKm: 7.4,
      status: 'Completed',
    },
  ],
};

export const tourismListings: TourismListingRecord[] = [
  {
    id: 1,
    slug: 'source-of-the-nile-jinja-adventure',
    title: 'Source of the Nile & Jinja River Expedition',
    region: 'Jinja',
    country: 'Uganda',
    duration: 'Full Day (8 hrs)',
    price: 240000,
    currency: 'UGX',
    category: 'Nature & Water',
    operatorName: 'Nile Horizon Safaris',
    meetingPoint: 'Kampala Acacia Mall Gate → Jinja Pier',
    departureDate: '2027-06-18 · 07:30',
    spotsTotal: 14,
    spotsLeft: 6,
    summary: 'Guided boat cruise to the Nile headwaters, Mabira forest canopy walk, and curated riverside lunch.',
  },
  {
    id: 2,
    slug: 'nairobi-national-park-dawn-drive',
    title: 'Nairobi National Park Dawn Wildlife Drive',
    region: 'Nairobi',
    country: 'Kenya',
    duration: 'Half Day (5 hrs)',
    price: 6800,
    currency: 'KES',
    category: 'Wildlife Safari',
    operatorName: 'Savannah Tracks Collective',
    meetingPoint: 'Kenyatta Ave Pickup Bay, CBD',
    departureDate: '2027-06-22 · 05:45',
    spotsTotal: 10,
    spotsLeft: 4,
    summary: 'Early-morning 4x4 safari minutes from Nairobi CBD with certified wildlife guide and park entry coordination.',
  },
  {
    id: 3,
    slug: 'stone-town-spice-heritage-walk',
    title: 'Stone Town Heritage & Spice Farm Walk',
    region: 'Zanzibar',
    country: 'Tanzania',
    duration: 'Half Day (4 hrs)',
    price: 110000,
    currency: 'TZS',
    category: 'Culture & Heritage',
    operatorName: 'Stone Town Walking Guild',
    meetingPoint: 'Forodhani Waterfront Clocktower',
    departureDate: '2027-07-05 · 09:00',
    spotsTotal: 16,
    spotsLeft: 9,
    summary: 'Explore historic carved doorways, spice markets, and coastal architecture with a local historian.',
  },
];

export const tourBookings: TourBookingRecord[] = [
  {
    id: 1,
    ref: 'TOUR-PAM-4201',
    tourId: 1,
    tourTitle: 'Source of the Nile & Jinja River Expedition',
    region: 'Jinja',
    operatorName: 'Nile Horizon Safaris',
    meetingPoint: 'Kampala Acacia Mall Gate → Jinja Pier',
    departureDate: '2027-06-18 · 07:30',
    userId: 1,
    guestName: 'Amina Namukasa',
    guests: 1,
    totalAmount: 240000,
    currency: 'UGX',
    status: 'confirmed',
    createdAt: '2026-11-12T11:30:00Z',
  },
];

export const wallets = new Map<number, WalletAccountRecord>([
  [
    1,
    {
      id: 'wlt-amina-001',
      userId: 1,
      accountName: 'Wallet_UGX_1',
      currency: 'UGX',
      balance: 1450000,
      status: 'ACTIVE',
      verified: true,
      kycTier: 2,
      dailyLimit: 50000000,
    },
  ],
  [
    2,
    {
      id: 'wlt-john-002',
      userId: 2,
      accountName: 'Wallet_KES_2',
      currency: 'KES',
      balance: 54750,
      status: 'ACTIVE',
      verified: true,
      kycTier: 3,
      dailyLimit: 50000000,
    },
  ],
]);

export const walletTransactions: WalletTransactionRecord[] = [
  {
    id: 'tx-1001',
    userId: 1,
    type: 'deposit',
    sourceOrRecipient: 'Mobile Money (MTN)',
    amount: 2000000,
    currency: 'UGX',
    status: 'completed',
    reference: 'DEP-MTN-99412',
    createdAt: '2026-11-09T10:00:00Z',
  },
  {
    id: 'tx-1002',
    userId: 1,
    type: 'booking_payment',
    sourceOrRecipient: 'Kololo Hills Boutique Hotel',
    amount: -430000,
    currency: 'UGX',
    status: 'completed',
    reference: 'STAY-PAM-3102',
    createdAt: '2026-11-11T14:20:00Z',
  },
  {
    id: 'tx-1003',
    userId: 1,
    type: 'booking_payment',
    sourceOrRecipient: 'East Africa Mobility & Hospitality Summit',
    amount: -120000,
    currency: 'UGX',
    status: 'completed',
    reference: 'REG-PAM-8041',
    createdAt: '2026-11-10T09:15:00Z',
  },
];

export const platformConfig = {
  homeFeedLayout: 'mixed' as 'mixed' | 'sections' | 'tabbed',
  modules: {
    events: true,
    accommodation: true,
    transport: true,
    tourism: true,
    wallet: true,
    geo: true,
  },
};

export interface FeedItem {
  feed_id: string;
  type: 'event' | 'stay' | 'transport' | 'tourism' | 'announcement';
  title: string;
  subtitle: string;
  location: string;
  badge: string;
  priceLabel: string;
  url: string;
  is_pinned?: boolean;
}

export function buildUnifiedFeed(
  page = 1,
  perPage = 10,
  layout?: string,
  seed?: string
) {
  const activeLayout =
    layout === 'mixed' || layout === 'sections' || layout === 'tabbed'
      ? layout
      : platformConfig.homeFeedLayout;

  const items: FeedItem[] = [
    {
      feed_id: 'ann-pamoja-welcome',
      type: 'announcement',
      title: 'Welcome to Pamoja — One Connected Experience',
      subtitle:
        'Book verified events, stays, airport transfers, and local tours using one unified identity and multi-currency wallet.',
      location: 'East Africa Network',
      badge: 'Platform Guide',
      priceLabel: 'Verified Ecosystem',
      url: '/user/dashboard',
      is_pinned: true,
    },
    ...events.map((e) => ({
      feed_id: `evt-${e.id}`,
      type: 'event' as const,
      title: e.name,
      subtitle: e.description,
      location: `${e.city}, ${e.country} · ${e.startDate}`,
      badge: e.category,
      priceLabel: `${e.ticketTypes[0].currency} ${e.ticketTypes[0].price.toLocaleString()}`,
      url: `/events/${e.slug}`,
    })),
    ...properties.map((p) => ({
      feed_id: `stay-${p.id}`,
      type: 'stay' as const,
      title: p.name,
      subtitle: p.description,
      location: `${p.city}, ${p.country} · ★ ${p.rating}`,
      badge: p.propertyType.toUpperCase(),
      priceLabel: `${p.currency} ${p.pricePerNight.toLocaleString()} / night`,
      url: `/accommodation?city=${encodeURIComponent(p.city)}`,
    })),
    ...scheduledRoutes.map((r) => ({
      feed_id: `trn-${r.id}`,
      type: 'transport' as const,
      title: `${r.origin} → ${r.destination}`,
      subtitle: `${r.vehicleClass} · Departs ${r.nextDeparture} (${r.estimatedMinutes} min)`,
      location: r.city,
      badge: 'Transport',
      priceLabel: `${r.currency} ${r.baseFare.toLocaleString()}`,
      url: '/transport',
    })),
    ...tourismListings.map((t) => ({
      feed_id: `tour-${t.id}`,
      type: 'tourism' as const,
      title: t.title,
      subtitle: t.summary,
      location: `${t.region}, ${t.country} · ${t.duration}`,
      badge: t.category,
      priceLabel: `${t.currency} ${t.price.toLocaleString()}`,
      url: '/tourism',
    })),
  ];

  const safePage = Math.max(1, page);
  const safePerPage = Math.min(30, Math.max(1, perPage));
  const start = (safePage - 1) * safePerPage;
  const pageItems = items.slice(start, start + safePerPage);

  return {
    items: pageItems,
    page: safePage,
    per_page: safePerPage,
    total: items.length,
    has_more: start + safePerPage < items.length,
    layout: activeLayout,
    seed: seed || 'pamoja-default',
  };
}

export function getOrCreateWallet(userId: number): WalletAccountRecord {
  let wallet = wallets.get(userId);
  if (!wallet) {
    const user = users.get(userId);
    const currency = user?.country === 'KE' ? 'KES' : user?.country === 'TZ' ? 'TZS' : 'UGX';
    wallet = {
      id: `wlt-${userId}-${Date.now()}`,
      userId,
      accountName: `Wallet_${currency}_${userId}`,
      currency,
      balance: 250000,
      status: 'ACTIVE',
      verified: true,
      kycTier: user?.kycTier ?? 1,
      dailyLimit: 50000000,
    };
    wallets.set(userId, wallet);
  }
  return wallet;
}
