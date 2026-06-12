import { clerkClient, getAuth } from '@clerk/express';
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { organizationMemberships, organizations, users, type Organization, type User } from '../../db/schema.js';
import { requireAuth, publicUser } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HttpError } from '../../utils/http.js';
import { accountUpdateSchema, syncOrganizationSchema, syncUserSchema } from './schemas.js';

export const authRouter = Router();

type ClerkUserProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: { status?: string } | null;
  }>;
};

type ClerkOrganizationProfile = {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
};

function getPrimaryEmail(clerkUser: ClerkUserProfile) {
  const primary = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId);
  const fallback = clerkUser.emailAddresses[0];
  const email = primary?.emailAddress ?? fallback?.emailAddress;

  if (!email) {
    throw new HttpError(422, 'Clerk user does not have an email address');
  }

  return {
    email: email.toLowerCase(),
    emailVerified: (primary ?? fallback)?.verification?.status === 'verified',
  };
}

function cleanName(value: string | null | undefined, fallback: string) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : fallback;
}

function mapClerkOrganizationRole(value: string | null | undefined, isNewOrganization: boolean) {
  if (isNewOrganization) return 'owner' as const;
  if (value === 'org:admin' || value === 'admin' || value === 'owner') return 'admin' as const;
  return 'member' as const;
}

async function fetchClerkUser(userId: string) {
  return await clerkClient.users.getUser(userId) as ClerkUserProfile;
}

async function fetchClerkOrganization(organizationId: string) {
  return await clerkClient.organizations.getOrganization({ organizationId }) as ClerkOrganizationProfile;
}

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.currentUser!), organization: req.currentOrganization ?? null });
}));

authRouter.post('/sync-user', asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new HttpError(401, 'Authentication required');
  }

  const parsed = syncUserSchema.parse(req.body ?? {});
  const clerkUser = await fetchClerkUser(userId);
  const { email, emailVerified } = getPrimaryEmail(clerkUser);

  const [existing] = await db.select().from(users).where(eq(users.clerkUserId, userId)).limit(1);
  const values = {
    tenantId: userId,
    email,
    firstName: cleanName(clerkUser.firstName, 'New'),
    lastName: cleanName(clerkUser.lastName, 'User'),
    phone: parsed.phone || null,
    avatarUrl: clerkUser.imageUrl || null,
    emailVerified,
    isActive: true,
    lastLoginAt: new Date(),
    updatedAt: new Date(),
  } satisfies Partial<User>;

  let user: User;
  if (existing) {
    [user] = await db.update(users).set(values).where(eq(users.id, existing.id)).returning();
  } else {
    [user] = await db.insert(users).values({ clerkUserId: userId, role: parsed.role, ...values }).returning();
  }

  req.currentUser = user;
  res.status(existing ? 200 : 201).json({ user: publicUser(user) });
}));

authRouter.patch('/account', requireAuth, asyncHandler(async (req, res) => {
  const parsed = accountUpdateSchema.parse(req.body);

  const [updated] = await db.update(users)
    .set({
      firstName: parsed.firstName ?? req.currentUser!.firstName,
      lastName: parsed.lastName ?? req.currentUser!.lastName,
      phone: parsed.phone === '' ? null : parsed.phone,
      avatarUrl: parsed.avatarUrl === '' ? null : parsed.avatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, req.currentUser!.id))
    .returning();

  res.json({ user: publicUser(updated) });
}));

authRouter.post('/sync-organization', requireAuth, asyncHandler(async (req, res) => {
  const auth = getAuth(req) as ReturnType<typeof getAuth> & { orgRole?: string; orgSlug?: string; orgMembershipId?: string };
  const parsed = syncOrganizationSchema.parse(req.body ?? {});
  const clerkOrgId = parsed.clerkOrgId ?? auth.orgId;

  if (!clerkOrgId) {
    throw new HttpError(400, 'Active Clerk organization required');
  }

  let clerkOrganization: ClerkOrganizationProfile | null = null;
  try {
    clerkOrganization = await fetchClerkOrganization(clerkOrgId);
  } catch {
    if (!parsed.name) {
      throw new HttpError(422, 'Organization name is required when Clerk organization details are unavailable');
    }
  }

  const name = parsed.name ?? clerkOrganization?.name;
  if (!name) {
    throw new HttpError(422, 'Organization name is required');
  }

  const [existing] = await db.select().from(organizations).where(eq(organizations.clerkOrgId, clerkOrgId)).limit(1);
  const organizationValues = {
    tenantId: clerkOrgId,
    name,
    slug: parsed.slug || clerkOrganization?.slug || auth.orgSlug || null,
    imageUrl: parsed.imageUrl || clerkOrganization?.imageUrl || null,
    createdByUserId: existing?.createdByUserId ?? req.currentUser!.id,
    isActive: true,
    updatedAt: new Date(),
  } satisfies Partial<Organization>;

  let organization: Organization;
  if (existing) {
    [organization] = await db.update(organizations).set(organizationValues).where(eq(organizations.id, existing.id)).returning();
  } else {
    [organization] = await db.insert(organizations).values({ clerkOrgId, ...organizationValues }).returning();
  }

  const membershipRole = mapClerkOrganizationRole(auth.orgRole ?? parsed.role, !existing);
  const clerkMembershipId = parsed.clerkMembershipId ?? auth.orgMembershipId ?? null;
  const [membership] = await db.insert(organizationMemberships)
    .values({
      organizationId: organization.id,
      userId: req.currentUser!.id,
      clerkMembershipId,
      role: membershipRole,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [organizationMemberships.organizationId, organizationMemberships.userId],
      set: {
        clerkMembershipId,
        role: membershipRole,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning();

  req.currentOrganization = organization;
  res.status(existing ? 200 : 201).json({ organization, membership });
}));
