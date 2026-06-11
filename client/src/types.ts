import type { BookingStatus, UserRole } from '@shared/types';

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
  category: string;
  specialties: string[];
  city: string;
  state: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
};

export type ProfessionalProfile = ProfessionalSummary & {
  userId: string;
  bio: string;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  ownerFirstName?: string;
  ownerLastName?: string;
  status?: string;
  isVisible?: boolean;
};

export type Service = {
  id: string;
  professionalId: string;
  name: string;
  description: string;
  category: string;
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
};

export type Notification = {
  id: string;
  type: string;
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
  category: string;
};
