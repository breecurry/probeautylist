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
  'booking_requested',
  'booking_confirmed',
  'booking_declined',
  'booking_cancelled',
  'booking_completed',
  'booking_reschedule_requested',
  'booking_reschedule_accepted',
  'booking_reschedule_declined',
  'payment_required',
  'payment_recorded',
  'reminder_scheduled',
  'calendar_sync_status',
  'message_received',
  'review_received',
  'profile_approved',
  'profile_suspended',
  'dispute_opened',
  'dispute_updated',
  'saved_search_match',
  'system',
] as const;

export const adminTargetTypes = ['professional_profile', 'booking', 'review', 'user', 'dispute'] as const;

export const adminActionTypes = ['approve', 'request-changes', 'suspend', 'resolve', 'dismiss', 'review', 'system'] as const;

export const paymentStatuses = ['not_required', 'deposit_due', 'deposit_recorded', 'paid', 'refunded', 'failed'] as const;

export const rescheduleRequestStatuses = ['pending', 'accepted', 'declined', 'cancelled'] as const;

export const reminderStatuses = ['scheduled', 'sent', 'cancelled'] as const;

export const calendarConnectionStatuses = ['not_connected', 'connected', 'paused', 'error'] as const;

export const disputeStatuses = ['open', 'under_review', 'resolved', 'dismissed'] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
export type BookingStatus = (typeof bookingStatuses)[number];
export type UserRole = (typeof userRoles)[number];
export type ProfessionalStatus = (typeof professionalStatuses)[number];
export type NotificationType = (typeof notificationTypes)[number];
export type AdminTargetType = (typeof adminTargetTypes)[number];
export type AdminActionType = (typeof adminActionTypes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type RescheduleRequestStatus = (typeof rescheduleRequestStatuses)[number];
export type ReminderStatus = (typeof reminderStatuses)[number];
export type CalendarConnectionStatus = (typeof calendarConnectionStatuses)[number];
export type DisputeStatus = (typeof disputeStatuses)[number];

export type ApiError = {
  message: string;
  issues?: unknown;
};
