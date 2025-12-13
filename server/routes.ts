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
import { insertUserSchema, insertBusinessSchema, insertBookingSchema, insertReviewSchema, insertClientReviewSchema, insertPortfolioItemSchema, insertPortfolioCommentSchema, insertMessageSchema, insertTipSchema, insertLoyaltyProgramSchema, insertReferralCodeSchema } from "@shared/schema";

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
        }
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

  return httpServer;
}
