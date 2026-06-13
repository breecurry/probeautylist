# Pro Beauty List

Pro Beauty List is a self-hosted marketplace and online booking application for beauty professionals and clients. The rebuilt application is a native React web app backed by an Express API, PostgreSQL persistence, server-managed sessions, and a modular feature structure. It is designed so beauty professionals can publish profiles, services, availability, portfolio work, booking policies, and booking workflows, while clients can discover providers, save searches, request services, message professionals, review completed work, and open support disputes when needed.

The project is intentionally structured as a single deployable full-stack application that can run on infrastructure you control. The client is built with React and Vite, the server runs on Express, and persistent application data is stored in PostgreSQL through Drizzle ORM. React is a component-based JavaScript UI library, Vite is a modern frontend build tool, Express is a Node.js web framework, PostgreSQL is an open-source relational database, and Drizzle ORM provides TypeScript-first database modeling and migrations.[1] [2] [3] [4] [5]

## What the app does

| Area | Current rebuilt capability |
|---|---|
| Public discovery | Clients can browse approved beauty professionals and search by category, city, state, specialty, portfolio availability, price, and trust-oriented sorting. |
| Professional onboarding | Professional users have an onboarding checklist for profile readiness, services, availability, portfolio, and approval preparation. |
| Professional profiles | Professionals can create and edit public profiles with category, specialties, location, bio, images, license label, booking policy, and calendar-connection metadata. |
| Services | Professionals can create services with category, description, duration, price, deposit, and active or disabled status. |
| Availability | Professionals can define weekly working-hour rules and dated exceptions so booking requests are constrained to available time windows. |
| Bookings | Clients can request bookings; the backend enforces ownership, role checks, future dates, availability windows, policy acceptance, reschedule workflows, payments, and double-booking protection. |
| Messaging | Clients and professionals can exchange booking-scoped messages with ownership checks and notification events. |
| Reviews | Clients can review completed bookings with overall rating, sub-ratings, recommendation flag, comments, and review photos. |
| Portfolio | Professionals can publish portfolio images, before-and-after metadata, service tags, transformation notes, captions, visibility, and ordering. |
| Favorites and saved searches | Clients can favorite professionals, save discovery searches, mark searches as viewed, and receive recommendation results. |
| Notifications | Users receive in-app notifications for booking, profile, message, review, dispute, saved-search, and admin workflow events. |
| Disputes | Clients and professionals can open booking-related disputes, and admins can review and resolve them. |
| Admin operations | Admin users can review pending professionals, approve or reject profiles, inspect users, view action history, resolve disputes, and review operational analytics. |
| Security baseline | Passwords are hashed with Argon2id, sessions are server-managed, CSRF protection is enforced for mutating requests, security headers are enabled, input is validated with Zod, and production secrets fail fast when missing. |

## Project structure

| Path | Purpose |
|---|---|
| `client/src` | Native React application, route definitions, screens, layout, API helpers, and client-side safety helpers. |
| `server/src` | Express API, authentication and CSRF middleware, feature modules, database client, and admin bootstrap script. |
| `server/src/db/schema.ts` | Database schema for users, sessions, professionals, services, availability, bookings, reviews, portfolio, favorites, saved searches, disputes, admin actions, and notifications. |
| `shared/types.ts` | Shared domain constants and TypeScript types used by the client. |
| `migrations/` | Committed Drizzle migrations that should be applied in order on local, staging, and production databases. |
| `scripts/` | Utility scripts for health smoke testing and comprehensive local end-to-end testing. |
| `DEPLOYMENT.md` | Self-hosting instructions for running the rebuilt application on your own server. |

## Local development

Create a PostgreSQL database, copy `.env.example` to `.env`, and replace every placeholder value with real local settings. `SESSION_SECRET` must be a long random value and must not be committed.

```bash
npm install
npm run db:migrate
npm run dev
```

For frontend development against the local API, run this in a second terminal:

```bash
npm run dev:client
```

The development API normally runs at `http://127.0.0.1:3000`, and the Vite frontend normally runs at `http://127.0.0.1:5173` unless those ports are already in use.

## Quality commands

The rebuilt app includes scripts for type checking, linting, production build validation, database migration generation, migration execution, compiled-server smoke testing, comprehensive local end-to-end testing, full release verification, and admin bootstrapping.

| Command | Purpose |
|---|---|
| `npm run check` | Runs TypeScript validation for the client and server. |
| `npm run lint` | Runs ESLint against TypeScript, React, and maintained script files. |
| `npm run build` | Validates types, builds the React client, and compiles the Express server. |
| `npm run start` | Starts the compiled production server from `dist/server/index.js`. |
| `npm run db:generate` | Generates Drizzle migration files from the schema during development. Do not run this on production servers. |
| `npm run db:migrate` | Applies pending database migrations. |
| `npm run smoke:health` | Verifies a running server responds successfully at `/api/health`. |
| `npm run e2e:local` | Runs the maintained local end-to-end harness against an already-running API and frontend. |
| `npm run verify` | Runs strict linting, full build validation, and a high-severity production dependency audit. |
| `npm run admin:create` | Creates or updates the initial admin account using environment variables. |

## Local end-to-end testing

The local end-to-end harness validates the deployed or locally running app shell, public API health, public professional search endpoints, and protected-route guards. Authentication is now Clerk-backed, so authenticated checks are optional and require a valid Clerk bearer token supplied through `PBL_E2E_BEARER_TOKEN`.

A typical local run looks like this:

```bash
# terminal 1: API
NODE_ENV=development npm run dev

# terminal 2: frontend
npm run dev:client

# terminal 3: E2E smoke harness
PBL_BASE_URL=http://127.0.0.1:3000 \
PBL_FRONTEND_URL=http://127.0.0.1:5173 \
npm run e2e:local

# optional authenticated Clerk-backed checks
PBL_E2E_BEARER_TOKEN='valid-clerk-test-token' \
PBL_BASE_URL=http://127.0.0.1:3000 \
PBL_FRONTEND_URL=http://127.0.0.1:5173 \
npm run e2e:local
```

The harness prints a pass/fail summary when it completes. The default unauthenticated smoke path is safe for production health checks because it does not create or mutate data. Authenticated token-backed checks should be run only with an intended test account.

## Validation status

The rebuilt application has been validated with linting, TypeScript checks, production build generation, compiled-server health smoke testing, a high-severity production dependency audit, and a Clerk-aware smoke workflow that validates the public app shell, public API routes, and protected-route guards.

| Check | Result |
|---|---|
| `npm run lint` | Passed. |
| `npm run check` | Passed. |
| `npm run build` | Passed. |
| `npm audit --omit=dev --audit-level=high` | Passed with zero high-severity production vulnerabilities. |
| `npm run verify` | Passed. |
| Comprehensive local E2E harness | Passed against local development API and frontend servers. |

## References

[1]: https://react.dev/ "React Documentation"
[2]: https://vite.dev/ "Vite Documentation"
[3]: https://expressjs.com/ "Express Documentation"
[4]: https://www.postgresql.org/ "PostgreSQL"
[5]: https://orm.drizzle.team/ "Drizzle ORM"
