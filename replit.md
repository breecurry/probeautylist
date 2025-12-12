# BeautyConnect - Salon & Spa Booking Platform

## Overview

BeautyConnect is a full-stack web application for connecting clients with beauty professionals (hair stylists, nail artists, spa services). The platform enables business owners to list their services, manage bookings, and showcase portfolios, while clients can search, book appointments, leave reviews, and send tips. The application includes tiered subscription plans for businesses and integrates with Stripe for payment processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with custom theme (pink/white elegant design)
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
- `clientReviews` - Reviews of clients from businesses (gated to completed bookings)
- `portfolioItems` - Business portfolio photos
- `portfolioLikes` / `portfolioComments` - Social engagement features
- `messages` - Direct messaging between users
- `tips` - Client tips for service providers

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

### Authentication & Authorization
- Session-based authentication with PostgreSQL persistence
- Role-based access control (client, business_owner, admin)
- Protected routes check authentication state via `/api/auth/me`
- Stripe customer ID linked to user accounts for payments

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