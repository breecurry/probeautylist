import type { AdminActionType, AdminTargetType, BookingStatus, NotificationType, ProfessionalStatus, ServiceCategory, UserRole } from '@shared/types';

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
};

export type ProfessionalProfile = ProfessionalSummary & {
  userId: string;
  bio: string;
  licenseLabel?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  ownerFirstName?: string;
  ownerLastName?: string;
  status?: ProfessionalStatus;
  isVisible?: boolean;
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
  clientNote?: string | null;
  professionalNote?: string | null;
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
  comment: string;
  createdAt: string;
};

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  caption: string;
  category: ServiceCategory;
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
