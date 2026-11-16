import * as SecureStore from 'expo-secure-store';
import type {
  EventItem,
  EventRegistration,
  FeedItem,
  MobileUser,
  PropertyItem,
  RideRequest,
  ScheduledRoute,
  TourBooking,
  TourismListing,
  WalletAccount,
  WalletTransaction,
} from '../types/domain';

const TOKEN_KEY = 'pamoja_mobile_access_token';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export const mobileApi = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; user: MobileUser }>('/api/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: { fullName: string; email: string; password: string; country: string }) =>
    apiRequest<{ access_token: string; user: MobileUser }>('/api/auth/mobile/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: () => apiRequest<{ user: MobileUser }>('/api/auth/mobile/me'),

  getFeed: (page = 1, perPage = 15) =>
    apiRequest<{ items: FeedItem[]; page: number; has_more: boolean }>(
      `/api/home/feed?page=${page}&per_page=${perPage}`
    ),

  getEvents: (q = '') =>
    apiRequest<{ events: EventItem[] }>(`/api/events${q ? `?q=${encodeURIComponent(q)}` : ''}`),

  registerForEvent: (
    slug: string,
    payload: { ticketTypeId: number; quantity: number; attendeeName: string; attendeeEmail: string }
  ) =>
    apiRequest<{ registration: { ref: string; status: string } }>(
      `/api/events/${encodeURIComponent(slug)}/register`,
      { method: 'POST', body: JSON.stringify(payload) }
    ),

  getProperties: (city = '') =>
    apiRequest<{ properties: PropertyItem[] }>(
      `/api/accommodation/properties${city ? `?city=${encodeURIComponent(city)}` : ''}`
    ),

  bookStay: (payload: {
    propertyId: number;
    nights: number;
    guests: number;
    checkIn: string;
    paymentMethod: string;
  }) =>
    apiRequest<{ booking: { ref: string; status: string } }>('/api/accommodation/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTransport: () =>
    apiRequest<{ routes: ScheduledRoute[]; activeRequests: RideRequest[] }>('/api/transport/routes'),

  requestRide: (payload: { pickup: string; dropoff: string; serviceType: 'standard' | 'executive' | 'shuttle' }) =>
    apiRequest<{ ride: RideRequest }>('/api/transport/ride-request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWallet: () =>
    apiRequest<{ account: WalletAccount; transactions: WalletTransaction[] }>('/api/wallet'),

  depositWallet: (payload: { amount: number; source: 'mobile_money' | 'flutterwave' | 'agent' }) =>
    apiRequest<{ account: WalletAccount; transaction: WalletTransaction }>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendWallet: (payload: { recipient: string; amount: number }) =>
    apiRequest<{ account: WalletAccount; transaction: WalletTransaction }>('/api/wallet/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTourism: (q = '') =>
    apiRequest<{ listings: TourismListing[]; bookings: TourBooking[]; count: number }>(
      `/api/tourism${q ? `?q=${encodeURIComponent(q)}` : ''}`
    ),

  joinTour: (payload: { tourId: number; guests?: number; guestName?: string }) =>
    apiRequest<{ booking: TourBooking; tour: TourismListing }>('/api/tourism/join', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  organiseTour: (payload: {
    title: string;
    region: string;
    country?: string;
    duration?: string;
    price?: number;
    currency?: string;
    category?: string;
    operatorName?: string;
    meetingPoint: string;
    departureDate?: string;
    spotsTotal?: number;
    summary?: string;
  }) =>
    apiRequest<{ listing: TourismListing }>('/api/tourism/tours', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getUserSummary: () =>
    apiRequest<{
      user: MobileUser;
      registrations: EventRegistration[];
      tours: TourBooking[];
    }>('/api/user/summary'),
};
