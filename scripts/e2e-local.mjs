const BASE_URL = process.env.PBL_BASE_URL || 'http://127.0.0.1:3000';
const FRONTEND_URL = process.env.PBL_FRONTEND_URL || BASE_URL;
const ADMIN_EMAIL = process.env.PBL_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PBL_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Set PBL_ADMIN_EMAIL and PBL_ADMIN_PASSWORD for an existing local admin account before running the local E2E test.');
}

class ApiClient {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
    this.csrfToken = '';
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
  }

  storeCookies(response) {
    const setCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean);
    for (const cookie of setCookies) {
      const first = cookie.split(';')[0];
      const index = first.indexOf('=');
      if (index > 0) this.cookies.set(first.slice(0, index), first.slice(index + 1));
    }
  }

  async csrf() {
    const data = await this.request('GET', '/api/auth/csrf');
    if (!data.csrfToken) throw new Error(`${this.label}: missing CSRF token`);
    this.csrfToken = data.csrfToken;
    return this.csrfToken;
  }

  async request(method, path, body, expected = [200]) {
    if (!Array.isArray(expected)) expected = [expected];
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !this.csrfToken) {
      await this.csrf();
    }

    const headers = { Accept: 'application/json' };
    if (this.cookieHeader()) headers.Cookie = this.cookieHeader();
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    this.storeCookies(response);
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = text; }
    }
    if (!expected.includes(response.status)) {
      throw new Error(`${this.label}: ${method} ${path} returned ${response.status}, expected ${expected.join('/')} :: ${text}`);
    }
    return payload;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function futureIso(daysAhead, hour = 10, minute = 0) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function isoDate(daysAhead) {
  return futureIso(daysAhead).slice(0, 10);
}

async function assertHtml(path) {
  const response = await fetch(`${FRONTEND_URL}${path}`, { redirect: 'manual' });
  const text = await response.text();
  assert(response.status === 200, `Static route ${path} returned ${response.status}`);
  assert(text.includes('<div id="root"></div>') || text.includes('/assets/'), `Static route ${path} did not look like the React app shell`);
}

async function main() {
  const runId = Date.now();
  const password = 'StrongPass123!StrongPass123!';
  const client = new ApiClient('client');
  const professional = new ApiClient('professional');
  const admin = new ApiClient('admin');

  const health = await client.request('GET', '/api/health');
  assert(health.ok === true, 'Health endpoint did not return ok=true');

  await Promise.all([
    assertHtml('/'),
    assertHtml('/search'),
    assertHtml('/auth/login'),
    assertHtml('/client'),
    assertHtml('/professional/onboarding'),
    assertHtml('/admin'),
  ]);

  const proUser = await professional.request('POST', '/api/auth/register', {
    email: `pro-${runId}@probeautylist.test`,
    password,
    firstName: 'Eden',
    lastName: 'Styles',
    phone: '+1 555 010 3000',
    role: 'professional',
  }, 201);
  assert((proUser.user ?? proUser).role === 'professional', 'Professional registration did not return professional role');

  const clientUser = await client.request('POST', '/api/auth/register', {
    email: `client-${runId}@probeautylist.test`,
    password,
    firstName: 'Casey',
    lastName: 'Client',
    phone: '+1 555 010 4000',
    role: 'client',
  }, 201);
  assert((clientUser.user ?? clientUser).role === 'client', 'Client registration did not return client role');

  const adminLogin = await admin.request('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert((adminLogin.user ?? adminLogin).role === 'admin', 'Admin login did not return admin role');
  await admin.csrf();

  await client.request('PATCH', '/api/auth/me', {
    firstName: 'Casey',
    lastName: 'Updated',
    phone: '+1 555 010 4001',
    avatarUrl: 'https://images.example.com/avatar.jpg',
  });
  await client.request('PATCH', '/api/auth/password', {
    currentPassword: password,
    newPassword: 'NewStrongPass123!NewStrongPass123!',
  });
  await client.csrf();
  await client.request('POST', '/api/auth/logout', {});
  await client.csrf();
  await client.request('POST', '/api/auth/login', {
    email: `client-${runId}@probeautylist.test`,
    password: 'NewStrongPass123!NewStrongPass123!',
  });
  await client.csrf();

  const profile = await professional.request('POST', '/api/professionals/me', {
    displayName: `Eden Styles Studio ${runId}`,
    headline: 'Dimensional color and healthy hair specialist',
    bio: 'A careful beauty professional focused on healthy hair color, detailed consultations, and low-stress appointment experiences for every client.',
    category: 'Hair Stylist',
    specialties: ['balayage', 'color correction', 'healthy blonding'],
    city: 'Austin',
    state: 'TX',
    addressLine1: '100 Beauty Lane',
    postalCode: '78701',
    profileImageUrl: 'https://images.example.com/pro.jpg',
    coverImageUrl: 'https://images.example.com/cover.jpg',
    instagramUrl: 'https://instagram.com/example',
    websiteUrl: 'https://example.com',
    licenseLabel: 'TX Cosmetology License 123456',
  }, 201);
  assert(profile.status === 'pending_review' && profile.isVisible === false, 'New professional profile should be pending and hidden');

  const service = await professional.request('POST', '/api/services/me', {
    name: 'Signature Balayage',
    description: 'Consultation, custom lightening, toner, bond treatment, and polished finish.',
    category: 'Hair Stylist',
    durationMinutes: 150,
    priceCents: 22500,
    depositCents: 5000,
    isActive: true,
  }, 201);
  assert(service.id, 'Service creation did not return an id');
  await professional.request('PATCH', `/api/services/${service.id}`, { description: 'Updated balayage package with custom toner and bond treatment.', isActive: true });
  const ownServices = await professional.request('GET', '/api/services/me');
  assert(ownServices.some((item) => item.id === service.id), 'Created service was not listed for professional');

  const bookingDate = new Date(futureIso(14, 15, 0));
  const weekday = bookingDate.getUTCDay();
  await professional.request('PUT', '/api/availability/me', { rules: [{ weekday, startTime: '09:00', endTime: '18:00', isActive: true }] });
  const availability = await professional.request('GET', '/api/availability/me');
  assert(Array.isArray(availability) && availability.length === 1, 'Availability replacement did not persist one rule');
  const exception = await professional.request('POST', '/api/availability/exceptions/me', {
    date: isoDate(30),
    startTime: '12:00',
    endTime: '13:00',
    isBlocked: true,
    reason: 'Lunch block',
  }, 201);
  await professional.request('PATCH', `/api/availability/exceptions/${exception.id}`, { reason: 'Updated lunch block' });
  await professional.request('DELETE', `/api/availability/exceptions/${exception.id}`, undefined, 200);

  await professional.request('PUT', '/api/professionals/me/booking-policy', {
    cancellationWindowHours: 24,
    cancellationFeeCents: 2500,
    depositRequired: true,
    remindersEnabled: true,
    reminderHoursBefore: 24,
    policySummary: 'A deposit is required to reserve appointment time. Please cancel at least twenty-four hours ahead.',
  });
  await professional.request('PUT', '/api/professionals/me/calendar-connections', {
    provider: 'Google Calendar',
    externalCalendarId: `studio-${runId}`,
    status: 'connected',
    syncDirection: 'two_way',
    notes: 'End-to-end sync preference test.',
  });

  const portfolio = await professional.request('POST', '/api/portfolio/me', {
    imageUrl: 'https://images.example.com/after.jpg',
    beforeImageUrl: 'https://images.example.com/before.jpg',
    afterImageUrl: 'https://images.example.com/after.jpg',
    caption: 'Soft blonde refresh with blended grow-out.',
    category: 'hair',
    serviceTags: ['balayage', 'blonde'],
    transformationNotes: 'Lifted mids and ends while protecting hair integrity.',
    isVisible: true,
    sortOrder: 1,
  }, 201);
  await professional.request('PATCH', `/api/portfolio/${portfolio.id}`, { caption: 'Soft blonde refresh with polished finish.' });

  const pendingProfiles = await admin.request('GET', '/api/admin/professionals/pending');
  assert(pendingProfiles.some((item) => item.id === profile.id), 'Pending admin queue did not include created profile');
  const approved = await admin.request('POST', `/api/admin/professionals/${profile.id}/approve`, { note: 'E2E approval for local test profile.' });
  assert(approved.status === 'approved' && approved.isVisible === true, 'Admin approval did not publish profile');

  const searchResults = await client.request('GET', '/api/professionals?category=Hair%20Stylist&city=Austin&state=TX&specialty=balayage&hasPortfolio=true&sort=recommended');
  assert(searchResults.some((item) => item.id === profile.id), 'Approved profile was not discoverable by enriched search');
  const publicProfile = await client.request('GET', `/api/professionals/${approved.slug}`);
  assert(publicProfile.id === profile.id, 'Public profile slug endpoint did not return the approved profile');
  const publicServices = await client.request('GET', `/api/services/professional/${profile.id}`);
  assert(publicServices.some((item) => item.id === service.id), 'Public services did not include active service');
  const publicPortfolio = await client.request('GET', `/api/portfolio/professional/${profile.id}`);
  assert(publicPortfolio.some((item) => item.id === portfolio.id), 'Public portfolio did not include visible portfolio item');
  const publicAvailability = await client.request('GET', `/api/availability/professional/${profile.id}`);
  assert(publicAvailability.rules.length > 0, 'Public availability did not include active rules');

  await client.request('POST', `/api/favorites/${profile.id}`, {}, 201);
  const favorites = await client.request('GET', '/api/favorites');
  assert(favorites.some((item) => item.professional.id === profile.id), 'Favorite was not listed after saving');

  const savedSearch = await client.request('POST', '/api/discovery/saved-searches', {
    name: 'Austin balayage pros',
    query: 'balayage',
    category: 'Hair Stylist',
    city: 'Austin',
    state: 'TX',
    maxPriceCents: 30000,
    notifyOnNewMatches: true,
  }, 201);
  const savedSearches = await client.request('GET', '/api/discovery/saved-searches');
  assert(savedSearches.some((item) => item.id === savedSearch.id), 'Saved search was not listed');
  await client.request('PATCH', `/api/discovery/saved-searches/${savedSearch.id}/viewed`, {});
  const recommendations = await client.request('GET', '/api/discovery/recommendations?limit=6');
  assert(Array.isArray(recommendations), 'Recommendations endpoint did not return an array');

  const policy = await client.request('GET', `/api/bookings/policies/${profile.id}`);
  assert(policy.depositRequired === true, 'Booking policy endpoint did not return professional policy');
  const booking = await client.request('POST', '/api/bookings', {
    professionalId: profile.id,
    serviceId: service.id,
    startsAt: bookingDate.toISOString(),
    clientNote: 'Looking for a blended result for this end-to-end test.',
    policyAccepted: true,
    reminderOptIn: true,
  }, 201);
  assert(booking.status === 'pending', 'New booking should start pending');

  const proBookings = await professional.request('GET', '/api/bookings');
  assert(proBookings.some((item) => item.id === booking.id), 'Professional bookings list did not include new booking');
  const confirmed = await professional.request('PATCH', `/api/bookings/${booking.id}/status`, { status: 'confirmed', professionalNote: 'Confirmed by E2E.' });
  assert(confirmed.status === 'confirmed', 'Professional could not confirm booking');

  const reschedule = await client.request('POST', `/api/bookings/${booking.id}/reschedule-requests`, {
    proposedStartsAt: futureIso(15, 16, 0),
    note: 'Can we move one day later?',
  }, 201);
  await professional.request('PATCH', `/api/bookings/${booking.id}/reschedule-requests/${reschedule.id}`, { status: 'accepted' });

  const clientMessage = await client.request('POST', `/api/messages/booking/${booking.id}`, { body: 'Thanks for confirming the appointment.' }, 201);
  assert(clientMessage.id, 'Client message was not created');
  const proThread = await professional.request('GET', `/api/messages/booking/${booking.id}`);
  assert(proThread.some((item) => item.id === clientMessage.id), 'Professional could not read booking message thread');
  await professional.request('POST', `/api/messages/booking/${booking.id}`, { body: 'You are welcome. See you soon.' }, 201);

  const completed = await professional.request('PATCH', `/api/bookings/${booking.id}/status`, { status: 'completed', professionalNote: 'Completed by E2E.' });
  assert(completed.status === 'completed', 'Professional could not complete booking');

  const review = await client.request('POST', '/api/reviews', {
    bookingId: booking.id,
    rating: 5,
    cleanlinessRating: 5,
    communicationRating: 5,
    valueRating: 4,
    wouldRecommend: true,
    photoUrls: ['https://images.example.com/review.jpg'],
    comment: 'Great communication, clean workspace, and beautiful color result.',
  }, 201);
  assert(review.id, 'Review was not created');
  const publicReviews = await client.request('GET', `/api/reviews/professional/${profile.id}`);
  assert(publicReviews.some((item) => item.id === review.id), 'Public reviews did not include submitted review');

  const dispute = await client.request('POST', '/api/disputes', {
    bookingId: booking.id,
    reason: 'Follow up question',
    details: 'Opening a test dispute to validate the full admin operations and resolution workflow.',
  }, 201);
  const adminDisputes = await admin.request('GET', '/api/disputes');
  assert(adminDisputes.some((item) => item.id === dispute.id), 'Admin disputes list did not include created dispute');
  const resolved = await admin.request('PATCH', `/api/disputes/${dispute.id}`, {
    status: 'resolved',
    resolutionNote: 'Resolved during end-to-end verification.',
  });
  assert(resolved.status === 'resolved', 'Admin could not resolve dispute');

  const clientNotifications = await client.request('GET', '/api/notifications?limit=25');
  assert(Array.isArray(clientNotifications), 'Client notifications endpoint did not return an array');
  const unreadCount = await client.request('GET', '/api/notifications/unread-count');
  assert(typeof unreadCount.count === 'number', 'Unread notification count was not numeric');
  if (clientNotifications[0]) await client.request('PATCH', `/api/notifications/${clientNotifications[0].id}/read`, {});
  await client.request('PATCH', '/api/notifications/read-all', {});

  const analytics = await admin.request('GET', '/api/admin/analytics');
  assert(analytics.thirtyDayCompletedBookings >= 1, 'Admin analytics did not include completed booking');
  const operations = await admin.request('GET', '/api/admin/operations');
  assert(Array.isArray(operations.openDisputes), 'Admin operations did not return openDisputes array');
  const stats = await admin.request('GET', '/api/admin/stats');
  assert(stats.users >= 3, 'Admin stats did not include created users');
  await admin.request('GET', '/api/admin/users');
  await admin.request('GET', '/api/admin/actions');

  await client.request('DELETE', `/api/favorites/${profile.id}`, undefined, 200);
  await client.request('DELETE', `/api/discovery/saved-searches/${savedSearch.id}`, undefined, 200);

  await Promise.all([
    assertHtml('/client/bookings'),
    assertHtml('/client/favorites'),
    assertHtml('/client/saved-searches'),
    assertHtml('/professional/profile'),
    assertHtml('/professional/services'),
    assertHtml('/professional/availability'),
    assertHtml('/professional/operations'),
    assertHtml('/professional/portfolio'),
    assertHtml('/professional/bookings'),
    assertHtml('/notifications'),
    assertHtml('/account'),
  ]);

  console.log(JSON.stringify({
    ok: true,
    runId,
    profileId: profile.id,
    serviceId: service.id,
    bookingId: booking.id,
    reviewId: review.id,
    disputeId: dispute.id,
    checked: {
      auth: true,
      professionalProfile: true,
      adminModeration: true,
      services: true,
      availability: true,
      operations: true,
      portfolio: true,
      search: true,
      favorites: true,
      savedSearches: true,
      recommendations: true,
      bookingLifecycle: true,
      messages: true,
      reviews: true,
      disputes: true,
      notifications: true,
      adminAnalytics: true,
      staticRoutes: true,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
