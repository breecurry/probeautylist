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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

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
