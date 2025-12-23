import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profilePhoto: text("profile_photo"),
  role: text("role").notNull().default("client"),
  stripeCustomerId: text("stripe_customer_id"),
  usernameChanged: boolean("username_changed").notNull().default(false),
  birthDate: timestamp("birth_date"),
  noShowCount: integer("no_show_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  image: text("image"),
  tier: text("tier").notNull().default("free"),
  approved: boolean("approved").notNull().default(false),
  funFacts: text("fun_facts").array(),
  depositRequired: boolean("deposit_required").notNull().default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  advanceNoticeHours: integer("advance_notice_hours").notNull().default(24),
  rebookingEnabled: boolean("rebooking_enabled").notNull().default(true),
  defaultRebookingDays: integer("default_rebooking_days").notNull().default(42),
  noShowThreshold: integer("no_show_threshold").notNull().default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  serviceName: text("service_name").notNull(),
  servicePrice: text("service_price").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"),
  completedByBusiness: boolean("completed_by_business").notNull().default(false),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  priority: boolean("priority").notNull().default(false),
  noShow: boolean("no_show").notNull().default(false),
  notes: text("notes"),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id).unique(),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewPhotos = pgTable("review_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id),
  photoUrl: text("photo_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientReviews = pgTable("client_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id).unique(),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioLikes = pgTable("portfolio_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const portfolioComments = pgTable("portfolio_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  businessId: varchar("business_id").references(() => businesses.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  reminderType: text("reminder_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  enabled: boolean("enabled").notNull().default(false),
  visitThreshold: integer("visit_threshold").notNull().default(10),
  discountPercent: integer("discount_percent").notNull().default(20),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientLoyaltyProgress = pgTable("client_loyalty_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  visitCount: integer("visit_count").notNull().default(0),
  rewardsEarned: integer("rewards_earned").notNull().default(0),
  rewardsRedeemed: integer("rewards_redeemed").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").notNull().references(() => referralCodes.id),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredId: varchar("referred_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const beforeAfterPhotos = pgTable("before_after_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  beforePhotoUrl: text("before_photo_url").notNull(),
  afterPhotoUrl: text("after_photo_url").notNull(),
  caption: text("caption"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rebookingReminders = pgTable("rebooking_reminders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  lastBookingId: varchar("last_booking_id").notNull().references(() => bookings.id),
  serviceName: text("service_name").notNull(),
  suggestedRebookDate: timestamp("suggested_rebook_date").notNull(),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  rebookingLink: text("rebooking_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  serviceName: text("service_name").notNull(),
  preferredDate: timestamp("preferred_date"),
  notified: boolean("notified").notNull().default(false),
  bookedBookingId: varchar("booked_booking_id").references(() => bookings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupBookings = pgTable("group_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  scheduledAt: timestamp("scheduled_at").notNull(),
  locationNote: text("location_note"),
  specialRequests: text("special_requests"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  depositRequired: boolean("deposit_required").notNull().default(false),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groupBookingGuests = pgTable("group_booking_guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupBookingId: varchar("group_booking_id").notNull().references(() => groupBookings.id),
  clientUserId: varchar("client_user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email"),
  serviceName: text("service_name").notNull(),
  servicePrice: text("service_price").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspirationBoardItems = pgTable("inspiration_board_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  portfolioItemId: varchar("portfolio_item_id").notNull().references(() => portfolioItems.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staffMembers = pgTable("staff_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(),
  specialties: text("specialties").array(),
  schedule: text("schedule"),
  profilePhoto: text("profile_photo"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followUpSettings = pgTable("follow_up_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  enabled: boolean("enabled").notNull().default(false),
  delayHours: integer("delay_hours").notNull().default(24),
  messageTemplate: text("message_template"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followUpMessages = pgTable("follow_up_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientNotes = pgTable("client_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  clientId: varchar("client_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaserId: varchar("purchaser_id").notNull().references(() => users.id),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  code: text("code").notNull().unique(),
  message: text("message"),
  stripePaymentId: text("stripe_payment_id"),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialMediaSettings = pgTable("social_media_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id).unique(),
  instagramEnabled: boolean("instagram_enabled").notNull().default(false),
  instagramHandle: text("instagram_handle"),
  autoPostPortfolio: boolean("auto_post_portfolio").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  recurring: boolean("recurring").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businesses.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  sharedTo: text("shared_to").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  approved: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  status: true,
  completedByBusiness: true,
  depositPaid: true,
  stripePaymentIntentId: true,
  priority: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertReviewPhotoSchema = createInsertSchema(reviewPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertClientReviewSchema = createInsertSchema(clientReviews).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioLikeSchema = createInsertSchema(portfolioLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioCommentSchema = createInsertSchema(portfolioComments).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyPrograms).omit({
  id: true,
  createdAt: true,
});

export const insertClientLoyaltyProgressSchema = createInsertSchema(clientLoyaltyProgress).omit({
  id: true,
  createdAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  usedCount: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertBeforeAfterPhotoSchema = createInsertSchema(beforeAfterPhotos).omit({
  id: true,
  createdAt: true,
  approved: true,
});

export const insertRebookingReminderSchema = createInsertSchema(rebookingReminders).omit({
  id: true,
  createdAt: true,
  reminderSent: true,
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true,
  createdAt: true,
  notified: true,
  bookedBookingId: true,
});

export const insertGroupBookingSchema = createInsertSchema(groupBookings).omit({
  id: true,
  createdAt: true,
  depositPaid: true,
  stripePaymentIntentId: true,
  status: true,
});

export const insertGroupBookingGuestSchema = createInsertSchema(groupBookingGuests).omit({
  id: true,
  createdAt: true,
  groupBookingId: true,
});

export const insertInspirationBoardItemSchema = createInsertSchema(inspirationBoardItems).omit({
  id: true,
  createdAt: true,
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
  active: true,
});

export const insertFollowUpSettingsSchema = createInsertSchema(followUpSettings).omit({
  id: true,
  createdAt: true,
});

export const insertFollowUpMessageSchema = createInsertSchema(followUpMessages).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({
  id: true,
  createdAt: true,
});

export const insertGiftCardSchema = createInsertSchema(giftCards).omit({
  id: true,
  createdAt: true,
  balance: true,
  redeemedAt: true,
});

export const insertSocialMediaSettingsSchema = createInsertSchema(socialMediaSettings).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  sharedTo: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertReviewPhoto = z.infer<typeof insertReviewPhotoSchema>;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;

export type InsertClientReview = z.infer<typeof insertClientReviewSchema>;
export type ClientReview = typeof clientReviews.$inferSelect;

export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;

export type InsertPortfolioLike = z.infer<typeof insertPortfolioLikeSchema>;
export type PortfolioLike = typeof portfolioLikes.$inferSelect;

export type InsertPortfolioComment = z.infer<typeof insertPortfolioCommentSchema>;
export type PortfolioComment = typeof portfolioComments.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;

export type InsertClientLoyaltyProgress = z.infer<typeof insertClientLoyaltyProgressSchema>;
export type ClientLoyaltyProgress = typeof clientLoyaltyProgress.$inferSelect;

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export type InsertBeforeAfterPhoto = z.infer<typeof insertBeforeAfterPhotoSchema>;
export type BeforeAfterPhoto = typeof beforeAfterPhotos.$inferSelect;

export type InsertRebookingReminder = z.infer<typeof insertRebookingReminderSchema>;
export type RebookingReminder = typeof rebookingReminders.$inferSelect;

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;

export type InsertGroupBooking = z.infer<typeof insertGroupBookingSchema>;
export type GroupBooking = typeof groupBookings.$inferSelect;

export type InsertGroupBookingGuest = z.infer<typeof insertGroupBookingGuestSchema>;
export type GroupBookingGuest = typeof groupBookingGuests.$inferSelect;

export type InsertInspirationBoardItem = z.infer<typeof insertInspirationBoardItemSchema>;
export type InspirationBoardItem = typeof inspirationBoardItems.$inferSelect;

export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;
export type StaffMember = typeof staffMembers.$inferSelect;

export type InsertFollowUpSettings = z.infer<typeof insertFollowUpSettingsSchema>;
export type FollowUpSettings = typeof followUpSettings.$inferSelect;

export type InsertFollowUpMessage = z.infer<typeof insertFollowUpMessageSchema>;
export type FollowUpMessage = typeof followUpMessages.$inferSelect;

export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type ClientNote = typeof clientNotes.$inferSelect;

export type InsertGiftCard = z.infer<typeof insertGiftCardSchema>;
export type GiftCard = typeof giftCards.$inferSelect;

export type InsertSocialMediaSettings = z.infer<typeof insertSocialMediaSettingsSchema>;
export type SocialMediaSettings = typeof socialMediaSettings.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
