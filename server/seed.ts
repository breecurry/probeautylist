import { db } from '../db';
import { users, businesses, portfolioItems } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Starting seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await db.insert(users).values({
    username: 'admin',
    email: 'admin@beautybooking.com',
    password: hashedPassword,
    role: 'admin',
  }).onConflictDoNothing().returning();

  const businessOwner1 = await db.insert(users).values({
    username: 'sarah_luxe',
    email: 'sarah@luxelocks.com',
    password: hashedPassword,
    role: 'business_owner',
  }).onConflictDoNothing().returning();

  const businessOwner2 = await db.insert(users).values({
    username: 'emily_polish',
    email: 'emily@polishedperfection.com',
    password: hashedPassword,
    role: 'business_owner',
  }).onConflictDoNothing().returning();

  const businessOwner3 = await db.insert(users).values({
    username: 'jessica_glow',
    email: 'jessica@glowbar.com',
    password: hashedPassword,
    role: 'business_owner',
  }).onConflictDoNothing().returning();

  const businessOwner4 = await db.insert(users).values({
    username: 'david_mane',
    email: 'david@maneevent.com',
    password: hashedPassword,
    role: 'business_owner',
  }).onConflictDoNothing().returning();

  const client1 = await db.insert(users).values({
    username: 'client1',
    email: 'client@example.com',
    password: hashedPassword,
    role: 'client',
  }).onConflictDoNothing().returning();

  console.log('Created users');

  if (businessOwner1[0]) {
    const business1 = await db.insert(businesses).values({
      ownerId: businessOwner1[0].id,
      name: "Luxe Locks Salon",
      serviceType: "Hair Stylist",
      description: "Premium hair styling services specializing in color and extensions.",
      location: "Downtown",
      address: "123 Main St, Suite 101, Downtown, Cityville",
      phone: "(555) 123-4567",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000",
      tier: "gold",
      approved: true,
      funFacts: ["I've been styling hair for over 10 years!", "I was a finalist in the National Hair Awards 2023.", "I love creating custom color blends for my clients."],
    }).onConflictDoNothing().returning();

    if (business1[0]) {
      await db.insert(portfolioItems).values([
        {
          businessId: business1[0].id,
          imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
          caption: "Beautiful balayage transformation",
        },
        {
          businessId: business1[0].id,
          imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
          caption: "Platinum blonde perfection",
        },
        {
          businessId: business1[0].id,
          imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
          caption: "Curly hair styling",
        },
      ]).onConflictDoNothing();
    }
  }

  if (businessOwner2[0]) {
    await db.insert(businesses).values({
      ownerId: businessOwner2[0].id,
      name: "Polished Perfection",
      serviceType: "Nail Technician",
      description: "Detailed nail art and spa pedicures in a relaxing environment.",
      location: "Westside",
      address: "456 West Ave, Westside, Cityville",
      phone: "(555) 987-6543",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=1000",
      tier: "silver",
      approved: true,
      funFacts: ["I can hand-paint tiny characters on nails!", "My favorite nail shape is almond.", "I use only non-toxic, vegan polishes."],
    }).onConflictDoNothing();
  }

  if (businessOwner3[0]) {
    await db.insert(businesses).values({
      ownerId: businessOwner3[0].id,
      name: "Glow Bar",
      serviceType: "Esthetician",
      description: "Facials, waxing, and skincare consultations.",
      location: "North Hills",
      address: "789 North Blvd, North Hills, Cityville",
      phone: "(555) 555-0199",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1000",
      tier: "bronze",
      approved: true,
      funFacts: ["I'm a certified organic skincare specialist.", "I believe great skin starts from within."],
    }).onConflictDoNothing();
  }

  if (businessOwner4[0]) {
    await db.insert(businesses).values({
      ownerId: businessOwner4[0].id,
      name: "The Mane Event",
      serviceType: "Barber",
      description: "Classic cuts and shaves for the modern gentleman.",
      location: "Downtown",
      address: "321 Central St, Downtown, Cityville",
      phone: "(555) 246-8101",
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000",
      tier: "free",
      approved: true,
      funFacts: ["I specialize in vintage-style cuts.", "I'm a huge sports fan!"],
    }).onConflictDoNothing();
  }

  console.log('Seed completed!');
  console.log('Demo credentials:');
  console.log('Admin: admin / password123');
  console.log('Business Owner: sarah_luxe / password123');
  console.log('Client: client1 / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
