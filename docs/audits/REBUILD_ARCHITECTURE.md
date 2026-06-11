# Pro Beauty List Clean Rebuild Architecture

This document defines the implementation direction for the clean rebuild. The current codebase is treated as a product reference only. There is no live user data to preserve, so the rebuild will prioritize correctness, maintainability, security, self-hosting, and a polished user experience over compatibility with old internal file structure.

## Product intent

Pro Beauty List is a marketplace and management platform for beauty professionals and clients. Beauty professionals, including hair stylists, nail artists, estheticians, barbers, makeup artists, lash artists, massage providers, and related service providers, should be able to create public profiles, list services, manage availability, receive booking requests, communicate with clients, and run the practical day-to-day parts of their service business. Clients should be able to search, compare, save, book, review, and receive in-app updates without needing to leave the app.

> The core experience is simple: a client should be able to find the right beauty professional, understand their work and pricing, request or book an appointment online, receive status updates, and return later for reviews or rebooking.

## Non-negotiable rebuild requirements

| Requirement | Implementation standard |
|---|---|
| Self-hosted ownership | The app must run on the owner’s server with ordinary environment variables, ordinary database configuration, and no hidden hosted-platform wrapper. |
| Clean React app | The client must be a normal React + TypeScript app with clear routing, reusable components, and no generated platform-specific shell code. |
| Full-stack application | The backend must provide secure APIs for accounts, professionals, businesses, services, availability, bookings, notifications, reviews, and admin actions. |
| Security-first | No hardcoded credentials, no fallback secrets, no public admin keys, no broad unsafe update endpoints, no leaking reset links, and no sensitive values committed to source control. |
| No dead code | The rebuild should include only features that are implemented and wired. Placeholder-heavy sections should be avoided unless deliberately marked as future work outside production routes. |
| No spaghetti architecture | Backend modules, database schema, validation, frontend routes, and UI components must be separated by responsibility. |
| Domain-ready | The app must be ready for the owner’s domain through standard reverse proxy/TLS setup. The code should not assume a particular hosted vendor. |
| No migration burden | Because there are no real users, the database schema can be designed cleanly from the start. |

## Recommended stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS | This gives a fast native React web app with a clean build pipeline and strong typing. |
| Routing | React Router | Keeps public, client, professional, and admin flows explicit and testable. |
| Server | Node.js, Express, TypeScript | Keeps deployment simple, aligns with existing project language, and avoids unnecessary framework lock-in. |
| Database | PostgreSQL | Strong fit for relational marketplace data: users, professionals, services, bookings, reviews, availability, and notifications. |
| ORM | Drizzle ORM | Type-safe schema definition and migrations without excessive abstraction. |
| Validation | Zod | Shared request validation for predictable API behavior. |
| Auth | Server-managed session cookies with PostgreSQL session storage | Better fit than browser-only tokens for a first-party app, with secure cookie settings and server-side revocation. |
| Passwords | Argon2id | Modern password hashing with strong defaults. |
| Notifications | Database-backed in-app notification table, plus optional future email/SMS adapters | Provides working in-app notifications now without external vendor dependency. |
| File storage | Local uploads directory by default, with an interface that can later support S3-compatible storage | Keeps self-hosting simple while avoiding hardcoded vendor dependency. |

## Domain model

The fresh schema should be focused and normalized. The old prototype attempted too many advanced features at once, so the rebuild will start with a strong core and leave clean extension points.

| Entity | Purpose |
|---|---|
| `users` | Authentication identity for clients, professionals, and admins. |
| `professional_profiles` | Public professional identity, biography, industry category, profile image, approval status, and visibility. |
| `services` | Bookable offerings with name, description, category, duration, price, deposit settings, and active status. |
| `availability_rules` | Weekly recurring availability by professional. |
| `availability_exceptions` | Date-specific blocked or modified availability. |
| `bookings` | Appointment request/booking state, linked client, professional, service, time, price, status, notes, and lifecycle timestamps. |
| `reviews` | Verified client feedback after completed bookings. |
| `portfolio_items` | Professional work samples with images, captions, service category, and visibility. |
| `messages` | Client-professional conversations tied optionally to bookings. |
| `notifications` | In-app events for booking requests, approvals, cancellations, messages, reviews, and admin status changes. |
| `favorites` | Client-saved professionals. |
| `admin_actions` | Audit trail for approval and moderation actions. |
| `sessions` | Server-side session persistence. |

## Booking lifecycle

A clean booking system needs predictable state transitions. The first production version will support request-based booking rather than silently assuming every appointment is instantly confirmed.

| Status | Meaning | Allowed next states |
|---|---|---|
| `pending` | Client requested an appointment and the professional has not accepted yet. | `confirmed`, `declined`, `cancelled_by_client` |
| `confirmed` | Professional accepted the booking. | `completed`, `cancelled_by_client`, `cancelled_by_professional`, `no_show` |
| `declined` | Professional declined the request. | Final state |
| `cancelled_by_client` | Client cancelled before appointment. | Final state |
| `cancelled_by_professional` | Professional cancelled before appointment. | Final state |
| `completed` | Appointment happened successfully. | Review can be created |
| `no_show` | Client did not attend. | Final state |

The backend must enforce this lifecycle. The frontend can show buttons, but the server must be the final authority.

## User roles and access rules

| Role | Capabilities |
|---|---|
| Client | Search professionals, manage own profile, request bookings, message professionals, receive notifications, favorite professionals, and review completed appointments. |
| Professional | Manage own professional profile, services, availability, portfolio, booking requests, booking status, client messages, and notifications. |
| Admin | Approve/suspend professionals, view platform activity, moderate records, and manage flagged content. |

Role checks must be centralized in middleware and service-layer functions. Ownership checks must be performed server-side for every professional, booking, message, portfolio, and review action.

## API module boundaries

| Module | Responsibilities |
|---|---|
| `auth` | Registration, login, logout, current session, password hashing, session handling, and admin bootstrap. |
| `users` | Account profile, role changes through controlled paths, and basic account settings. |
| `professionals` | Professional profile creation, updates, approval, search, and public profile retrieval. |
| `services` | Professional service catalog management and public service listing. |
| `availability` | Recurring rules, exceptions, and available time calculations. |
| `bookings` | Booking creation, status transitions, ownership checks, and appointment lists. |
| `reviews` | Verified review creation and public review display. |
| `portfolio` | Work sample upload metadata and profile display. |
| `messages` | Conversation and message handling between clients and professionals. |
| `notifications` | In-app notification creation, unread counts, list, and read status. |
| `admin` | Approval queues, moderation, admin-only dashboards, and audit trail. |
| `media` | Upload validation, file persistence, and safe public file serving. |
| `health` | Health checks for uptime and deployment verification. |

## Frontend route map

| Route | Audience | Purpose |
|---|---|---|
| `/` | Public | Polished marketplace landing page with search entry, categories, professional benefits, and client benefits. |
| `/search` | Public/client | Search and filter professionals by service type, location, name, and availability indicators. |
| `/pros/:slug` | Public/client | Public professional profile with portfolio, services, reviews, and booking entry point. |
| `/auth/login` | Public | Login for all user roles. |
| `/auth/register` | Public | Registration with role selection and professional onboarding path. |
| `/client` | Client | Client dashboard with upcoming appointments, notifications, favorites, and recent messages. |
| `/client/bookings` | Client | Client appointment history and active booking requests. |
| `/professional` | Professional | Professional dashboard with booking requests, profile completeness, notifications, and next actions. |
| `/professional/profile` | Professional | Profile, category, location, bio, and visibility settings. |
| `/professional/services` | Professional | Manage bookable services and prices. |
| `/professional/availability` | Professional | Manage weekly availability and blocked dates. |
| `/professional/portfolio` | Professional | Manage work samples. |
| `/professional/bookings` | Professional | Review, accept, decline, complete, cancel, or mark no-show bookings. |
| `/notifications` | Authenticated | Unified notification center. |
| `/admin` | Admin | Approval queue, platform overview, and moderation entry points. |

## Security standards

| Area | Standard |
|---|---|
| Secrets | Required environment variables must fail fast if missing. No default production secrets. |
| Passwords | Argon2id hashing. Passwords never returned from APIs. |
| Sessions | HTTP-only cookies, secure in production, same-site policy appropriate for same-domain deployment, server-side storage. |
| Validation | Every mutation endpoint validates body, params, and query input with schema validation. |
| Authorization | Every protected route uses role and ownership checks. Public routes expose only public data. |
| Uploads | File type, size, extension, and path traversal protections. Uploaded files served from a controlled public path. |
| Errors | No stack traces or internal errors returned to users in production. |
| Rate limits | Login, registration, password reset, and high-risk endpoints should be rate-limited. |
| Admin | Initial admin creation must be a deliberate command or environment-controlled bootstrap, never a hardcoded credential. |

## Self-hosting contract

The final project should include a documented `.env.example`, database migration commands, build commands, start commands, and reverse-proxy guidance. It should be deployable on a normal Linux server with Node.js, PostgreSQL, and a process manager.

| Runtime item | Expected configuration |
|---|---|
| `NODE_ENV` | `development`, `test`, or `production`. |
| `PORT` | Backend port, commonly `3000`. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | Long random secret required in production. |
| `APP_ORIGIN` | Public origin such as `https://your-domain.com`. |
| `UPLOAD_DIR` | Server directory for local uploaded files. |
| `MAX_UPLOAD_MB` | Upload size limit. |
| `ADMIN_EMAIL` | Optional bootstrap admin email for initial setup command. |
| `ADMIN_PASSWORD` | Optional bootstrap admin password for initial setup command; must not be stored in source. |

## Implementation rule

The rebuild should be implemented as a clean app, not a patch layer over old files. Old files can be inspected for intended product behavior, but production code should be newly organized, typed, validated, and documented. Each feature should be completed end-to-end before moving to optional advanced additions.
