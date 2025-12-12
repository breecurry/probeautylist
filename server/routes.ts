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
import { insertUserSchema, insertBusinessSchema, insertBookingSchema, insertReviewSchema, insertClientReviewSchema, insertPortfolioItemSchema, insertPortfolioCommentSchema, insertMessageSchema, insertTipSchema } from "@shared/schema";

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

      const booking = await storage.createBooking(result.data);
      res.json(booking);
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

  return httpServer;
}
