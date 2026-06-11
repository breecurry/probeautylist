import { relations, sql } from 'drizzle-orm';
import {
  boolean,
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
  'message_received',
  'review_received',
  'profile_approved',
  'profile_suspended',
  'system',
]);

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
  clientNote: text('client_note'),
  professionalNote: text('professional_note'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
}, (table) => ({
  clientIdx: index('bookings_client_idx').on(table.clientId, table.startsAt),
  professionalIdx: index('bookings_professional_idx').on(table.professionalId, table.startsAt),
  statusIdx: index('bookings_status_idx').on(table.status),
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  ...timestamps,
}, (table) => ({
  bookingUnique: uniqueIndex('reviews_booking_unique').on(table.bookingId),
  professionalIdx: index('reviews_professional_idx').on(table.professionalId),
}));

export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  professionalId: uuid('professional_id').notNull().references(() => professionalProfiles.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  caption: text('caption').notNull(),
  category: text('category').notNull(),
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
}));

export const professionalProfilesRelations = relations(professionalProfiles, ({ one, many }) => ({
  user: one(users, { fields: [professionalProfiles.userId], references: [users.id] }),
  services: many(services),
  bookings: many(bookings),
  reviews: many(reviews),
  portfolioItems: many(portfolioItems),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type NewProfessionalProfile = typeof professionalProfiles.$inferInsert;
export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
