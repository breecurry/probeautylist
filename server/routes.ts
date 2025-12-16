import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertBusinessSchema, insertBookingSchema, insertReviewSchema, insertReviewPhotoSchema, insertClientReviewSchema, insertPortfolioItemSchema, insertPortfolioCommentSchema, insertMessageSchema, insertTipSchema, insertLoyaltyProgramSchema, insertReferralCodeSchema, insertBeforeAfterPhotoSchema, insertWaitlistEntrySchema, insertGroupBookingSchema, insertGroupBookingGuestSchema, insertInspirationBoardItemSchema, insertStaffMemberSchema, insertFollowUpSettingsSchema, insertClientNoteSchema, insertGiftCardSchema, insertSocialMediaSettingsSchema, insertExpenseSchema } from "@shared/schema";
import { sendPasswordResetEmail, sendWelcomeEmail, sendBookingConfirmationEmail, sendBusinessBookingNotificationEmail } from "./services/emailService";
import { logNewBusinessRegistration } from "./services/businessLogger";
import crypto from "crypto";

const PgSession = ConnectPgSimple(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: string;
    }
  }
}

passport.use(
  new LocalStrategy(async (usernameOrEmail, password, done) => {
    try {
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(usernameOrEmail);
      if (!user) {
        user = await storage.getUserByEmail(usernameOrEmail);
      }
      
      if (!user) {
        return done(null, false, { message: "Invalid username/email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid username/email or password" });
      }

      return done(null, { id: user.id, username: user.username, email: user.email, role: user.role });
    } catch (err) {
      return done(err);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, { id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    done(err);
  }
});

function requireAuth(req: Request, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(role: string) {
  return (req: Request, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user!.role !== role && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

const PAID_TIERS = ['bronze', 'silver', 'gold'];
const GOLD_ONLY = ['gold'];

async function requireBusinessTier(businessId: string, allowedTiers: string[], res: any): Promise<boolean> {
  const business = await storage.getBusiness(businessId);
  if (!business) {
    res.status(404).json({ message: "Business not found" });
    return false;
  }
  if (!allowedTiers.includes(business.tier)) {
    const tierName = allowedTiers.includes('bronze') ? 'paid' : 'Gold';
    res.status(403).json({ message: `This feature requires a ${tierName} subscription plan. Please upgrade to access this feature.` });
    return false;
  }
  return true;
}

const profanityWords = ['badword', 'profanity', 'curse', 'damn', 'hell', 'shit', 'fuck', 'ass', 'bitch'];

function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return profanityWords.some(word => lowerText.includes(word));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "beauty-booking-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const existingUser = await storage.getUserByUsername(result.data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(result.data.password, 10);
      const user = await storage.createUser({
        ...result.data,
        password: hashedPassword,
      });

      req.login({ id: user.id, username: user.username, email: user.email, role: user.role }, async (err) => {
        if (err) {
          return next(err);
        }
        
        // Send welcome email (non-blocking)
        sendWelcomeEmail(user.email, user.username, user.role as 'client' | 'business_owner')
          .catch(emailErr => console.error('[email] Welcome email failed:', emailErr));
        
        return res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  // Password reset - request reset email
  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If an account with that email exists, we've sent a password reset link." });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.username);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Unable to send reset email. Please check the email address is valid." });
      }

      res.json({ message: "If an account with that email exists, we've sent a password reset link." });
    } catch (error) {
      next(error);
    }
  });

  // Password reset - reset password
  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link. Please request a new password reset." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      next(error);
    }
  });

  // One-time admin setup endpoint - creates admin if none exists
  app.post("/api/auth/setup-admin", async (req, res, next) => {
    try {
      const { username, email, password, setupKey } = req.body;
      
      // Require a setup key for security
      if (setupKey !== "beautyconnect-admin-2024") {
        return res.status(403).json({ message: "Invalid setup key" });
      }
      
      // Check if any admin already exists
      const existingAdmins = await storage.getUsersByRole("admin");
      if (existingAdmins && existingAdmins.length > 0) {
        return res.status(400).json({ message: "Admin account already exists. Use normal login." });
      }
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: "admin",
      });
      
      req.login({ id: user.id, username: user.username, email: user.email, role: user.role }, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
      });
    } catch (error: any) {
      next(error);
    }
  });

  app.get("/api/businesses", async (req, res, next) => {
    try {
      const businesses = await storage.getApprovedBusinesses();
      res.json(businesses);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/pending", requireRole("admin"), async (req, res, next) => {
    try {
      const businesses = await storage.getPendingBusinesses();
      res.json(businesses);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id", async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses", requireAuth, async (req, res, next) => {
    try {
      const result = insertBusinessSchema.safeParse({ ...req.body, ownerId: req.user!.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const business = await storage.createBusiness(result.data);
      
      const owner = await storage.getUser(req.user!.id);
      if (owner) {
        logNewBusinessRegistration(
          {
            id: business.id,
            name: business.name,
            description: business.description,
            address: business.address,
            phone: business.phone,
            tier: business.tier,
          },
          {
            email: owner.email,
            username: owner.username,
            firstName: owner.firstName,
            lastName: owner.lastName,
          }
        ).catch(err => console.error('[business-logger] Error:', err));
      }
      
      res.json(business);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/businesses/:id", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateBusiness(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/approve", requireRole("admin"), async (req, res, next) => {
    try {
      const business = await storage.approveBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/bookings", requireAuth, async (req, res, next) => {
    try {
      const bookings = await storage.getBookingsByClient(req.user!.id);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/bookings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const bookings = await storage.getBookingsByBusiness(req.params.id);
      res.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res, next) => {
    try {
      const result = insertBookingSchema.safeParse({ ...req.body, clientId: req.user!.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const isBlocked = await storage.isClientBlockedForBusiness(req.user!.id, result.data.businessId);
      if (isBlocked) {
        return res.status(403).json({ message: "You are unable to book with this business due to too many missed appointments. Please contact the business directly." });
      }

      const business = await storage.getBusiness(result.data.businessId);
      const isGoldBusiness = business?.tier === 'gold';
      
      const booking = await storage.createBookingWithPriority(result.data, isGoldBusiness);
      
      if (business) {
        const businessOwner = await storage.getUser(business.ownerId);
        if (businessOwner) {
          const priorityLabel = isGoldBusiness ? " ⭐ Priority Booking" : "";
          await storage.createNotification({
            userId: business.ownerId,
            bookingId: booking.id,
            type: 'booking_request',
            title: `New${priorityLabel} Request`,
            message: isGoldBusiness 
              ? `Priority booking request for ${booking.serviceName} on ${new Date(booking.date).toLocaleDateString()}`
              : `New booking request for ${booking.serviceName} on ${new Date(booking.date).toLocaleDateString()}`,
          });
          
          // Send email notification to business owner (non-blocking)
          const bookingDate = new Date(booking.date);
          const bookingTime = bookingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          
          sendBusinessBookingNotificationEmail(
            businessOwner.email,
            businessOwner.username,
            req.user!.username,
            booking.serviceName,
            bookingDate,
            bookingTime
          ).catch(emailErr => console.error('[email] Business booking notification failed:', emailErr));
        }
        
        // Send booking confirmation to client (non-blocking)
        const clientBookingDate = new Date(booking.date);
        const clientBookingTime = clientBookingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const depositAmountNum = booking.depositPaid && booking.depositAmount ? parseFloat(booking.depositAmount) : undefined;
        
        sendBookingConfirmationEmail(
          req.user!.email,
          req.user!.username,
          business.name,
          booking.serviceName,
          clientBookingDate,
          clientBookingTime,
          depositAmountNum
        ).catch(emailErr => console.error('[email] Booking confirmation failed:', emailErr));
      }
      
      res.json(booking);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:clientId/loyalty/:businessId", requireAuth, async (req, res, next) => {
    try {
      const { clientId, businessId } = req.params;
      
      // Authorization: user must be the client OR own the business
      const business = await storage.getBusiness(businessId);
      const isClient = req.user!.id === clientId;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      
      if (!isClient && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden - you can only check your own loyalty status or your business's clients" });
      }
      
      const isLoyal = await storage.getLoyalClientStatus(clientId, businessId);
      res.json({ isLoyal });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/bookings/:id/complete", requireAuth, async (req, res, next) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const business = await storage.getBusiness(booking.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.markBookingCompleted(req.params.id);
      
      if (business.tier === 'gold') {
        try {
          await storage.incrementClientVisit(booking.clientId, booking.businessId);
        } catch (loyaltyError) {
          console.error('Loyalty tracking error (non-fatal):', loyaltyError);
        }
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/bookings/:id/no-show", requireAuth, async (req, res, next) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const business = await storage.getBusiness(booking.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(booking.businessId, PAID_TIERS, res)) return;

      const updated = await storage.markBookingAsNoShow(req.params.id);
      
      await storage.createNotification({
        userId: booking.clientId,
        bookingId: booking.id,
        type: 'no_show',
        title: 'Missed Appointment',
        message: `You were marked as a no-show for your ${booking.serviceName} appointment. Repeated no-shows may result in booking restrictions.`,
      });
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/no-shows", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const noShowBookings = await storage.getNoShowBookingsForBusiness(req.params.id);
      res.json(noShowBookings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:id/no-show-status", requireAuth, async (req, res, next) => {
    try {
      const clientId = req.params.id;
      const isOwnProfile = req.user!.id === clientId;
      const isAdmin = req.user!.role === 'admin';
      
      if (!isOwnProfile && !isAdmin) {
        return res.status(403).json({ message: "Forbidden - you can only view your own no-show status" });
      }
      
      const noShowCount = await storage.getClientNoShowCount(clientId);
      res.json({ noShowCount });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:clientId/blocked/:businessId", requireAuth, async (req, res, next) => {
    try {
      const { clientId, businessId } = req.params;
      const isOwnProfile = req.user!.id === clientId;
      const business = await storage.getBusiness(businessId);
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';
      
      if (!isOwnProfile && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden - you can only check your own block status or your business's clients" });
      }
      
      const isBlocked = await storage.isClientBlockedForBusiness(clientId, businessId);
      res.json({ isBlocked });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/reviews", async (req, res, next) => {
    try {
      const reviews = await storage.getReviewsByBusiness(req.params.id);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res, next) => {
    try {
      const result = insertReviewSchema.safeParse({ ...req.body, clientId: req.user!.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const canReview = await storage.canUserReview(result.data.bookingId, req.user!.id);
      if (!canReview) {
        return res.status(403).json({ message: "You can only review completed bookings" });
      }

      const review = await storage.createReview(result.data);
      res.json(review);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reviews/:id/photos", async (req, res, next) => {
    try {
      const photos = await storage.getPhotosForReview(req.params.id);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews/:id/photos", requireAuth, async (req, res, next) => {
    try {
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (review.clientId !== req.user!.id) {
        return res.status(403).json({ message: "You can only add photos to your own reviews" });
      }

      if (!await requireBusinessTier(review.businessId, PAID_TIERS, res)) return;

      const result = insertReviewPhotoSchema.safeParse({
        ...req.body,
        reviewId: req.params.id,
      });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const photo = await storage.addPhotoToReview(result.data);
      res.json(photo);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/review-photos/:id", requireAuth, async (req, res, next) => {
    try {
      const photo = await storage.getReviewPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const review = await storage.getReview(photo.reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      if (review.clientId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete photos from your own reviews" });
      }

      if (!await requireBusinessTier(review.businessId, PAID_TIERS, res)) return;

      await storage.deleteReviewPhoto(req.params.id);
      res.json({ message: "Photo deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/portfolio", async (req, res, next) => {
    try {
      const items = await storage.getPortfolioByBusiness(req.params.id);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/portfolio", requireAuth, async (req, res, next) => {
    try {
      const result = insertPortfolioItemSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const business = await storage.getBusiness(result.data.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const item = await storage.createPortfolioItem(result.data);
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/portfolio/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deletePortfolioItem(req.params.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/portfolio/:id/like", requireAuth, async (req, res, next) => {
    try {
      const liked = await storage.toggleLike(req.params.id, req.user!.id);
      res.json({ liked });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/portfolio/:id/comments", async (req, res, next) => {
    try {
      const comments = await storage.getCommentsForItem(req.params.id);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/portfolio/:id/comments", requireAuth, async (req, res, next) => {
    try {
      if (containsProfanity(req.body.comment)) {
        return res.status(400).json({ message: "Profanity is not allowed" });
      }

      const result = insertPortfolioCommentSchema.safeParse({
        portfolioItemId: req.params.id,
        userId: req.user!.id,
        comment: req.body.comment,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const comment = await storage.createComment(result.data);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages/:userId", requireAuth, async (req, res, next) => {
    try {
      const messages = await storage.getMessagesBetweenUsers(req.user!.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/messages", requireAuth, async (req, res, next) => {
    try {
      if (containsProfanity(req.body.content)) {
        return res.status(400).json({ message: "Profanity is not allowed. Repeated violations will result in account closure." });
      }

      const result = insertMessageSchema.safeParse({ ...req.body, senderId: req.user!.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const message = await storage.createMessage(result.data);
      res.json(message);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tips", requireAuth, async (req, res, next) => {
    try {
      const result = insertTipSchema.safeParse({ ...req.body, clientId: req.user!.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const tip = await storage.createTip(result.data);
      res.json(tip);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/stripe/create-payment-intent", requireAuth, async (req, res, next) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const { amount, businessId } = req.body;
      
      if (!amount || amount < 50) {
        return res.status(400).json({ message: "Amount must be at least $0.50" });
      }

      const user = await storage.getUser(req.user!.id);
      let customerId = user?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          metadata: { userId: req.user!.id },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(req.user!.id, customerId);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: 'usd',
        customer: customerId,
        metadata: {
          businessId: businessId || '',
          userId: req.user!.id,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/stripe/create-subscription-checkout", requireAuth, async (req, res, next) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const { businessId, tier } = req.body;
      
      const business = await storage.getBusiness(businessId);
      if (!business || business.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const priceMapping: Record<string, number> = {
        'bronze': 99,
        'silver': 500,
        'gold': 2000,
      };

      const user = await storage.getUser(req.user!.id);
      let customerId = user?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          metadata: { userId: req.user!.id },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(req.user!.id, customerId);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`,
              description: `Monthly subscription for ${business.name}`,
            },
            unit_amount: priceMapping[tier] || 0,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/profile/${businessId}?upgrade=success`,
        cancel_url: `${req.headers.origin}/profile/${businessId}?upgrade=cancelled`,
        metadata: {
          businessId,
          tier,
          userId: req.user!.id,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:id/reviews", async (req, res, next) => {
    try {
      const reviews = await storage.getClientReviewsByClient(req.params.id);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/client-reviews", requireAuth, async (req, res, next) => {
    try {
      const result = insertClientReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const canReview = await storage.canBusinessReviewClient(result.data.bookingId, req.user!.id);
      if (!canReview) {
        return res.status(403).json({ message: "You can only review clients after completing their booking" });
      }

      const review = await storage.createClientReview(result.data);
      res.json(review);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/stripe/create-deposit-intent", requireAuth, async (req, res, next) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const { bookingId } = req.body;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const business = await storage.getBusiness(booking.businessId);
      if (!business || !business.depositRequired || !business.depositAmount) {
        return res.status(400).json({ message: "Deposit not required for this business" });
      }

      const depositAmount = Math.round(parseFloat(business.depositAmount) * 100);

      const user = await storage.getUser(req.user!.id);
      let customerId = user?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          metadata: { userId: req.user!.id },
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(req.user!.id, customerId);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: depositAmount,
        currency: 'usd',
        customer: customerId,
        metadata: {
          bookingId,
          businessId: booking.businessId,
          userId: req.user!.id,
          type: 'deposit',
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret, amount: depositAmount });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings/:id/confirm-deposit", requireAuth, async (req, res, next) => {
    try {
      const { getUncachableStripeClient } = await import("./stripeClient");
      const stripe = await getUncachableStripeClient();
      
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.clientId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { paymentIntentId } = req.body;
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID required" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not been completed" });
      }

      if (paymentIntent.metadata.bookingId !== req.params.id) {
        return res.status(400).json({ message: "Payment does not match this booking" });
      }

      if (paymentIntent.metadata.userId !== req.user!.id) {
        return res.status(403).json({ message: "Payment does not belong to you" });
      }

      const business = await storage.getBusiness(booking.businessId);
      if (business && business.depositRequired && business.depositAmount) {
        const expectedAmount = Math.round(parseFloat(business.depositAmount) * 100);
        if (paymentIntent.amount < expectedAmount) {
          return res.status(400).json({ message: "Payment amount does not match required deposit" });
        }
      }

      const updated = await storage.updateBookingDeposit(req.params.id, true, paymentIntentId);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user!.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res, next) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res, next) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id/profile", async (req, res, next) => {
    try {
      const { user, reviews } = await storage.getClientProfile(req.params.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let displayName: string;
      if (user.firstName) {
        if (user.lastName) {
          displayName = `${user.firstName} ${user.lastName.charAt(0).toUpperCase()}.`;
        } else {
          displayName = user.firstName;
        }
      } else {
        displayName = user.username.substring(0, 8);
      }
      
      const reviewsWithBusinessInfo = await Promise.all(
        reviews.map(async (review) => {
          const business = await storage.getBusiness(review.businessId);
          return {
            id: review.id,
            businessName: business?.name || "Unknown Business",
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          };
        })
      );
      
      res.json({
        id: user.id,
        displayName,
        profilePhoto: user.profilePhoto,
        reviews: reviewsWithBusinessInfo,
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/profile", requireAuth, async (req, res, next) => {
    try {
      const { firstName, lastName, profilePhoto } = req.body;
      
      const updateData: { firstName?: string; lastName?: string; profilePhoto?: string } = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
      
      const updated = await storage.updateUserProfile(req.user!.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profilePhoto: updated.profilePhoto,
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.user!.id, hashedNewPassword);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/username", requireAuth, async (req, res, next) => {
    try {
      const { newUsername } = req.body;
      
      if (!newUsername || newUsername.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.usernameChanged) {
        return res.status(400).json({ message: "Username can only be changed once" });
      }

      const existingUser = await storage.getUserByUsername(newUsername.trim());
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const updated = await storage.changeUsername(req.user!.id, newUsername.trim());
      if (!updated) {
        return res.status(400).json({ message: "Failed to update username" });
      }

      res.json({ 
        message: "Username updated successfully",
        username: updated.username,
        usernameChanged: updated.usernameChanged
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/me/full", requireAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
        role: user.role,
        usernameChanged: user.usernameChanged,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/analytics", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Analytics is only available for Gold tier businesses" });
      }

      const analytics = await storage.getBusinessAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/loyalty", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Loyalty program is only available for Gold tier businesses" });
      }

      const loyaltyProgram = await storage.getLoyaltyProgram(req.params.id);
      res.json(loyaltyProgram || { enabled: false, visitThreshold: 10, discountPercent: 20 });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/loyalty", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Loyalty program is only available for Gold tier businesses" });
      }

      const loyaltyValidationSchema = z.object({
        enabled: z.boolean().optional(),
        visitThreshold: z.number().int().min(1, "Visit threshold must be at least 1"),
        discountPercent: z.number().int().min(0, "Discount must be at least 0%").max(100, "Discount cannot exceed 100%"),
      });

      const validationResult = loyaltyValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const existing = await storage.getLoyaltyProgram(req.params.id);
      
      if (existing) {
        const updated = await storage.updateLoyaltyProgram(req.params.id, {
          enabled: validationResult.data.enabled,
          visitThreshold: validationResult.data.visitThreshold,
          discountPercent: validationResult.data.discountPercent,
        });
        res.json(updated);
      } else {
        const result = insertLoyaltyProgramSchema.safeParse({
          businessId: req.params.id,
          enabled: validationResult.data.enabled,
          visitThreshold: validationResult.data.visitThreshold,
          discountPercent: validationResult.data.discountPercent,
        });
        
        if (!result.success) {
          return res.status(400).json({ message: fromZodError(result.error).message });
        }
        
        const created = await storage.createLoyaltyProgram(result.data);
        res.json(created);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/referral-codes", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Referral codes are only available for Gold tier businesses" });
      }

      const codes = await storage.getReferralCodes(req.params.id);
      res.json(codes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/referral-codes", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Referral codes are only available for Gold tier businesses" });
      }

      const referralCodeValidationSchema = z.object({
        code: z.string().min(1, "Code is required"),
        discountPercent: z.number().int().min(0, "Discount must be at least 0%").max(100, "Discount cannot exceed 100%"),
        maxUses: z.number().int().min(1, "Max uses must be at least 1").nullable().optional(),
        active: z.boolean().optional(),
      });

      const validationResult = referralCodeValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const existingCode = await storage.getReferralCodeByCode(validationResult.data.code);
      if (existingCode) {
        return res.status(400).json({ message: "Referral code already exists" });
      }

      const result = insertReferralCodeSchema.safeParse({
        businessId: req.params.id,
        code: validationResult.data.code,
        discountPercent: validationResult.data.discountPercent,
        maxUses: validationResult.data.maxUses || null,
        active: validationResult.data.active !== false,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const created = await storage.createReferralCode(result.data);
      res.json(created);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/businesses/:id/referral-codes/:codeId", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Referral codes are only available for Gold tier businesses" });
      }

      const referralCodeUpdateSchema = z.object({
        active: z.boolean().optional(),
        discountPercent: z.number().int().min(0, "Discount must be at least 0%").max(100, "Discount cannot exceed 100%").optional(),
        maxUses: z.number().int().min(1, "Max uses must be at least 1").nullable().optional(),
      });

      const validationResult = referralCodeUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const updated = await storage.updateReferralCode(req.params.codeId, {
        active: validationResult.data.active,
        discountPercent: validationResult.data.discountPercent,
        maxUses: validationResult.data.maxUses,
      });

      if (!updated) {
        return res.status(404).json({ message: "Referral code not found" });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/birthdays", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "Birthday alerts are only available for Gold tier businesses" });
      }

      const clients = await storage.getClientsWithBirthdaysSoon(req.params.id);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/loyalty/:businessId", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      const loyaltyProgram = await storage.getLoyaltyProgram(req.params.businessId);
      const progress = await storage.getClientLoyaltyProgress(req.user!.id, req.params.businessId);

      res.json({
        loyaltyProgram: loyaltyProgram || null,
        progress: progress || { visitCount: 0, rewardsEarned: 0, rewardsRedeemed: 0 },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/referral-codes/redeem", requireAuth, async (req, res, next) => {
    try {
      const { code, referrerId } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      if (!referrerId) {
        return res.status(400).json({ message: "Referrer ID is required" });
      }

      const referredId = req.user!.id;

      if (referrerId === referredId) {
        return res.status(400).json({ message: "You cannot redeem a referral code for yourself" });
      }

      const referralCode = await storage.getReferralCodeByCode(code);
      if (!referralCode) {
        return res.status(400).json({ message: "Invalid referral code" });
      }

      if (!referralCode.active) {
        return res.status(400).json({ message: "This referral code is no longer active" });
      }

      if (referralCode.maxUses !== null && referralCode.usedCount >= referralCode.maxUses) {
        return res.status(400).json({ message: "This referral code has reached its usage limit" });
      }

      const hasBookedWithBusiness = await storage.hasUserBookedWithBusiness(referredId, referralCode.businessId);
      if (!hasBookedWithBusiness) {
        return res.status(400).json({ message: "You must have booked with this business before using a referral code" });
      }

      const referral = await storage.redeemReferralCode(code, referrerId, referredId);
      
      if (!referral) {
        return res.status(400).json({ message: "You have already used this referral code" });
      }

      res.json(referral);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/birthdate", requireAuth, async (req, res, next) => {
    try {
      const { birthDate } = req.body;
      
      if (!birthDate) {
        return res.status(400).json({ message: "Birth date is required" });
      }

      const updated = await storage.updateUserBirthDate(req.user!.id, new Date(birthDate));
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Birth date updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/ai-growth", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "AI Growth Autopilot is only available for Gold tier businesses" });
      }

      const { getCachedInsights } = await import("./services/aiGrowth");
      const cached = getCachedInsights(req.params.id);
      
      if (cached) {
        res.json(cached);
      } else {
        res.json(null);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/ai-growth", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (business.tier !== 'gold') {
        return res.status(403).json({ message: "AI Growth Autopilot is only available for Gold tier businesses" });
      }

      const { generateGrowthInsights } = await import("./services/aiGrowth");
      const insights = await generateGrowthInsights(req.params.id);
      
      res.json(insights);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings/:id/before-after", requireAuth, async (req, res, next) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.clientId !== req.user!.id) {
        return res.status(403).json({ message: "You can only upload photos for your own bookings" });
      }

      if (!booking.completedByBusiness) {
        return res.status(400).json({ message: "You can only upload before/after photos for completed services" });
      }

      const result = insertBeforeAfterPhotoSchema.safeParse({
        bookingId: req.params.id,
        clientId: req.user!.id,
        businessId: booking.businessId,
        beforePhotoUrl: req.body.beforePhotoUrl,
        afterPhotoUrl: req.body.afterPhotoUrl,
        caption: req.body.caption,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const photo = await storage.createBeforeAfterPhoto(result.data);
      res.json(photo);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/before-after", async (req, res, next) => {
    try {
      const photos = await storage.getBeforeAfterPhotosByBusiness(req.params.id);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/before-after/pending", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const photos = await storage.getPendingBeforeAfterPhotosByBusiness(req.params.id);
      res.json(photos);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/before-after/:id/approve", requireAuth, async (req, res, next) => {
    try {
      const photo = await storage.getBeforeAfterPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const business = await storage.getBusiness(photo.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(photo.businessId, PAID_TIERS, res)) return;

      const approved = await storage.approveBeforeAfterPhoto(req.params.id);
      res.json(approved);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/before-after/:id", requireAuth, async (req, res, next) => {
    try {
      const photo = await storage.getBeforeAfterPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }

      const business = await storage.getBusiness(photo.businessId);
      const isClient = photo.clientId === req.user!.id;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isClient && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(photo.businessId, PAID_TIERS, res)) return;

      await storage.deleteBeforeAfterPhoto(req.params.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/rebooking-suggestions", requireAuth, async (req, res, next) => {
    try {
      const suggestions = await storage.getClientRebookingSuggestions(req.user!.id);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/bookings/quick-rebook/:bookingId", requireAuth, async (req, res, next) => {
    try {
      const originalBooking = await storage.getBooking(req.params.bookingId);
      if (!originalBooking) {
        return res.status(404).json({ message: "Original booking not found" });
      }

      if (originalBooking.clientId !== req.user!.id) {
        return res.status(403).json({ message: "You can only rebook your own appointments" });
      }

      const business = await storage.getBusiness(originalBooking.businessId);
      if (!business || !business.approved) {
        return res.status(400).json({ message: "Business is not available for booking" });
      }

      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Please provide a date for the new booking" });
      }

      const bookingDate = new Date(date);
      const now = new Date();
      const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilBooking < business.advanceNoticeHours) {
        return res.status(400).json({ 
          message: `Bookings require at least ${business.advanceNoticeHours} hours advance notice` 
        });
      }

      const isGoldBusiness = business.tier === 'gold';
      const newBooking = await storage.createBookingWithPriority({
        clientId: req.user!.id,
        businessId: originalBooking.businessId,
        serviceName: originalBooking.serviceName,
        servicePrice: originalBooking.servicePrice,
        date: bookingDate,
        depositAmount: business.depositRequired ? business.depositAmount : null,
      }, isGoldBusiness);

      await storage.createNotification({
        userId: business.ownerId,
        bookingId: newBooking.id,
        type: 'booking_request',
        title: 'Rebooking Request',
        message: `${req.user!.username} has rebooked ${newBooking.serviceName} for ${bookingDate.toLocaleDateString()}`,
      });

      res.json(newBooking);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/businesses/:id/rebooking-settings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const rebookingSettingsSchema = z.object({
        rebookingEnabled: z.boolean().optional(),
        defaultRebookingDays: z.number().int().min(7, "Minimum 7 days").max(365, "Maximum 365 days").optional(),
      });

      const validationResult = rebookingSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: fromZodError(validationResult.error).message });
      }

      const updated = await storage.updateBusiness(req.params.id, validationResult.data);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/bookings/:id/status", requireAuth, async (req, res, next) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const business = await storage.getBusiness(booking.businessId);
      const isClient = booking.clientId === req.user!.id;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isClient && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateBookingStatus(req.params.id, status);

      if (status === 'cancelled' && business) {
        await storage.notifyWaitlistOnCancellation(booking.businessId, new Date(booking.date));
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/waitlist", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business || !business.approved) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const result = insertWaitlistEntrySchema.safeParse({
        clientId: req.user!.id,
        businessId: req.params.id,
        serviceName: req.body.serviceName,
        preferredDate: req.body.preferredDate ? new Date(req.body.preferredDate) : undefined,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const entry = await storage.addToWaitlist(result.data);
      res.json(entry);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/waitlist", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const entries = await storage.getWaitlistForBusiness(req.params.id);
      res.json(entries);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/waitlist", requireAuth, async (req, res, next) => {
    try {
      const entries = await storage.getClientWaitlistEntries(req.user!.id);
      res.json(entries);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/waitlist/:id", requireAuth, async (req, res, next) => {
    try {
      const entry = await storage.getWaitlistEntry(req.params.id);
      if (!entry) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }

      const business = await storage.getBusiness(entry.businessId);
      const isClient = entry.clientId === req.user!.id;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isClient && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(entry.businessId, PAID_TIERS, res)) return;

      await storage.removeFromWaitlist(req.params.id);
      res.json({ message: "Removed from waitlist" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/group-bookings", requireAuth, async (req, res, next) => {
    try {
      const { businessId, scheduledAt, locationNote, specialRequests, depositRequired, depositAmount, guests } = req.body;
      
      if (!businessId || !scheduledAt || !guests || !Array.isArray(guests) || guests.length === 0) {
        return res.status(400).json({ message: "Business ID, scheduled date, and at least one guest are required" });
      }

      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "Invalid scheduled date" });
      }

      const business = await storage.getBusiness(businessId);
      if (!business || !business.approved) {
        return res.status(404).json({ message: "Business not found or not approved" });
      }

      if (!await requireBusinessTier(businessId, PAID_TIERS, res)) return;

      let totalPrice = 0;
      const validatedGuests = [];
      for (const guest of guests) {
        if (!guest.name || !guest.serviceName || !guest.servicePrice) {
          return res.status(400).json({ message: "Each guest must have a name, service name, and service price" });
        }
        const price = parseFloat(guest.servicePrice.replace(/[^0-9.]/g, '')) || 0;
        totalPrice += price;
        validatedGuests.push({
          name: guest.name,
          email: guest.email || null,
          serviceName: guest.serviceName,
          servicePrice: guest.servicePrice,
          notes: guest.notes || null,
          clientUserId: guest.clientUserId || null,
        });
      }

      const groupBookingData = {
        businessId,
        organizerId: req.user!.id,
        scheduledAt: new Date(scheduledAt),
        locationNote: locationNote || null,
        specialRequests: specialRequests || null,
        totalPrice: totalPrice.toFixed(2),
        depositRequired: depositRequired || false,
        depositAmount: depositAmount ? parseFloat(depositAmount).toFixed(2) : null,
      };

      const groupBooking = await storage.createGroupBooking(groupBookingData, validatedGuests);

      await storage.createNotification({
        userId: business.ownerId,
        type: 'group_booking_request',
        title: 'New Group Booking Request',
        message: `Group booking for ${guests.length} guests on ${new Date(scheduledAt).toLocaleDateString()}`,
      });

      res.json(groupBooking);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/group-bookings", requireAuth, async (req, res, next) => {
    try {
      const groupBookings = await storage.getGroupBookingsForOrganizer(req.user!.id);
      res.json(groupBookings);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/group-bookings/:id", requireAuth, async (req, res, next) => {
    try {
      const groupBooking = await storage.getGroupBookingById(req.params.id);
      if (!groupBooking) {
        return res.status(404).json({ message: "Group booking not found" });
      }

      const business = await storage.getBusiness(groupBooking.businessId);
      const isOrganizer = groupBooking.organizerId === req.user!.id;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isOrganizer && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(groupBooking);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/group-bookings/:id", requireAuth, async (req, res, next) => {
    try {
      const groupBooking = await storage.getGroupBookingById(req.params.id);
      if (!groupBooking) {
        return res.status(404).json({ message: "Group booking not found" });
      }

      const business = await storage.getBusiness(groupBooking.businessId);
      const isOrganizer = groupBooking.organizerId === req.user!.id;
      const isBusinessOwner = business && business.ownerId === req.user!.id;
      const isAdmin = req.user!.role === 'admin';

      if (!isOrganizer && !isBusinessOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { status } = req.body;
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateGroupBookingStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/group-bookings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const groupBookings = await storage.getGroupBookingsForBusiness(req.params.id);
      res.json(groupBookings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/inspiration-board", requireAuth, async (req, res, next) => {
    try {
      const { portfolioItemId, businessId, note } = req.body;
      
      if (!portfolioItemId || !businessId) {
        return res.status(400).json({ message: "portfolioItemId and businessId are required" });
      }

      if (!await requireBusinessTier(businessId, PAID_TIERS, res)) return;

      const item = await storage.addToInspirationBoard(req.user!.id, portfolioItemId, businessId, note);
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/inspiration-board", requireAuth, async (req, res, next) => {
    try {
      const items = await storage.getInspirationBoard(req.user!.id);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/inspiration-board/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.removeFromInspirationBoard(req.params.id, req.user!.id);
      res.json({ message: "Removed from inspiration board" });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/inspiration-board/:id", requireAuth, async (req, res, next) => {
    try {
      const { note } = req.body;
      
      if (note === undefined) {
        return res.status(400).json({ message: "note is required" });
      }

      const updated = await storage.updateInspirationBoardNote(req.params.id, req.user!.id, note);
      if (!updated) {
        return res.status(404).json({ message: "Item not found or not authorized" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/inspiration-board/check/:portfolioItemId", requireAuth, async (req, res, next) => {
    try {
      const isSaved = await storage.isItemOnInspirationBoard(req.user!.id, req.params.portfolioItemId);
      res.json({ isSaved });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/staff", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const staff = await storage.getStaffMembersByBusiness(req.params.id);
      res.json(staff);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/staff", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const result = insertStaffMemberSchema.safeParse({ ...req.body, businessId: req.params.id });
      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const staff = await storage.createStaffMember(result.data);
      res.json(staff);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/staff/:id", requireAuth, async (req, res, next) => {
    try {
      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const business = await storage.getBusiness(staff.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(staff.businessId, PAID_TIERS, res)) return;

      res.json(staff);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/staff/:id", requireAuth, async (req, res, next) => {
    try {
      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const business = await storage.getBusiness(staff.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(staff.businessId, PAID_TIERS, res)) return;

      const updated = await storage.updateStaffMember(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/staff/:id", requireAuth, async (req, res, next) => {
    try {
      const staff = await storage.getStaffMember(req.params.id);
      if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      const business = await storage.getBusiness(staff.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(staff.businessId, PAID_TIERS, res)) return;

      await storage.deleteStaffMember(req.params.id);
      res.json({ message: "Staff member deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/follow-up-settings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const settings = await storage.getFollowUpSettings(req.params.id);
      res.json(settings || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/follow-up-settings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const existingSettings = await storage.getFollowUpSettings(req.params.id);
      
      if (existingSettings) {
        const updated = await storage.updateFollowUpSettings(req.params.id, {
          enabled: req.body.enabled,
          delayHours: req.body.delayHours,
          messageTemplate: req.body.messageTemplate,
        });
        return res.json(updated);
      } else {
        const result = insertFollowUpSettingsSchema.safeParse({ ...req.body, businessId: req.params.id });
        if (!result.success) {
          return res.status(400).json({ message: fromZodError(result.error).message });
        }
        const settings = await storage.createFollowUpSettings(result.data);
        return res.json(settings);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/follow-ups", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const followUps = await storage.getFollowUpMessagesByBusiness(req.params.id);
      res.json(followUps);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:businessId/clients/:clientId/notes", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const notes = await storage.getClientNotesForBusiness(req.params.businessId, req.params.clientId);
      res.json(notes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:businessId/clients/:clientId/notes", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const result = insertClientNoteSchema.safeParse({
        businessId: req.params.businessId,
        clientId: req.params.clientId,
        note: req.body.note,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const note = await storage.createClientNote(result.data);
      res.json(note);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/client-notes/:id", requireAuth, async (req, res, next) => {
    try {
      const clientNote = await storage.getClientNote(req.params.id);
      if (!clientNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      const business = await storage.getBusiness(clientNote.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateClientNote(req.params.id, req.body.note);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/client-notes/:id", requireAuth, async (req, res, next) => {
    try {
      const clientNote = await storage.getClientNote(req.params.id);
      if (!clientNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      const business = await storage.getBusiness(clientNote.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteClientNote(req.params.id);
      res.json({ message: "Note deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/gift-cards", requireAuth, async (req, res, next) => {
    try {
      const result = insertGiftCardSchema.safeParse({
        ...req.body,
        purchaserId: req.user!.id,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const business = await storage.getBusiness(result.data.businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (!await requireBusinessTier(result.data.businessId, PAID_TIERS, res)) return;

      const giftCard = await storage.createGiftCard(result.data);
      res.json(giftCard);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/gift-cards/purchased", requireAuth, async (req, res, next) => {
    try {
      const giftCards = await storage.getGiftCardsPurchasedByUser(req.user!.id);
      res.json(giftCards);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/gift-cards", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, PAID_TIERS, res)) return;

      const giftCards = await storage.getGiftCardsByBusiness(req.params.id);
      res.json(giftCards);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/gift-cards/check/:code", async (req, res, next) => {
    try {
      const giftCard = await storage.getGiftCardByCode(req.params.code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      res.json({
        code: giftCard.code,
        balance: giftCard.balance,
        amount: giftCard.amount,
        businessId: giftCard.businessId,
        redeemedAt: giftCard.redeemedAt,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/gift-cards/:code/redeem", requireAuth, async (req, res, next) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be greater than 0" });
      }

      const giftCard = await storage.getGiftCardByCode(req.params.code);
      if (!giftCard) {
        return res.status(404).json({ message: "Gift card not found" });
      }

      const business = await storage.getBusiness(giftCard.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden - only the business owner can redeem gift cards" });
      }

      if (!await requireBusinessTier(giftCard.businessId, PAID_TIERS, res)) return;

      const currentBalance = parseFloat(giftCard.balance);
      if (amount > currentBalance) {
        return res.status(400).json({ message: `Insufficient balance. Current balance: $${currentBalance.toFixed(2)}` });
      }

      const updated = await storage.redeemGiftCard(req.params.code, amount);
      if (!updated) {
        return res.status(400).json({ message: "Failed to redeem gift card" });
      }

      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/social-media-settings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const settings = await storage.getSocialMediaSettings(req.params.id);
      res.json(settings || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/social-media-settings", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const existingSettings = await storage.getSocialMediaSettings(req.params.id);
      
      if (existingSettings) {
        const updated = await storage.updateSocialMediaSettings(req.params.id, req.body);
        return res.json(updated);
      } else {
        const result = insertSocialMediaSettingsSchema.safeParse({
          ...req.body,
          businessId: req.params.id,
        });

        if (!result.success) {
          return res.status(400).json({ message: fromZodError(result.error).message });
        }

        const settings = await storage.createSocialMediaSettings(result.data);
        res.json(settings);
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/expenses", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const expenses = await storage.getExpensesByBusiness(req.params.id);
      res.json(expenses);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/expenses", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const result = insertExpenseSchema.safeParse({
        ...req.body,
        businessId: req.params.id,
      });

      if (!result.success) {
        return res.status(400).json({ message: fromZodError(result.error).message });
      }

      const expense = await storage.createExpense(result.data);
      res.json(expense);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res, next) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const business = await storage.getBusiness(expense.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(expense.businessId, GOLD_ONLY, res)) return;

      const updated = await storage.updateExpense(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res, next) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      const business = await storage.getBusiness(expense.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(expense.businessId, GOLD_ONLY, res)) return;

      await storage.deleteExpense(req.params.id);
      res.json({ message: "Expense deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/businesses/:id/profit-summary", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!await requireBusinessTier(req.params.id, GOLD_ONLY, res)) return;

      const summary = await storage.getProfitSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  // Social Posts routes (for sharing to social media)
  app.get("/api/businesses/:id/social-posts", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const posts = await storage.getSocialPostsByBusiness(req.params.id);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/businesses/:id/social-posts", requireAuth, async (req, res, next) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      if (business.ownerId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const post = await storage.createSocialPost({
        businessId: req.params.id,
        content: req.body.content,
        imageUrl: req.body.imageUrl || null,
      });
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/social-posts/:id/shared", requireAuth, async (req, res, next) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const business = await storage.getBusiness(post.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updated = await storage.updateSocialPostSharedTo(req.params.id, req.body.sharedTo);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/social-posts/:id", requireAuth, async (req, res, next) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const business = await storage.getBusiness(post.businessId);
      if (!business || (business.ownerId !== req.user!.id && req.user!.role !== 'admin')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteSocialPost(req.params.id);
      res.json({ message: "Post deleted" });
    } catch (error) {
      next(error);
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireRole("admin"), async (req, res, next) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/users", requireRole("admin"), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/businesses", requireRole("admin"), async (req, res, next) => {
    try {
      const businesses = await storage.getAllBusinessesWithOwners();
      res.json(businesses);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/users/:id/role", requireRole("admin"), async (req, res, next) => {
    try {
      const { role } = req.body;
      if (!['client', 'business_owner', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res, next) => {
    try {
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/businesses/:id", requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteBusiness(req.params.id);
      res.json({ message: "Business deleted" });
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}
