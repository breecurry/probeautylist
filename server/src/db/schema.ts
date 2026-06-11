import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['client', 'professional', 'admin']);
export const professionalStatusEnum = pgEnum('professional_status', ['draft', 'pending_review', 'approved', 'suspended']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'declined',
  'cancelled_by_client',
  'cancelled_by_professional',
  'completed',
  'no_show',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
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
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'not_required',
  'deposit_due',
  'deposit_recorded',
  'paid',
  'refunded',
  'failed',
]);
export const rescheduleRequestStatusEnum = pgEnum('reschedule_request_status', ['pending', 'accepted', 'declined', 'cancelled']);
export const reminderStatusEnum = pgEnum('reminder_status', ['scheduled', 'sent', 'cancelled']);
export const calendarConnectionStatusEnum = pgEnum('calendar_connection_status', ['not_connected', 'connected', 'paused', 'error']);
export const disputeStatusEnum = pgEnum('dispute_status', ['open', 'under_review', 'resolved', 'dismissed']);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').default('client').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex('users_email_unique').on(sql`lower(${table.email})`),
  roleIdx: index('users_role_idx').on(table.role),
}));

export const professionalProfiles = pgTable('professional_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull(),
  headline: text('headline').notNull(),
  bio: text('bio').notNull(),
  category: text('category').notNull(),
  specialties: text('specialties').array().default(sql`ARRAY[]::text[]`).notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  addressLine1: text('address_line_1'),
  postalCode: text('postal_code'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
  profileImageUrl: text('profile_image_url'),
  coverImageUrl: text('cover_image_url'),
  instagramUrl: text('instagram_url'),
  websiteUrl: text('website_url'),
  licenseLabel: text('license_label'),
  status: professionalStatusEnum('status').default('draft').notNull(),
  isVisible: boolean('is_visible').default(false).notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  trustScore: integer('trust_score').default(0).notNull(),
  onboardingStep: text('onboarding_step').default('profile').notNull(),
  profileCompletionPercent: integer('profile_completion_percent').default(0).notNull(),
  ...timestamps,
}, (table) => ({
  userIdx: uniqueIndex('professional_profiles_user_unique').on(table.userId),
  slugIdx: uniqueIndex('professional_profiles_slug_unique').on(table.slug),
  searchIdx: index('professional_profiles_search_idx').on(table.category, table.city, table.state, table.status),
}));

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  depositCents: integer('deposit_cents').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  professionalIdx: index('services_professional_idx').on(table.professionalId),
  activeIdx: index('services_active_idx').on(table.isActive),
  durationPositiveCheck: check('services_duration_positive_check', sql`${table.durationMinutes} > 0`),
  priceNonNegativeCheck: check('services_price_non_negative_check', sql`${table.priceCents} >= 0`),
  depositRangeCheck: check('services_deposit_range_check', sql`${table.depositCents} >= 0 AND ${table.depositCents} <= ${table.priceCents}`),
}));


export const bookingPolicies = pgTable('booking_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  cancellationWindowHours: integer('cancellation_window_hours').default(24).notNull(),
  cancellationFeeCents: integer('cancellation_fee_cents').default(0).notNull(),
  depositRequired: boolean('deposit_required').default(true).notNull(),
  remindersEnabled: boolean('reminders_enabled').default(true).notNull(),
  reminderHoursBefore: integer('reminder_hours_before').default(24).notNull(),
  policySummary: text('policy_summary').default('Deposits may be required to hold appointments. Cancellation rules are shown before booking.').notNull(),
  ...timestamps,
}, (table) => ({
  professionalUnique: uniqueIndex('booking_policies_professional_unique').on(table.professionalId),
  cancellationWindowNonNegativeCheck: check('booking_policies_cancellation_window_non_negative_check', sql`${table.cancellationWindowHours} >= 0`),
  cancellationFeeNonNegativeCheck: check('booking_policies_cancellation_fee_non_negative_check', sql`${table.cancellationFeeCents} >= 0`),
  reminderHoursPositiveCheck: check('booking_policies_reminder_hours_positive_check', sql`${table.reminderHoursBefore} > 0`),
}));

export const availabilityRules = pgTable('availability_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  professionalWeekdayIdx: index('availability_rules_professional_weekday_idx').on(table.professionalId, table.weekday),
  weekdayRangeCheck: check('availability_rules_weekday_range_check', sql`${table.weekday} BETWEEN 0 AND 6`),
  timeOrderCheck: check('availability_rules_time_order_check', sql`${table.startTime} < ${table.endTime}`),
}));

export const availabilityExceptions = pgTable('availability_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  isBlocked: boolean('is_blocked').default(true).notNull(),
  reason: text('reason'),
  ...timestamps,
}, (table) => ({
  professionalDateIdx: index('availability_exceptions_professional_date_idx').on(table.professionalId, table.date),
  timePairCheck: check('availability_exceptions_time_pair_check', sql`(${table.startTime} IS NULL AND ${table.endTime} IS NULL) OR (${table.startTime} IS NOT NULL AND ${table.endTime} IS NOT NULL AND ${table.startTime} < ${table.endTime})`),
}));


export const calendarConnections = pgTable('calendar_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  provider: text('provider').default('manual').notNull(),
  externalCalendarId: text('external_calendar_id'),
  status: calendarConnectionStatusEnum('status').default('not_connected').notNull(),
  syncDirection: text('sync_direction').default('export_only').notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  notes: text('notes'),
  ...timestamps,
}, (table) => ({
  professionalProviderUnique: uniqueIndex('calendar_connections_professional_provider_unique').on(table.professionalId, table.provider),
  statusIdx: index('calendar_connections_status_idx').on(table.status),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'restrict' }),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').default('pending').notNull(),
  priceCents: integer('price_cents').notNull(),
  depositCents: integer('deposit_cents').default(0).notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('not_required').notNull(),
  policyAcceptedAt: timestamp('policy_accepted_at', { withTimezone: true }),
  reminderOptIn: boolean('reminder_opt_in').default(true).notNull(),
  clientNote: text('client_note'),
  professionalNote: text('professional_note'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  clientIdx: index('bookings_client_idx').on(table.clientId, table.startsAt),
  professionalIdx: index('bookings_professional_idx').on(table.professionalId, table.startsAt),
  statusIdx: index('bookings_status_idx').on(table.status),
  paymentStatusIdx: index('bookings_payment_status_idx').on(table.paymentStatus),
  timeOrderCheck: check('bookings_time_order_check', sql`${table.startsAt} < ${table.endsAt}`),
  priceNonNegativeCheck: check('bookings_price_non_negative_check', sql`${table.priceCents} >= 0`),
  depositRangeCheck: check('bookings_deposit_range_check', sql`${table.depositCents} >= 0 AND ${table.depositCents} <= ${table.priceCents}`),
}));


export const bookingPayments = pgTable('booking_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  provider: text('provider').default('manual').notNull(),
  providerReference: text('provider_reference'),
  status: paymentStatusEnum('status').default('deposit_due').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('usd').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  ...timestamps,
}, (table) => ({
  bookingUnique: uniqueIndex('booking_payments_booking_unique').on(table.bookingId),
  statusIdx: index('booking_payments_status_idx').on(table.status),
  amountNonNegativeCheck: check('booking_payments_amount_non_negative_check', sql`${table.amountCents} >= 0`),
}));

export const bookingRescheduleRequests = pgTable('booking_reschedule_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  requestedById: uuid('requested_by_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  proposedStartsAt: timestamp('proposed_starts_at', { withTimezone: true }).notNull(),
  proposedEndsAt: timestamp('proposed_ends_at', { withTimezone: true }).notNull(),
  status: rescheduleRequestStatusEnum('status').default('pending').notNull(),
  note: text('note'),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  bookingStatusIdx: index('booking_reschedule_requests_booking_status_idx').on(table.bookingId, table.status),
  timeOrderCheck: check('booking_reschedule_requests_time_order_check', sql`${table.proposedStartsAt} < ${table.proposedEndsAt}`),
}));

export const bookingReminders = pgTable('booking_reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  type: text('type').default('appointment_reminder').notNull(),
  status: reminderStatusEnum('status').default('scheduled').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  bookingUserUnique: uniqueIndex('booking_reminders_booking_user_type_unique').on(table.bookingId, table.userId, table.type),
  scheduleIdx: index('booking_reminders_schedule_idx').on(table.status, table.scheduledFor),
}));

export const bookingDisputes = pgTable('booking_disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'restrict' }),
  openedById: uuid('opened_by_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  status: disputeStatusEnum('status').default('open').notNull(),
  reason: text('reason').notNull(),
  details: text('details').notNull(),
  resolutionNote: text('resolution_note'),
  resolvedById: uuid('resolved_by_id').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  bookingIdx: index('booking_disputes_booking_idx').on(table.bookingId),
  statusIdx: index('booking_disputes_status_idx').on(table.status, table.createdAt),
  participantIdx: index('booking_disputes_participant_idx').on(table.clientId, table.professionalId),
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  cleanlinessRating: integer('cleanliness_rating').default(5).notNull(),
  communicationRating: integer('communication_rating').default(5).notNull(),
  valueRating: integer('value_rating').default(5).notNull(),
  wouldRecommend: boolean('would_recommend').default(true).notNull(),
  photoUrls: text('photo_urls').array().default(sql`ARRAY[]::text[]`).notNull(),
  helpfulCount: integer('helpful_count').default(0).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  bookingUnique: uniqueIndex('reviews_booking_unique').on(table.bookingId),
  professionalIdx: index('reviews_professional_idx').on(table.professionalId),
  ratingRangeCheck: check('reviews_rating_range_check', sql`${table.rating} BETWEEN 1 AND 5`),
  cleanlinessRatingRangeCheck: check('reviews_cleanliness_rating_range_check', sql`${table.cleanlinessRating} BETWEEN 1 AND 5`),
  communicationRatingRangeCheck: check('reviews_communication_rating_range_check', sql`${table.communicationRating} BETWEEN 1 AND 5`),
  valueRatingRangeCheck: check('reviews_value_rating_range_check', sql`${table.valueRating} BETWEEN 1 AND 5`),
}));

export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  beforeImageUrl: text('before_image_url'),
  afterImageUrl: text('after_image_url'),
  caption: text('caption').notNull(),
  category: text('category').notNull(),
  serviceTags: text('service_tags').array().default(sql`ARRAY[]::text[]`).notNull(),
  transformationNotes: text('transformation_notes'),
  isVisible: boolean('is_visible').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  ...timestamps,
}, (table) => ({
  professionalIdx: index('portfolio_items_professional_idx').on(table.professionalId),
}));

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueFavorite: uniqueIndex('favorites_client_professional_unique').on(table.clientId, table.professionalId),
}));

export const savedSearches = pgTable('saved_searches', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  query: text('query'),
  category: text('category'),
  city: text('city'),
  state: text('state'),
  maxPriceCents: integer('max_price_cents'),
  notifyOnNewMatches: boolean('notify_on_new_matches').default(true).notNull(),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  clientIdx: index('saved_searches_client_idx').on(table.clientId, table.updatedAt),
  uniqueClientName: uniqueIndex('saved_searches_client_name_unique').on(table.clientId, sql`lower(${table.name})`),
  maxPriceNonNegativeCheck: check('saved_searches_max_price_non_negative_check', sql`${table.maxPriceCents} IS NULL OR ${table.maxPriceCents} >= 0`),
}));

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  inboxIdx: index('messages_inbox_idx').on(table.recipientId, table.createdAt),
  threadIdx: index('messages_thread_idx').on(table.senderId, table.recipientId),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  actionUrl: text('action_url'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index('notifications_user_created_idx').on(table.userId, table.createdAt),
  unreadIdx: index('notifications_unread_idx').on(table.userId, table.readAt),
}));

export const adminActions = pgTable('admin_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  action: text('action').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  professionalProfile: one(professionalProfiles, {
    fields: [users.id],
    references: [professionalProfiles.userId],
  }),
  clientBookings: many(bookings),
  notifications: many(notifications),
  savedSearches: many(savedSearches),
  openedDisputes: many(bookingDisputes),
}));

export const professionalProfilesRelations = relations(professionalProfiles, ({ one, many }) => ({
  user: one(users, { fields: [professionalProfiles.userId], references: [users.id] }),
  services: many(services),
  bookings: many(bookings),
  reviews: many(reviews),
  portfolioItems: many(portfolioItems),
  bookingPolicy: one(bookingPolicies),
  calendarConnections: many(calendarConnections),
  disputes: many(bookingDisputes),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type NewProfessionalProfile = typeof professionalProfiles.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type BookingPolicy = typeof bookingPolicies.$inferSelect;
export type NewBookingPolicy = typeof bookingPolicies.$inferInsert;
export type CalendarConnection = typeof calendarConnections.$inferSelect;
export type NewCalendarConnection = typeof calendarConnections.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingPayment = typeof bookingPayments.$inferSelect;
export type NewBookingPayment = typeof bookingPayments.$inferInsert;
export type BookingRescheduleRequest = typeof bookingRescheduleRequests.$inferSelect;
export type NewBookingRescheduleRequest = typeof bookingRescheduleRequests.$inferInsert;
export type BookingReminder = typeof bookingReminders.$inferSelect;
export type NewBookingReminder = typeof bookingReminders.$inferInsert;
export type BookingDispute = typeof bookingDisputes.$inferSelect;
export type NewBookingDispute = typeof bookingDisputes.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type NewPortfolioItem = typeof portfolioItems.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
