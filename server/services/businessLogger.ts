import * as fs from 'fs';
import * as path from 'path';

const BUSINESS_FOLDER = path.join(process.cwd(), 'business_registrations');

if (!fs.existsSync(BUSINESS_FOLDER)) {
  fs.mkdirSync(BUSINESS_FOLDER, { recursive: true });
}

interface BusinessRegistration {
  id: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  tier: string;
  registeredAt: string;
}

export async function logNewBusinessRegistration(
  business: {
    id: string;
    name: string;
    description: string | null;
    address: string | null;
    phone: string | null;
    tier: string;
  },
  owner: {
    email: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  }
): Promise<void> {
  try {
    const registration: BusinessRegistration = {
      id: business.id,
      name: business.name,
      ownerEmail: owner.email,
      ownerName: [owner.firstName, owner.lastName].filter(Boolean).join(' ') || owner.username,
      description: business.description,
      address: business.address,
      phone: business.phone,
      tier: business.tier,
      registeredAt: new Date().toISOString(),
    };

    const filename = `business_${business.id}_${Date.now()}.json`;
    const filepath = path.join(BUSINESS_FOLDER, filename);

    fs.writeFileSync(filepath, JSON.stringify(registration, null, 2));

    const indexPath = path.join(BUSINESS_FOLDER, 'all_registrations.json');
    let allRegistrations: BusinessRegistration[] = [];

    if (fs.existsSync(indexPath)) {
      try {
        allRegistrations = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
      } catch {
        allRegistrations = [];
      }
    }

    allRegistrations.push(registration);
    fs.writeFileSync(indexPath, JSON.stringify(allRegistrations, null, 2));

    console.log(`[business-logger] New business registered: ${business.name} (${business.id})`);
  } catch (error) {
    console.error('[business-logger] Failed to log business registration:', error);
  }
}
