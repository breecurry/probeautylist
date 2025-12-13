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
  users, businesses, bookings, reviews, clientReviews, portfolioItems, portfolioLikes, portfolioComments, messages, tips, notifications
} from "@shared/schema";
import { db } from "../db";
import { eq, and, desc, sql, gt } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
