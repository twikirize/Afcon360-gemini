export interface MobileUser {
  id: number;
  publicId: string;
  email: string;
  fullName: string;
  phone: string;
  country: string;
  kycTier: number;
}

export interface FeedItem {
  feed_id: string;
  type: 'event' | 'stay' | 'transport' | 'tourism' | 'announcement';
  title: string;
  subtitle: string;
  location: string;
  badge: string;
  priceLabel: string;
  url: string;
}

export interface TicketType {
  id: number;
  name: string;
  price: number;
  currency: string;
  available: number;
  description: string;
}

export interface EventItem {
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
  organizer: string;
  description: string;
  ticketTypes: TicketType[];
}

export interface PropertyItem {
  id: number;
  slug: string;
  name: string;
  city: string;
  country: string;
  propertyType: string;
  pricePerNight: number;
  currency: string;
  rating: number;
  availableRooms: number;
  amenities: string[];
  description: string;
}

export interface ScheduledRoute {
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

export interface RideRequest {
  id: number;
  ref: string;
  pickup: string;
  dropoff: string;
  serviceType: string;
  estimatedFare: number;
  currency: string;
  status: string;
  driverName: string;
}

export interface WalletAccount {
  id: string;
  accountName: string;
  currency: string;
  balance: number;
  status: string;
  kycTier: number;
  dailyLimit: number;
}

export interface WalletTransaction {
  id: string;
  type: string;
  sourceOrRecipient: string;
  amount: number;
  currency: string;
  status: string;
  reference: string;
  createdAt: string;
}

export interface TourismListing {
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

export interface TourBooking {
  id: number;
  ref: string;
  tourId: number;
  tourTitle: string;
  region: string;
  operatorName: string;
  meetingPoint: string;
  departureDate: string;
  guests: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface EventRegistration {
  id: number;
  ref: string;
  eventId: number;
  eventSlug: string;
  eventName: string;
  ticketTypeName: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}
