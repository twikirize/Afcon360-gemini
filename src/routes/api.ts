import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { Router, Request, Response } from 'express';
import {
  accommodationBookings,
  buildUnifiedFeed,
  driverProfile,
  eventRegistrations,
  events,
  getOrCreateWallet,
  hashPassword,
  platformConfig,
  properties,
  redis,
  rideRequests,
  scheduledRoutes,
  sessions,
  tourBookings,
  tourismListings,
  UserRecord,
  users,
  verifyPassword,
  walletTransactions,
} from '../data/store.js';

export const apiRouter = Router();

function getSessionUserId(req: Request): number | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const tokenUserId = sessions.get(token);
    if (tokenUserId) return tokenUserId;
  }
  const sid = req.cookies?.pamoja_session as string | undefined;
  if (!sid) return null;
  return sessions.get(sid) ?? null;
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.json', '.md', '.txt', '.env', '.example']);

function collectMobileFiles(
  baseDir: string,
  currentDir = baseDir
): Array<{ path: string; data: Buffer; isText: boolean }> {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const results: Array<{ path: string; data: Buffer; isText: boolean }> = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.expo') continue;
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMobileFiles(baseDir, fullPath));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const ext = path.extname(entry.name).toLowerCase();
      results.push({
        path: relPath,
        data: fs.readFileSync(fullPath),
        isText: TEXT_EXTENSIONS.has(ext) || entry.name === '.gitignore',
      });
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

// Health checks (from app/api/health.py)
apiRouter.get('/api/health/ping', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

apiRouter.get('/api/health/ready', async (_req: Request, res: Response) => {
  await redis.set('health:last_check', Date.now());
  res.status(200).json({
    status: 'ready',
    runtime: 'nodejs',
    storage: 'in-memory',
  });
});

apiRouter.get('/api/health/modules', (_req: Request, res: Response) => {
  const status = Object.entries(platformConfig.modules).reduce(
    (acc, [mod, enabled]) => {
      acc[mod] = {
        enabled,
        status: enabled ? 'active' : 'disabled',
        endpoint: enabled ? `/${mod}` : null,
      };
      return acc;
    },
    {} as Record<string, { enabled: boolean; status: string; endpoint: string | null }>
  );

  res.status(200).json({
    modules: status,
    total_modules: Object.keys(status).length,
    enabled_count: Object.values(status).filter((m) => m.enabled).length,
  });
});

// Unified Home Feed (from app/feed/routes.py)
apiRouter.get('/api/home/feed', (req: Request, res: Response) => {
  const page = Number(req.query.page || 1);
  const perPage = Number(req.query.per_page || 10);
  const layout = typeof req.query.layout === 'string' ? req.query.layout : undefined;
  const seed = typeof req.query.seed === 'string' ? req.query.seed : undefined;

  const result = buildUnifiedFeed(page, perPage, layout, seed);
  res.status(200).json(result);
});

apiRouter.post('/api/home/feed/layout', (req: Request, res: Response) => {
  const layout = String(req.body?.layout || '').trim().toLowerCase();
  if (layout !== 'mixed' && layout !== 'sections' && layout !== 'tabbed') {
    res.status(400).json({
      status: 'error',
      message: 'Invalid layout. Choose from: mixed, sections, tabbed',
    });
    return;
  }
  platformConfig.homeFeedLayout = layout;
  res.status(200).json({
    status: 'ok',
    layout,
    message: `Feed layout set to '${layout}'`,
  });
});

// Events API (from app/events/routes.py)
apiRouter.get('/api/events', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const filtered = q
    ? events.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.city.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    : events;
  res.status(200).json({ events: filtered, count: filtered.length });
});

apiRouter.get('/api/events/:identifier', (req: Request, res: Response) => {
  const { identifier } = req.params;
  const event = events.find(
    (e) => e.slug === identifier || e.publicId === identifier || String(e.id) === identifier
  );
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.status(200).json({ event });
});

apiRouter.post('/api/events/:identifier/register', (req: Request, res: Response) => {
  const { identifier } = req.params;
  const event = events.find(
    (e) => e.slug === identifier || e.publicId === identifier || String(e.id) === identifier
  );
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);
  const ticketTypeId = Number(req.body?.ticketTypeId || event.ticketTypes[0]?.id);
  const quantity = Math.max(1, Math.min(10, Number(req.body?.quantity || 1)));
  const ticket = event.ticketTypes.find((t) => t.id === ticketTypeId) || event.ticketTypes[0];

  if (!ticket || ticket.available < quantity) {
    res.status(409).json({ error: 'Selected ticket tier is sold out' });
    return;
  }

  ticket.available -= quantity;
  const reg = {
    id: eventRegistrations.length + 1,
    ref: `REG-PAM-${Math.floor(1000 + Math.random() * 9000)}`,
    eventId: event.id,
    eventSlug: event.slug,
    eventName: event.name,
    userId,
    attendeeName: String(req.body?.attendeeName || user?.fullName || 'Guest Attendee'),
    attendeeEmail: String(req.body?.attendeeEmail || user?.email || 'guest@pamoja.space'),
    ticketTypeName: ticket.name,
    quantity,
    totalAmount: ticket.price * quantity,
    currency: ticket.currency,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
  };
  eventRegistrations.unshift(reg);
  res.status(201).json({ registration: reg });
});

// Accommodation API (from app/accommodation/routes.py)
apiRouter.get('/api/accommodation/properties', (req: Request, res: Response) => {
  const city = String(req.query.city || '').trim().toLowerCase();
  const list = city ? properties.filter((p) => p.city.toLowerCase().includes(city)) : properties;
  res.status(200).json({ properties: list, count: list.length });
});

apiRouter.post('/api/accommodation/book', (req: Request, res: Response) => {
  const propertyId = Number(req.body?.propertyId);
  const prop = properties.find((p) => p.id === propertyId);
  if (!prop) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }
  if (prop.availableRooms < 1) {
    res.status(409).json({ error: 'No rooms currently available' });
    return;
  }

  const nights = Math.max(1, Math.min(30, Number(req.body?.nights || 2)));
  const guests = Math.max(1, Math.min(8, Number(req.body?.guests || 1)));
  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);

  prop.availableRooms -= 1;
  const booking = {
    id: accommodationBookings.length + 1,
    ref: `STAY-PAM-${Math.floor(1000 + Math.random() * 9000)}`,
    propertyId: prop.id,
    propertyName: prop.name,
    city: prop.city,
    userId,
    guestName: String(req.body?.guestName || user?.fullName || 'Guest'),
    checkIn: String(req.body?.checkIn || '2027-06-14'),
    checkOut: String(req.body?.checkOut || '2027-06-16'),
    guests,
    nights,
    totalAmount: prop.pricePerNight * nights,
    currency: prop.currency,
    paymentMethod: String(req.body?.paymentMethod || 'Pamoja Wallet'),
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
  };
  accommodationBookings.unshift(booking);
  res.status(201).json({ booking });
});

// Transport & Driver API (from app/transport/routes.py & app/transport/api/*)
apiRouter.get('/api/transport/routes', (_req: Request, res: Response) => {
  res.status(200).json({ routes: scheduledRoutes, activeRequests: rideRequests });
});

apiRouter.post('/api/transport/ride-request', (req: Request, res: Response) => {
  const pickup = String(req.body?.pickup || '').trim();
  const dropoff = String(req.body?.dropoff || '').trim();
  if (!pickup || !dropoff) {
    res.status(400).json({ error: 'pickup and dropoff are required' });
    return;
  }
  const serviceType =
    req.body?.serviceType === 'executive' || req.body?.serviceType === 'shuttle'
      ? req.body.serviceType
      : 'standard';
  const baseFare = serviceType === 'executive' ? 65000 : serviceType === 'shuttle' ? 25000 : 38000;
  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);

  const ride = {
    id: rideRequests.length + 1,
    ref: `RIDE-PAM-${Math.floor(1000 + Math.random() * 9000)}`,
    userId,
    passengerName: user?.fullName || 'Guest Rider',
    pickup,
    dropoff,
    serviceType,
    estimatedFare: baseFare,
    currency: 'UGX',
    status: driverProfile.isOnline ? ('assigned' as const) : ('requested' as const),
    driverName: driverProfile.isOnline ? driverProfile.name : 'Matching nearby driver...',
    createdAt: new Date().toISOString(),
  };
  rideRequests.unshift(ride);
  res.status(201).json({ ride });
});

apiRouter.post('/api/transport/driver/toggle-online', (req: Request, res: Response) => {
  const desired = typeof req.body?.online === 'boolean' ? req.body.online : !driverProfile.isOnline;
  driverProfile.isOnline = desired;
  res.status(200).json({ isOnline: driverProfile.isOnline });
});

// Tourism & Adventure Tours API (tour operators + tourists)
apiRouter.get('/api/tourism', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const filtered = q
    ? tourismListings.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.operatorName.toLowerCase().includes(q)
      )
    : tourismListings;
  const userId = getSessionUserId(req) ?? 1;
  const myBookings = tourBookings.filter((b) => b.userId === userId);
  res.status(200).json({ listings: filtered, bookings: myBookings, count: filtered.length });
});

apiRouter.post('/api/tourism/join', (req: Request, res: Response) => {
  const tourId = Number(req.body?.tourId);
  const guests = Math.max(1, Math.min(10, Number(req.body?.guests || 1)));
  const tour = tourismListings.find((t) => t.id === tourId);
  if (!tour) {
    res.status(404).json({ error: 'Tour not found' });
    return;
  }
  if (tour.spotsLeft < guests) {
    res.status(409).json({ error: `Only ${tour.spotsLeft} spots left on this tour` });
    return;
  }

  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);
  tour.spotsLeft -= guests;

  const booking = {
    id: tourBookings.length + 1,
    ref: `TOUR-PAM-${Math.floor(1000 + Math.random() * 9000)}`,
    tourId: tour.id,
    tourTitle: tour.title,
    region: tour.region,
    operatorName: tour.operatorName,
    meetingPoint: tour.meetingPoint,
    departureDate: tour.departureDate,
    userId,
    guestName: String(req.body?.guestName || user?.fullName || 'Guest Explorer'),
    guests,
    totalAmount: tour.price * guests,
    currency: tour.currency,
    status: 'confirmed' as const,
    createdAt: new Date().toISOString(),
  };
  tourBookings.unshift(booking);
  res.status(201).json({ booking, tour });
});

apiRouter.post('/api/tourism/tours', (req: Request, res: Response) => {
  const title = String(req.body?.title || '').trim();
  const region = String(req.body?.region || '').trim();
  const meetingPoint = String(req.body?.meetingPoint || '').trim();
  if (!title || !region || !meetingPoint) {
    res.status(400).json({ error: 'Tour title, region, and meetingPoint are required' });
    return;
  }

  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);
  const price = Math.max(1000, Number(req.body?.price || 150000));
  const spotsTotal = Math.max(2, Math.min(60, Number(req.body?.spotsTotal || 12)));
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString().slice(-4);

  const listing = {
    id: tourismListings.length + 1,
    slug,
    title,
    region,
    country: String(req.body?.country || 'Uganda').trim(),
    duration: String(req.body?.duration || 'Half Day (5 hrs)').trim(),
    price,
    currency: String(req.body?.currency || 'UGX').trim().toUpperCase(),
    category: String(req.body?.category || 'Guided Expedition').trim(),
    operatorName: String(req.body?.operatorName || user?.fullName || 'Verified Pamoja Operator').trim(),
    meetingPoint,
    departureDate: String(req.body?.departureDate || '2027-07-18 · 08:00').trim(),
    spotsTotal,
    spotsLeft: spotsTotal,
    summary: String(
      req.body?.summary || 'Curated tour hosted by an accredited Pamoja operator with verified pickup coordination.'
    ).trim(),
  };
  tourismListings.unshift(listing);
  res.status(201).json({ listing });
});

// Wallet API (from app/wallet/routes.py & app/wallet/api/wallet_api.py)
apiRouter.get('/api/wallet', (req: Request, res: Response) => {
  const userId = getSessionUserId(req) ?? 1;
  const account = getOrCreateWallet(userId);
  const txs = walletTransactions.filter((t) => t.userId === userId);
  res.status(200).json({ account, transactions: txs });
});

apiRouter.post('/api/wallet/deposit', (req: Request, res: Response) => {
  const userId = getSessionUserId(req) ?? 1;
  const account = getOrCreateWallet(userId);
  const amount = Number(req.body?.amount || 0);
  const source = String(req.body?.source || 'mobile_money');

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Positive deposit amount is required' });
    return;
  }

  account.balance += amount;
  const tx = {
    id: `tx-${Date.now()}`,
    userId,
    type: 'deposit' as const,
    sourceOrRecipient:
      source === 'flutterwave'
        ? 'Flutterwave Checkout'
        : source === 'agent'
          ? 'Authorized Agent Cash-In'
          : 'Mobile Money (MTN/Airtel)',
    amount,
    currency: account.currency,
    status: 'completed' as const,
    reference: `DEP-${Math.floor(10000 + Math.random() * 89999)}`,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);
  res.status(201).json({ account, transaction: tx });
});

apiRouter.post('/api/wallet/send', (req: Request, res: Response) => {
  const userId = getSessionUserId(req) ?? 1;
  const account = getOrCreateWallet(userId);
  const amount = Number(req.body?.amount || 0);
  const recipient = String(req.body?.recipient || '').trim();

  if (!recipient || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ error: 'Recipient and positive amount are required' });
    return;
  }
  if (account.balance < amount) {
    res.status(400).json({ error: 'Insufficient wallet balance' });
    return;
  }

  account.balance -= amount;
  const tx = {
    id: `tx-${Date.now()}`,
    userId,
    type: 'transfer_out' as const,
    sourceOrRecipient: recipient,
    amount: -amount,
    currency: account.currency,
    status: 'completed' as const,
    reference: `TRF-${Math.floor(10000 + Math.random() * 89999)}`,
    createdAt: new Date().toISOString(),
  };
  walletTransactions.unshift(tx);
  res.status(201).json({ account, transaction: tx });
});

// Mobile Auth & User Summary (aligned with app/auth/mobile_api.py)
apiRouter.post('/api/auth/mobile/login', (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = Array.from(users.values()).find((u) => u.email.toLowerCase() === email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  res.status(200).json({
    access_token: token,
    user: {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      country: user.country,
      kycTier: user.kycTier,
    },
  });
});

apiRouter.post('/api/auth/mobile/register', (req: Request, res: Response) => {
  const fullName = String(req.body?.fullName || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const country = String(req.body?.country || 'UG').trim().toUpperCase();

  if (!fullName || !email || password.length < 6) {
    res.status(400).json({ error: 'Full name, valid email, and 6+ char password required' });
    return;
  }
  if (Array.from(users.values()).some((u) => u.email.toLowerCase() === email)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const nextId = users.size + 1;
  const newUser: UserRecord = {
    id: nextId,
    publicId: `usr-${Date.now()}`,
    email,
    fullName,
    phone: String(req.body?.phone || '+256 700 000 000'),
    country,
    role: 'fan',
    kycTier: 1,
    passwordHash: hashPassword(password),
  };
  users.set(nextId, newUser);
  getOrCreateWallet(nextId);

  const token = crypto.randomUUID();
  sessions.set(token, newUser.id);
  res.status(201).json({
    access_token: token,
    user: {
      id: newUser.id,
      publicId: newUser.publicId,
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone,
      country: newUser.country,
      kycTier: newUser.kycTier,
    },
  });
});

apiRouter.get('/api/auth/mobile/me', (req: Request, res: Response) => {
  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.status(200).json({
    user: {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      country: user.country,
      kycTier: user.kycTier,
    },
  });
});

apiRouter.get('/api/user/summary', (req: Request, res: Response) => {
  const userId = getSessionUserId(req) ?? 1;
  const user = users.get(userId) || users.get(1)!;
  const wallet = getOrCreateWallet(user.id);
  res.status(200).json({
    user: {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      country: user.country,
      kycTier: user.kycTier,
    },
    wallet,
    registrations: eventRegistrations.filter((r) => r.userId === user.id),
    bookings: accommodationBookings.filter((b) => b.userId === user.id),
    rides: rideRequests.filter((r) => r.userId === user.id),
    tours: tourBookings.filter((t) => t.userId === user.id),
  });
});

// React Native (iOS & Android) Source Inspector & Archive Download
apiRouter.get('/api/mobile-app/files', (_req: Request, res: Response) => {
  const mobileDir = path.resolve(process.cwd(), 'mobile-app');
  if (!fs.existsSync(mobileDir)) {
    res.status(404).json({ error: 'mobile-app directory not found' });
    return;
  }
  const textFiles = collectMobileFiles(mobileDir)
    .filter((f) => f.isText)
    .map((f) => ({ path: f.path, content: f.data.toString('utf-8') }));
  res.status(200).json({ files: textFiles });
});

apiRouter.get('/api/mobile-app/download', (_req: Request, res: Response) => {
  const mobileDir = path.resolve(process.cwd(), 'mobile-app');
  if (!fs.existsSync(mobileDir)) {
    res.status(404).json({ error: 'mobile-app directory not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="pamoja-react-native-app.tar.gz"');
  const tar = spawn('tar', ['-czf', '-', '-C', process.cwd(), 'mobile-app']);
  tar.stdout.pipe(res);
  tar.stderr.on('data', (chunk) => {
    console.error('tar stderr:', chunk.toString());
  });
  tar.on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Archive generation failed' });
  });
});

function buildZipBuffer(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf-8');
    const crc = zlib.crc32(entry.data) >>> 0;
    const size = entry.data.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + size;
  }

  const centralDir = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDir.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, endRecord]);
}

apiRouter.get('/api/mobile-app/download.zip', (_req: Request, res: Response) => {
  const mobileDir = path.resolve(process.cwd(), 'mobile-app');
  if (!fs.existsSync(mobileDir)) {
    res.status(404).json({ error: 'mobile-app directory not found' });
    return;
  }
  const files = collectMobileFiles(mobileDir).map((f) => ({
    name: `mobile-app/${f.path}`,
    data: f.data,
  }));
  const zipBuf = buildZipBuffer(files);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="pamoja-react-native-app.zip"');
  res.status(200).send(zipBuf);
});

// Stub remaining complex / privileged / compliance routes per web.md §1.5 step 4
const unmigratedPrefixes = [
  '/admin',
  '/owner',
  '/moderator',
  '/auditor',
  '/kyc',
  '/compliance',
  '/webhooks',
  '/monitor',
  '/production-console',
  '/tournament',
  '/api/v1',
];

for (const prefix of unmigratedPrefixes) {
  apiRouter.all(`${prefix}*`, (_req: Request, res: Response) => {
    res.status(501).json({ error: 'Not yet migrated' });
  });
}
