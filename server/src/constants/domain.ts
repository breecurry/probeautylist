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

export const professionalStatuses = ['draft', 'pending_review', 'approved', 'suspended'] as const;

export const notificationTypes = [
  'booking_created',
  'booking_confirmed',
  'booking_declined',
  'booking_cancelled',
  'booking_completed',
  'message_received',
  'review_received',
  'profile_approved',
  'profile_suspended',
  'system',
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
export type BookingStatus = (typeof bookingStatuses)[number];
export type UserRole = (typeof userRoles)[number];
export type ProfessionalStatus = (typeof professionalStatuses)[number];
export type NotificationType = (typeof notificationTypes)[number];
