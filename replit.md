# Pro Beauty List - Salon & Spa Booking Platform

## Overview

Pro Beauty List is a full-stack web application for connecting clients with beauty professionals (hair stylists, nail artists, spa services). The platform enables business owners to list their services, manage bookings, and showcase portfolios, while clients can search, book appointments, leave reviews, and send tips. The application includes tiered subscription plans for businesses and integrates with Stripe for payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with custom theme (sage green and taupe color scheme)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Animations**: Framer Motion for page transitions and interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Passport.js with Local Strategy, express-session with PostgreSQL session store
- **Password Hashing**: bcryptjs

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Session Store**: connect-pg-simple for persistent sessions
- **Schema Location**: `shared/schema.ts` contains all table definitions

### Database Schema (Key Tables)
- `users` - User accounts with roles (client, business_owner, admin)
- `businesses` - Business listings with tier-based features (free, bronze, silver, gold)
  - Deposit settings: `depositRequired`, `depositAmount`, `advanceNoticeHours`
- `bookings` - Appointment bookings with deposit tracking
  - Fields: `depositPaid`, `depositAmount`, `stripePaymentIntentId`, `completedByBusiness`
- `reviews` - Business reviews from clients (gated to completed bookings)
- `reviewPhotos` - Photos attached to reviews
- `clientReviews` - Reviews of clients from businesses (gated to completed bookings)
- `portfolioItems` - Business portfolio photos
- `portfolioLikes` / `portfolioComments` - Social engagement features
- `messages` - Direct messaging between users
- `tips` - Client tips for service providers
- `notifications` - In-app notifications for booking reminders and other alerts
- `beforeAfterPhotos` - Client transformation photos linked to bookings
- `rebookingReminders` - Smart rebooking suggestions after appointments
- `waitlistEntries` - Waitlist for busy stylists
- `groupBookings` / `groupBookingGuests` - Group booking for parties
- `inspirationBoardItems` - Saved portfolio photos for style inspiration
- `staffMembers` - Team members with schedules and specialties
- `followUpSettings` / `followUpMessages` - Automated post-appointment follow-ups
- `clientNotes` - Private notes about clients (business owner only)
- `giftCards` - Purchasable gift cards with balance tracking
- `socialMediaSettings` - Social media integration settings (stub)
- `expenses` - Business expense tracking for profit calculation

### Two-Way Review System
- **Client → Business**: Clients can leave reviews after their booking is marked as completed by the business
- **Business → Client**: Business owners can review clients after marking their booking as completed
- Both review types are gated behind `completedByBusiness=true` on the booking
- Each booking can have at most one review from each direction

### Deposit System
- Businesses can configure deposit requirements via the My Businesses page
- Settings include: `depositRequired` toggle, `depositAmount` (in dollars), `advanceNoticeHours`
- Deposits are processed through Stripe PaymentIntents
- The confirm-deposit endpoint validates the PaymentIntent status, metadata, and amount before marking the deposit as paid

### In-App Notification System
- Notifications are displayed via a bell icon in the navbar (both desktop and mobile)
- Notification scheduler runs every hour to create booking reminders
- Reminder intervals: 7 days, 3 days, 48 hours, and 24 hours before appointments
- Both clients and business owners receive reminders for their bookings
- API endpoints: GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/:id/read, PATCH /api/notifications/read-all
- Scheduler file: `server/notificationScheduler.ts`

### Google Calendar Integration
- Calendar view on the Bookings page showing month view with events
- Users can create custom events directly in Google Calendar
- Bookings can be synced to Google Calendar with one click
- Shows both local bookings (amber dots) and Google Calendar events (blue dots)
- API endpoints: GET /api/calendar/events, POST /api/calendar/events, DELETE /api/calendar/events/:id, POST /api/calendar/sync-booking/:bookingId
- Service file: `server/services/googleCalendar.ts`
- UI component: `client/src/components/BookingsCalendar.tsx`

### Business Owner Appointment Creation
- Business owners can add appointments directly from the calendar
- Click on any day → "Add Appointment" button → comprehensive form
- Client selection options:
  - **Walk-in / New Client**: Enter client name and phone number
  - **Existing Client**: Select from dropdown of previous clients
- When selecting an existing client, prior notes about that client are displayed
- Appointment details include:
  - Service name and price
  - Appointment time
  - Detailed notes section (color formulas, preferences, special requests)
- Bookings created by business owners are auto-confirmed
- Fields stored in `bookings` table: `notes`, `clientName`, `clientPhone`
- API endpoint: POST /api/businesses/:businessId/bookings

### Authentication & Authorization
- Session-based authentication with PostgreSQL persistence
- Role-based access control (client, business_owner, admin)
- Protected routes check authentication state via `/api/auth/me`
- Stripe customer ID linked to user accounts for payments

### Gold Tier Premium Features ($20/month)
Gold tier business owners have access to 5 exclusive premium features:

1. **VIP Spotlight Placement**
   - Gold badge with crown icon on business cards
   - Priority sorting in search results (Gold businesses appear first)
   - Featured section on homepage showing only Gold businesses

2. **Business Intelligence Dashboard** (`/analytics`)
   - Revenue trends chart (monthly)
   - Client churn alerts (30/60/90 days inactive)
   - Peak hours and days analysis
   - Top services by revenue
   - Booking conversion rate
   - Uses Recharts for visualizations

3. **Loyalty & Referral Engine**
   - Configurable loyalty programs (visit threshold, discount %)
   - Auto-tracking of client visits on booking completion
   - Referral code generation and tracking
   - Birthday offers for clients (within 7 days)
   - Tables: `loyaltyPrograms`, `clientLoyaltyProgress`, `referralCodes`, `referrals`

4. **Priority Booking Experience**
   - "Priority Booking" label on Gold business profiles
   - Express checkout with amber/gold styling
   - Enhanced confirmation notifications
   - Priority badge on booking cards

5. **AI Growth Autopilot**
   - Client reactivation suggestions (inactive 30+ days)
   - AI-generated growth insights and recommendations
   - Booking pattern analysis
   - Personalized tips based on business data
   - Uses OpenAI via Replit AI Integrations
   - 6-hour cache to optimize cost/latency
   - Service: `server/services/aiGrowth.ts`

### Build & Deployment
- Development: Vite dev server with HMR, tsx for server
- Production: esbuild bundles server code, Vite builds client to `dist/public`
- Static files served from Express in production
- Database migrations via `drizzle-kit push`

## External Dependencies

### Payment Processing
- **Stripe**: Full integration via `stripe-replit-sync` package
- Handles subscription tiers, deposits, and tips
- Webhook handling for payment events
- Credentials managed through Replit Connectors

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- Connection pooling with `pg` package

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, etc.)
- **Embla Carousel**: Image carousels
- **React Day Picker**: Calendar component
- **Recharts**: Data visualization (charts)

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Zod**: Runtime schema validation
- **date-fns**: Date formatting and manipulation

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal` - Error overlay in development
- `@replit/vite-plugin-cartographer` - Code navigation
- `@replit/vite-plugin-dev-banner` - Development mode indicator
- Custom meta images plugin for OpenGraph tags

## Mobile App Configuration (Capacitor)

The app is configured for native mobile deployment using Capacitor.

### App Identifiers
- **App ID**: `com.probeautylist.app`
- **App Name**: Pro Beauty List
- **Web Directory**: `dist/public`

### Configuration Files
- `capacitor.config.ts` - Main Capacitor configuration
- `android/` - Android native project
- `ios/` - iOS native project

### Building Mobile Apps

**Prerequisites:**
- Apple Developer Account ($99/year) for iOS App Store
- Google Play Developer Account ($25 one-time) for Android

**Build Commands (run locally with Android Studio/Xcode):**
```bash
# Build the web app first
npm run build

# Sync web assets to native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (macOS only)
npx cap open ios
```

### Splash Screen & Status Bar
- Splash screen configured with #F5F3F0 background (matches app theme)
- Status bar uses #9BA8A2 (sage green) with light text
- 2-second splash duration with auto-hide