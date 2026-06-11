export const serviceCategories = [
  'Hair Stylist',
  'Nail Artist',
  'Esthetician',
  'Barber',
  'Makeup Artist',
  'Lash Artist',
  'Brow Artist',
  'Massage Therapist',
  'Waxing Specialist',
  'Other Beauty Professional',
] as const;

export const bookingStatuses = [
  'pending',
  'confirmed',
  'declined',
  'cancelled_by_client',
  'cancelled_by_professional',
  'completed',
  'no_show',
] as const;

export const userRoles = ['client', 'professional', 'admin'] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
export type BookingStatus = (typeof bookingStatuses)[number];
export type UserRole = (typeof userRoles)[number];

export type ApiError = {
  message: string;
  issues?: unknown;
};
