import type { AdminActionType, AdminTargetType, BookingStatus, CalendarConnectionStatus, DisputeStatus, NotificationType, PaymentStatus, ProfessionalStatus, ReminderStatus, RescheduleRequestStatus, ServiceCategory, UserRole } from '@shared/types';

export type User = {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProfessionalSummary = {
  id: string;
  displayName: string;
  slug: string;
  headline: string;
  category: ServiceCategory;
  specialties: string[];
  city: string;
  state: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  licenseLabel?: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  trustScore?: number;
  profileCompletionPercent?: number;
  averageRating?: number | null;
  reviewCount?: number;
  startingPriceCents?: number | null;
  portfolioCount?: number;
};

export type ProfessionalProfile = ProfessionalSummary & {
  userId: string;
  bio: string;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  ownerFirstName?: string;
  ownerLastName?: string;
  status?: ProfessionalStatus;
  isVisible?: boolean;
  onboardingStep?: string;
};

export type PrivateProfessionalProfile = ProfessionalProfile & {
  addressLine1?: string | null;
  postalCode?: string | null;
};

export type Service = {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  isActive: boolean;
};

export type BookingPayment = {
  id: string;
  bookingId: string;
  provider: string;
  providerReference?: string | null;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  recordedAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingRescheduleRequest = {
  id: string;
  bookingId: string;
  requestedById: string;
  proposedStartsAt: string;
  proposedEndsAt: string;
  status: RescheduleRequestStatus;
  note?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingReminder = {
  id: string;
  bookingId: string;
  userId: string;
  scheduledFor: string;
  type: string;
  status: ReminderStatus;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingPolicy = {
  id?: string;
  professionalId: string;
  cancellationWindowHours: number;
  cancellationFeeCents: number;
  depositRequired: boolean;
  remindersEnabled: boolean;
  reminderHoursBefore: number;
  policySummary: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Booking = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  priceCents: number;
  depositCents: number;
  paymentStatus: PaymentStatus;
  policyAcceptedAt?: string | null;
  reminderOptIn: boolean;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  clientNote?: string | null;
  professionalNote?: string | null;
  payment?: BookingPayment | null;
  pendingRescheduleRequest?: BookingRescheduleRequest | null;
  service?: Pick<Service, 'id' | 'name' | 'category' | 'durationMinutes' | 'priceCents' | 'depositCents'> | null;
  professional?: Pick<ProfessionalSummary, 'id' | 'displayName' | 'slug' | 'city' | 'state'> | null;
  client?: { id: string; name: string; email: string } | null;
};

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export type Review = {
  id: string;
  rating: number;
  cleanlinessRating?: number;
  communicationRating?: number;
  valueRating?: number;
  wouldRecommend?: boolean;
  photoUrls?: string[];
  helpfulCount?: number;
  comment: string;
  createdAt: string;
};

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  caption: string;
  category: ServiceCategory;
  serviceTags?: string[];
  transformationNotes?: string | null;
  sortOrder?: number;
};

export type ProfessionalOnboardingStatus = {
  profile: PrivateProfessionalProfile | null;
  completionPercent: number;
  nextStep: 'profile' | 'services' | 'availability' | 'portfolio' | 'review';
  checklist: {
    profile: boolean;
    services: boolean;
    availability: boolean;
    portfolio: boolean;
    review: boolean;
  };
};

export type AvailabilityRule = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AvailabilityException = {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  isBlocked: boolean;
  reason?: string | null;
};

export type Favorite = {
  id: string;
  createdAt: string;
  professional: ProfessionalSummary;
};

export type SavedSearch = {
  id: string;
  clientId: string;
  name: string;
  query?: string | null;
  category?: ServiceCategory | null;
  city?: string | null;
  state?: string | null;
  maxPriceCents?: number | null;
  notifyOnNewMatches: boolean;
  lastViewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingDispute = {
  id: string;
  bookingId: string;
  clientId: string;
  professionalId: string;
  openedById: string;
  status: DisputeStatus;
  reason: string;
  details: string;
  resolutionNote?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  openedByName?: string | null;
  resolvedByName?: string | null;
  booking?: { id: string; startsAt: string; status: BookingStatus; serviceName: string; clientName: string; professionalName: string } | null;
};

export type AdminAnalytics = {
  thirtyDayRevenueCents: number;
  thirtyDayCompletedBookings: number;
  pendingBookings: number;
  openDisputes: number;
  approvalBacklog: number;
  thirtyDayAverageRating: number;
  thirtyDayReviewCount: number;
};

export type AdminOperations = {
  upcomingBookings: Array<{ id: string; startsAt: string; status: BookingStatus; serviceName: string; clientFirstName: string; clientLastName: string; professionalName: string }>;
  openDisputes: BookingDispute[];
  lowTrustProfiles: Array<{ id: string; displayName: string; status: ProfessionalStatus; trustScore: number; city: string; state: string }>;
};

export type Message = {
  id: string;
  bookingId?: string | null;
  senderId: string;
  recipientId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export type AdminAction = {
  id: string;
  adminId: string;
  targetType: AdminTargetType;
  targetId: string;
  action: AdminActionType;
  note?: string | null;
  createdAt: string;
};

export interface CalendarConnection {
  id: string;
  professionalId: string;
  provider: string;
  externalCalendarId?: string | null;
  status: CalendarConnectionStatus;
  syncDirection: 'export_only' | 'import_only' | 'two_way';
  lastSyncedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}
