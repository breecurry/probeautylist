import { 
  type User, type InsertUser, 
  type Business, type InsertBusiness,
  type Booking, type InsertBooking,
  type Review, type InsertReview,
  type ClientReview, type InsertClientReview,
  type PortfolioItem, type InsertPortfolioItem,
  type PortfolioLike, type InsertPortfolioLike,
  type PortfolioComment, type InsertPortfolioComment,
  type Message, type InsertMessage,
  type Tip, type InsertTip,
  type Notification, type InsertNotification,
  type LoyaltyProgram, type InsertLoyaltyProgram,
  type ClientLoyaltyProgress, type InsertClientLoyaltyProgress,
  type ReferralCode, type InsertReferralCode,
  type Referral, type InsertReferral,
  type BeforeAfterPhoto, type InsertBeforeAfterPhoto,
  users, businesses, bookings, reviews, clientReviews, portfolioItems, portfolioLikes, portfolioComments, messages, tips, notifications,
  loyaltyPrograms, clientLoyaltyProgress, referralCodes, referrals, beforeAfterPhotos
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gt, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined>;
  
  getBusiness(id: string): Promise<Business | undefined>;
  getBusinessesByOwner(ownerId: string): Promise<Business[]>;
  getApprovedBusinesses(): Promise<Business[]>;
  getPendingBusinesses(): Promise<Business[]>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, data: Partial<Business>): Promise<Business | undefined>;
  approveBusiness(id: string): Promise<Business | undefined>;
  
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByClient(clientId: string): Promise<Booking[]>;
  getBookingsByBusiness(businessId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  markBookingCompleted(id: string): Promise<Booking | undefined>;
  
  getReviewsByBusiness(businessId: string): Promise<Review[]>;
  canUserReview(bookingId: string, clientId: string): Promise<boolean>;
  createReview(review: InsertReview): Promise<Review>;
  
  getPortfolioByBusiness(businessId: string): Promise<PortfolioItem[]>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  deletePortfolioItem(id: string): Promise<boolean>;
  
  getLikesForItem(itemId: string): Promise<number>;
  hasUserLikedItem(itemId: string, userId: string): Promise<boolean>;
  toggleLike(itemId: string, userId: string): Promise<boolean>;
  
  getCommentsForItem(itemId: string): Promise<PortfolioComment[]>;
  createComment(comment: InsertPortfolioComment): Promise<PortfolioComment>;
  
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  createTip(tip: InsertTip): Promise<Tip>;
  
  getClientReviewsByClient(clientId: string): Promise<ClientReview[]>;
  canBusinessReviewClient(bookingId: string, businessOwnerId: string): Promise<boolean>;
  createClientReview(review: InsertClientReview): Promise<ClientReview>;
  updateBookingDeposit(id: string, depositPaid: boolean, stripePaymentIntentId?: string): Promise<Booking | undefined>;
  
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUpcomingBookingsForReminders(): Promise<Booking[]>;
  hasReminderBeenSent(bookingId: string, userId: string, reminderType: string): Promise<boolean>;
  getClientProfile(clientId: string): Promise<{ user: { id: string; firstName: string | null; lastName: string | null; profilePhoto: string | null; username: string } | undefined; reviews: ClientReview[] }>;
  updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; profilePhoto?: string }): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedNewPassword: string): Promise<User | undefined>;
  changeUsername(userId: string, newUsername: string): Promise<User | null>;
  getBusinessAnalytics(businessId: string): Promise<{
    monthlyRevenue: { month: string; revenue: number }[];
    churnAlerts: { days30: number; days60: number; days90: number };
    peakHours: { hour: number; count: number }[];
    peakDays: { day: number; dayName: string; count: number }[];
    topServices: { serviceName: string; revenue: number; count: number }[];
    conversionRate: number;
  }>;
  
  getLoyaltyProgram(businessId: string): Promise<LoyaltyProgram | undefined>;
  createLoyaltyProgram(data: InsertLoyaltyProgram): Promise<LoyaltyProgram>;
  updateLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram | undefined>;
  getClientLoyaltyProgress(clientId: string, businessId: string): Promise<ClientLoyaltyProgress | undefined>;
  incrementClientVisit(clientId: string, businessId: string): Promise<ClientLoyaltyProgress | null>;
  getReferralCodes(businessId: string): Promise<ReferralCode[]>;
  createReferralCode(data: InsertReferralCode): Promise<ReferralCode>;
  updateReferralCode(id: string, data: Partial<ReferralCode>): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  redeemReferralCode(code: string, referrerId: string, referredId: string): Promise<Referral | null>;
  getClientsWithBirthdaysSoon(businessId: string): Promise<{ id: string; firstName: string | null; lastName: string | null; birthDate: Date | null }[]>;
  updateUserBirthDate(userId: string, birthDate: Date): Promise<User | undefined>;
  hasUserBookedWithBusiness(userId: string, businessId: string): Promise<boolean>;
  getLoyalClientStatus(clientId: string, businessId: string): Promise<boolean>;
  createBookingWithPriority(booking: InsertBooking, priority: boolean): Promise<Booking>;
  getInactiveClients(businessId: string, days: number): Promise<{ clientId: string; clientName: string; lastVisit: Date; daysSinceVisit: number }[]>;
  getBookingsByWeekday(businessId: string): Promise<{ day: number; dayName: string; count: number }[]>;
  getBookingsByHour(businessId: string): Promise<{ hour: number; count: number }[]>;
  getServiceRevenueMix(businessId: string): Promise<{ serviceName: string; revenue: number; percentage: number; count: number }[]>;
  
  createBeforeAfterPhoto(data: InsertBeforeAfterPhoto): Promise<BeforeAfterPhoto>;
  getBeforeAfterPhotosByBusiness(businessId: string): Promise<BeforeAfterPhoto[]>;
  getPendingBeforeAfterPhotosByBusiness(businessId: string): Promise<BeforeAfterPhoto[]>;
  getBeforeAfterPhotosByClient(clientId: string): Promise<BeforeAfterPhoto[]>;
  approveBeforeAfterPhoto(id: string): Promise<BeforeAfterPhoto | undefined>;
  deleteBeforeAfterPhoto(id: string): Promise<boolean>;
  getBeforeAfterPhoto(id: string): Promise<BeforeAfterPhoto | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string): Promise<User | undefined> {
    const result = await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.id, id)).limit(1);
    return result[0];
  }

  async getBusinessesByOwner(ownerId: string): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.ownerId, ownerId));
  }

  async getApprovedBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.approved, true)).orderBy(desc(businesses.createdAt));
  }

  async getPendingBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).where(eq(businesses.approved, false)).orderBy(desc(businesses.createdAt));
  }

  async createBusiness(business: InsertBusiness): Promise<Business> {
    const result = await db.insert(businesses).values(business).returning();
    return result[0];
  }

  async updateBusiness(id: string, data: Partial<Business>): Promise<Business | undefined> {
    const result = await db.update(businesses).set(data).where(eq(businesses.id, id)).returning();
    return result[0];
  }

  async approveBusiness(id: string): Promise<Business | undefined> {
    const result = await db.update(businesses).set({ approved: true }).where(eq(businesses.id, id)).returning();
    return result[0];
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookingsByClient(clientId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.clientId, clientId)).orderBy(desc(bookings.createdAt));
  }

  async getBookingsByBusiness(businessId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.businessId, businessId)).orderBy(desc(bookings.createdAt));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const result = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async markBookingCompleted(id: string): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ completedByBusiness: true, status: 'completed' })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async getReviewsByBusiness(businessId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.businessId, businessId)).orderBy(desc(reviews.createdAt));
  }

  async canUserReview(bookingId: string, clientId: string): Promise<boolean> {
    const booking = await db.select().from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, clientId)))
      .limit(1);
    
    if (!booking[0] || !booking[0].completedByBusiness) {
      return false;
    }

    const existingReview = await db.select().from(reviews).where(eq(reviews.bookingId, bookingId)).limit(1);
    return existingReview.length === 0;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  }

  async getPortfolioByBusiness(businessId: string): Promise<PortfolioItem[]> {
    return db.select().from(portfolioItems).where(eq(portfolioItems.businessId, businessId)).orderBy(desc(portfolioItems.createdAt));
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const result = await db.insert(portfolioItems).values(item).returning();
    return result[0];
  }

  async deletePortfolioItem(id: string): Promise<boolean> {
    const result = await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
    return true;
  }

  async getLikesForItem(itemId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(portfolioLikes)
      .where(eq(portfolioLikes.portfolioItemId, itemId));
    return Number(result[0]?.count || 0);
  }

  async hasUserLikedItem(itemId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(portfolioLikes)
      .where(and(eq(portfolioLikes.portfolioItemId, itemId), eq(portfolioLikes.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  async toggleLike(itemId: string, userId: string): Promise<boolean> {
    const existing = await db.select().from(portfolioLikes)
      .where(and(eq(portfolioLikes.portfolioItemId, itemId), eq(portfolioLikes.userId, userId)))
      .limit(1);
    
    if (existing.length > 0) {
      await db.delete(portfolioLikes).where(eq(portfolioLikes.id, existing[0].id));
      return false;
    } else {
      await db.insert(portfolioLikes).values({ portfolioItemId: itemId, userId });
      return true;
    }
  }

  async getCommentsForItem(itemId: string): Promise<PortfolioComment[]> {
    return db.select().from(portfolioComments)
      .where(eq(portfolioComments.portfolioItemId, itemId))
      .orderBy(desc(portfolioComments.createdAt));
  }

  async createComment(comment: InsertPortfolioComment): Promise<PortfolioComment> {
    const result = await db.insert(portfolioComments).values(comment).returning();
    return result[0];
  }

  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(
        sql`(${messages.senderId} = ${userId1} AND ${messages.receiverId} = ${userId2}) 
           OR (${messages.senderId} = ${userId2} AND ${messages.receiverId} = ${userId1})`
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async createTip(tip: InsertTip): Promise<Tip> {
    const result = await db.insert(tips).values(tip).returning();
    return result[0];
  }

  async getClientReviewsByClient(clientId: string): Promise<ClientReview[]> {
    return db.select().from(clientReviews).where(eq(clientReviews.clientId, clientId)).orderBy(desc(clientReviews.createdAt));
  }

  async canBusinessReviewClient(bookingId: string, businessOwnerId: string): Promise<boolean> {
    const booking = await db.select().from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    if (!booking[0] || !booking[0].completedByBusiness) {
      return false;
    }

    const business = await db.select().from(businesses)
      .where(eq(businesses.id, booking[0].businessId))
      .limit(1);
    
    if (!business[0] || business[0].ownerId !== businessOwnerId) {
      return false;
    }

    const existingReview = await db.select().from(clientReviews).where(eq(clientReviews.bookingId, bookingId)).limit(1);
    return existingReview.length === 0;
  }

  async createClientReview(review: InsertClientReview): Promise<ClientReview> {
    const result = await db.insert(clientReviews).values(review).returning();
    return result[0];
  }

  async updateBookingDeposit(id: string, depositPaid: boolean, stripePaymentIntentId?: string): Promise<Booking | undefined> {
    const updateData: any = { depositPaid };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    const result = await db.update(bookings).set(updateData).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count || 0);
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const result = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async getUpcomingBookingsForReminders(): Promise<Booking[]> {
    const now = new Date();
    return db.select().from(bookings)
      .where(and(
        eq(bookings.status, 'confirmed'),
        gt(bookings.date, now)
      ));
  }

  async hasReminderBeenSent(bookingId: string, userId: string, reminderType: string): Promise<boolean> {
    const result = await db.select().from(notifications)
      .where(and(
        eq(notifications.bookingId, bookingId),
        eq(notifications.userId, userId),
        eq(notifications.reminderType, reminderType)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getClientProfile(clientId: string): Promise<{ user: { id: string; firstName: string | null; lastName: string | null; profilePhoto: string | null; username: string } | undefined; reviews: ClientReview[] }> {
    const userResult = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profilePhoto: users.profilePhoto,
      username: users.username,
    }).from(users).where(eq(users.id, clientId)).limit(1);
    
    const reviewsResult = await db.select().from(clientReviews)
      .where(eq(clientReviews.clientId, clientId))
      .orderBy(desc(clientReviews.createdAt));
    
    return {
      user: userResult[0],
      reviews: reviewsResult,
    };
  }

  async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; profilePhoto?: string }): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async updateUserPassword(userId: string, hashedNewPassword: string): Promise<User | undefined> {
    const result = await db.update(users).set({ password: hashedNewPassword }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async changeUsername(userId: string, newUsername: string): Promise<User | null> {
    const user = await this.getUser(userId);
    if (!user || user.usernameChanged) {
      return null;
    }
    const existingUser = await this.getUserByUsername(newUsername);
    if (existingUser) {
      return null;
    }
    const result = await db.update(users).set({ username: newUsername, usernameChanged: true }).where(eq(users.id, userId)).returning();
    return result[0] || null;
  }

  async getBusinessAnalytics(businessId: string): Promise<{
    monthlyRevenue: { month: string; revenue: number }[];
    churnAlerts: { days30: number; days60: number; days90: number };
    peakHours: { hour: number; count: number }[];
    peakDays: { day: number; dayName: string; count: number }[];
    topServices: { serviceName: string; revenue: number; count: number }[];
    conversionRate: number;
  }> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenueResult = await db.execute(sql`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CAST(NULLIF(service_price, '') AS NUMERIC)) as revenue
      FROM bookings 
      WHERE business_id = ${businessId} 
        AND status IN ('confirmed', 'completed')
        AND date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `);

    const monthlyRevenue = (monthlyRevenueResult.rows as any[]).map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue) || 0
    }));

    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const days90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const churn30Result = await db.execute(sql`
      SELECT COUNT(DISTINCT client_id) as count FROM bookings 
      WHERE business_id = ${businessId}
      AND client_id NOT IN (
        SELECT DISTINCT client_id FROM bookings 
        WHERE business_id = ${businessId} AND date >= ${days30Ago}
      )
      AND client_id IN (
        SELECT DISTINCT client_id FROM bookings 
        WHERE business_id = ${businessId} AND date >= ${days60Ago} AND date < ${days30Ago}
      )
    `);

    const churn60Result = await db.execute(sql`
      SELECT COUNT(DISTINCT client_id) as count FROM bookings 
      WHERE business_id = ${businessId}
      AND client_id NOT IN (
        SELECT DISTINCT client_id FROM bookings 
        WHERE business_id = ${businessId} AND date >= ${days60Ago}
      )
      AND client_id IN (
        SELECT DISTINCT client_id FROM bookings 
        WHERE business_id = ${businessId} AND date >= ${days90Ago} AND date < ${days60Ago}
      )
    `);

    const churn90Result = await db.execute(sql`
      SELECT COUNT(DISTINCT client_id) as count FROM bookings 
      WHERE business_id = ${businessId}
      AND client_id NOT IN (
        SELECT DISTINCT client_id FROM bookings 
        WHERE business_id = ${businessId} AND date >= ${days90Ago}
      )
      AND client_id IN (
        SELECT DISTINCT client_id FROM bookings WHERE business_id = ${businessId}
      )
    `);

    const churnAlerts = {
      days30: parseInt((churn30Result.rows[0] as any)?.count || '0'),
      days60: parseInt((churn60Result.rows[0] as any)?.count || '0'),
      days90: parseInt((churn90Result.rows[0] as any)?.count || '0'),
    };

    const peakHoursResult = await db.execute(sql`
      SELECT EXTRACT(HOUR FROM date) as hour, COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId}
      GROUP BY EXTRACT(HOUR FROM date)
      ORDER BY hour
    `);

    const peakHours = (peakHoursResult.rows as any[]).map(row => ({
      hour: parseInt(row.hour),
      count: parseInt(row.count)
    }));

    const peakDaysResult = await db.execute(sql`
      SELECT EXTRACT(DOW FROM date) as day, COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId}
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day
    `);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const peakDays = (peakDaysResult.rows as any[]).map(row => ({
      day: parseInt(row.day),
      dayName: dayNames[parseInt(row.day)],
      count: parseInt(row.count)
    }));

    const topServicesResult = await db.execute(sql`
      SELECT 
        service_name as "serviceName",
        SUM(CAST(NULLIF(service_price, '') AS NUMERIC)) as revenue,
        COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId} AND status IN ('confirmed', 'completed')
      GROUP BY service_name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    const topServices = (topServicesResult.rows as any[]).map(row => ({
      serviceName: row.serviceName,
      revenue: parseFloat(row.revenue) || 0,
      count: parseInt(row.count)
    }));

    const conversionResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total
      FROM bookings 
      WHERE business_id = ${businessId}
    `);

    const completed = parseInt((conversionResult.rows[0] as any)?.completed || '0');
    const total = parseInt((conversionResult.rows[0] as any)?.total || '0');
    const conversionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      monthlyRevenue,
      churnAlerts,
      peakHours,
      peakDays,
      topServices,
      conversionRate,
    };
  }

  async getLoyaltyProgram(businessId: string): Promise<LoyaltyProgram | undefined> {
    const result = await db.select().from(loyaltyPrograms).where(eq(loyaltyPrograms.businessId, businessId)).limit(1);
    return result[0];
  }

  async createLoyaltyProgram(data: InsertLoyaltyProgram): Promise<LoyaltyProgram> {
    const result = await db.insert(loyaltyPrograms).values(data).returning();
    return result[0];
  }

  async updateLoyaltyProgram(businessId: string, data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram | undefined> {
    const result = await db.update(loyaltyPrograms).set(data).where(eq(loyaltyPrograms.businessId, businessId)).returning();
    return result[0];
  }

  async getClientLoyaltyProgress(clientId: string, businessId: string): Promise<ClientLoyaltyProgress | undefined> {
    const result = await db.select().from(clientLoyaltyProgress)
      .where(and(eq(clientLoyaltyProgress.clientId, clientId), eq(clientLoyaltyProgress.businessId, businessId)))
      .limit(1);
    return result[0];
  }

  async incrementClientVisit(clientId: string, businessId: string): Promise<ClientLoyaltyProgress | null> {
    const loyaltyProgram = await this.getLoyaltyProgram(businessId);
    
    if (!loyaltyProgram || !loyaltyProgram.enabled) {
      return null;
    }

    const existing = await this.getClientLoyaltyProgress(clientId, businessId);
    
    if (existing) {
      const newVisitCount = existing.visitCount + 1;
      let newRewardsEarned = existing.rewardsEarned;
      
      if (newVisitCount >= loyaltyProgram.visitThreshold) {
        const earnedFromVisits = Math.floor(newVisitCount / loyaltyProgram.visitThreshold);
        if (earnedFromVisits > existing.rewardsEarned) {
          newRewardsEarned = earnedFromVisits;
        }
      }
      
      const result = await db.update(clientLoyaltyProgress)
        .set({ visitCount: newVisitCount, rewardsEarned: newRewardsEarned })
        .where(eq(clientLoyaltyProgress.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(clientLoyaltyProgress).values({
        clientId,
        businessId,
        visitCount: 1,
        rewardsEarned: 0,
        rewardsRedeemed: 0,
      }).returning();
      return result[0];
    }
  }

  async getReferralCodes(businessId: string): Promise<ReferralCode[]> {
    return db.select().from(referralCodes).where(eq(referralCodes.businessId, businessId)).orderBy(desc(referralCodes.createdAt));
  }

  async createReferralCode(data: InsertReferralCode): Promise<ReferralCode> {
    const result = await db.insert(referralCodes).values(data).returning();
    return result[0];
  }

  async updateReferralCode(id: string, data: Partial<ReferralCode>): Promise<ReferralCode | undefined> {
    const result = await db.update(referralCodes).set(data).where(eq(referralCodes.id, id)).returning();
    return result[0];
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const result = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
    return result[0];
  }

  async redeemReferralCode(code: string, referrerId: string, referredId: string): Promise<Referral | null> {
    const referralCode = await this.getReferralCodeByCode(code);
    
    if (!referralCode || !referralCode.active) {
      return null;
    }
    
    if (referralCode.maxUses !== null && referralCode.usedCount >= referralCode.maxUses) {
      return null;
    }
    
    const existingReferral = await db.select().from(referrals)
      .where(and(eq(referrals.referralCodeId, referralCode.id), eq(referrals.referredId, referredId)))
      .limit(1);
    
    if (existingReferral.length > 0) {
      return null;
    }
    
    await db.update(referralCodes)
      .set({ usedCount: referralCode.usedCount + 1 })
      .where(eq(referralCodes.id, referralCode.id));
    
    const result = await db.insert(referrals).values({
      referralCodeId: referralCode.id,
      referrerId,
      referredId,
    }).returning();
    
    return result[0];
  }

  async getClientsWithBirthdaysSoon(businessId: string): Promise<{ id: string; firstName: string | null; lastName: string | null; birthDate: Date | null }[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT u.id, u.first_name as "firstName", u.last_name as "lastName", u.birth_date as "birthDate"
      FROM users u
      INNER JOIN bookings b ON b.client_id = u.id
      WHERE b.business_id = ${businessId}
        AND u.birth_date IS NOT NULL
        AND (
          (EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
           AND EXTRACT(DAY FROM u.birth_date) >= EXTRACT(DAY FROM CURRENT_DATE)
           AND EXTRACT(DAY FROM u.birth_date) <= EXTRACT(DAY FROM CURRENT_DATE) + 7)
          OR
          (EXTRACT(MONTH FROM u.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days')
           AND EXTRACT(DAY FROM u.birth_date) <= EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days'))
        )
    `);
    
    return (result.rows as any[]).map(row => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      birthDate: row.birthDate ? new Date(row.birthDate) : null,
    }));
  }

  async updateUserBirthDate(userId: string, birthDate: Date): Promise<User | undefined> {
    const result = await db.update(users).set({ birthDate }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async hasUserBookedWithBusiness(userId: string, businessId: string): Promise<boolean> {
    const result = await db.select().from(bookings)
      .where(and(eq(bookings.clientId, userId), eq(bookings.businessId, businessId)))
      .limit(1);
    return result.length > 0;
  }

  async getLoyalClientStatus(clientId: string, businessId: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(
        eq(bookings.clientId, clientId),
        eq(bookings.businessId, businessId),
        eq(bookings.status, 'completed')
      ));
    return Number(result[0]?.count || 0) >= 3;
  }

  async createBookingWithPriority(booking: InsertBooking, priority: boolean): Promise<Booking> {
    const result = await db.insert(bookings).values({ ...booking, priority }).returning();
    return result[0];
  }

  async getInactiveClients(businessId: string, days: number): Promise<{ clientId: string; clientName: string; lastVisit: Date; daysSinceVisit: number }[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await db.execute(sql`
      SELECT 
        b.client_id as "clientId",
        COALESCE(u.first_name || ' ' || u.last_name, u.username) as "clientName",
        MAX(b.date) as "lastVisit"
      FROM bookings b
      INNER JOIN users u ON u.id = b.client_id
      WHERE b.business_id = ${businessId}
        AND b.status IN ('confirmed', 'completed')
      GROUP BY b.client_id, u.first_name, u.last_name, u.username
      HAVING MAX(b.date) < ${cutoffDate}
      ORDER BY MAX(b.date) DESC
      LIMIT 10
    `);
    
    return (result.rows as any[]).map(row => ({
      clientId: row.clientId,
      clientName: row.clientName || 'Unknown',
      lastVisit: new Date(row.lastVisit),
      daysSinceVisit: Math.floor((Date.now() - new Date(row.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  async getBookingsByWeekday(businessId: string): Promise<{ day: number; dayName: string; count: number }[]> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const result = await db.execute(sql`
      SELECT EXTRACT(DOW FROM date) as day, COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId}
        AND status IN ('confirmed', 'completed')
      GROUP BY EXTRACT(DOW FROM date)
      ORDER BY day
    `);
    
    return (result.rows as any[]).map(row => ({
      day: parseInt(row.day),
      dayName: dayNames[parseInt(row.day)],
      count: parseInt(row.count)
    }));
  }

  async getBookingsByHour(businessId: string): Promise<{ hour: number; count: number }[]> {
    const result = await db.execute(sql`
      SELECT EXTRACT(HOUR FROM date) as hour, COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId}
        AND status IN ('confirmed', 'completed')
      GROUP BY EXTRACT(HOUR FROM date)
      ORDER BY hour
    `);
    
    return (result.rows as any[]).map(row => ({
      hour: parseInt(row.hour),
      count: parseInt(row.count)
    }));
  }

  async getServiceRevenueMix(businessId: string): Promise<{ serviceName: string; revenue: number; percentage: number; count: number }[]> {
    const result = await db.execute(sql`
      SELECT 
        service_name as "serviceName",
        SUM(CAST(NULLIF(service_price, '') AS NUMERIC)) as revenue,
        COUNT(*) as count
      FROM bookings 
      WHERE business_id = ${businessId} 
        AND status IN ('confirmed', 'completed')
      GROUP BY service_name
      ORDER BY revenue DESC
    `);
    
    const services = (result.rows as any[]).map(row => ({
      serviceName: row.serviceName,
      revenue: parseFloat(row.revenue) || 0,
      count: parseInt(row.count)
    }));
    
    const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);
    
    return services.map(s => ({
      ...s,
      percentage: totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0
    }));
  }

  async createBeforeAfterPhoto(data: InsertBeforeAfterPhoto): Promise<BeforeAfterPhoto> {
    const result = await db.insert(beforeAfterPhotos).values(data).returning();
    return result[0];
  }

  async getBeforeAfterPhotosByBusiness(businessId: string): Promise<BeforeAfterPhoto[]> {
    return db.select().from(beforeAfterPhotos)
      .where(and(eq(beforeAfterPhotos.businessId, businessId), eq(beforeAfterPhotos.approved, true)))
      .orderBy(desc(beforeAfterPhotos.createdAt));
  }

  async getPendingBeforeAfterPhotosByBusiness(businessId: string): Promise<BeforeAfterPhoto[]> {
    return db.select().from(beforeAfterPhotos)
      .where(and(eq(beforeAfterPhotos.businessId, businessId), eq(beforeAfterPhotos.approved, false)))
      .orderBy(desc(beforeAfterPhotos.createdAt));
  }

  async getBeforeAfterPhotosByClient(clientId: string): Promise<BeforeAfterPhoto[]> {
    return db.select().from(beforeAfterPhotos)
      .where(eq(beforeAfterPhotos.clientId, clientId))
      .orderBy(desc(beforeAfterPhotos.createdAt));
  }

  async approveBeforeAfterPhoto(id: string): Promise<BeforeAfterPhoto | undefined> {
    const result = await db.update(beforeAfterPhotos)
      .set({ approved: true })
      .where(eq(beforeAfterPhotos.id, id))
      .returning();
    return result[0];
  }

  async deleteBeforeAfterPhoto(id: string): Promise<boolean> {
    await db.delete(beforeAfterPhotos).where(eq(beforeAfterPhotos.id, id));
    return true;
  }

  async getBeforeAfterPhoto(id: string): Promise<BeforeAfterPhoto | undefined> {
    const result = await db.select().from(beforeAfterPhotos).where(eq(beforeAfterPhotos.id, id)).limit(1);
    return result[0];
  }
}

export const storage = new DatabaseStorage();
