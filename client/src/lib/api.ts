export async function apiRequest(method: string, url: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function login(username: string, password: string) {
  return apiRequest('POST', '/api/auth/login', { username, password });
}

export async function register(username: string, email: string, password: string, role: string = 'client', firstName?: string, lastName?: string) {
  return apiRequest('POST', '/api/auth/register', { username, email, password, role, firstName, lastName });
}

export async function logout() {
  return apiRequest('POST', '/api/auth/logout');
}

export async function getCurrentUser() {
  try {
    return await apiRequest('GET', '/api/auth/me');
  } catch (error) {
    return null;
  }
}

export async function getBusinesses() {
  return apiRequest('GET', '/api/businesses');
}

export async function getBusiness(id: string) {
  return apiRequest('GET', `/api/businesses/${id}`);
}

export async function createBusiness(data: any) {
  return apiRequest('POST', '/api/businesses', data);
}

export async function updateBusiness(id: string, data: any) {
  return apiRequest('PATCH', `/api/businesses/${id}`, data);
}

export async function approveBusiness(id: string) {
  return apiRequest('POST', `/api/businesses/${id}/approve`);
}

export async function createBooking(data: any) {
  return apiRequest('POST', '/api/bookings', data);
}

export async function getBookings() {
  return apiRequest('GET', '/api/bookings');
}

export async function markBookingCompleted(id: string) {
  return apiRequest('PATCH', `/api/bookings/${id}/complete`);
}

export async function getReviews(businessId: string) {
  return apiRequest('GET', `/api/businesses/${businessId}/reviews`);
}

export async function createReview(data: any) {
  return apiRequest('POST', '/api/reviews', data);
}

export async function getPortfolio(businessId: string) {
  return apiRequest('GET', `/api/businesses/${businessId}/portfolio`);
}

export async function createPortfolioItem(data: any) {
  return apiRequest('POST', '/api/portfolio', data);
}

export async function toggleLike(itemId: string) {
  return apiRequest('POST', `/api/portfolio/${itemId}/like`);
}

export async function getComments(itemId: string) {
  return apiRequest('GET', `/api/portfolio/${itemId}/comments`);
}

export async function createComment(itemId: string, comment: string) {
  return apiRequest('POST', `/api/portfolio/${itemId}/comments`, { comment });
}

export async function getMessages(userId: string) {
  return apiRequest('GET', `/api/messages/${userId}`);
}

export async function sendMessage(data: any) {
  return apiRequest('POST', `/api/messages`, data);
}

export async function createPaymentIntent(amount: number, businessId: string) {
  return apiRequest('POST', '/api/stripe/create-payment-intent', { amount, businessId });
}

export async function createSubscriptionCheckout(businessId: string, tier: string) {
  return apiRequest('POST', '/api/stripe/create-subscription-checkout', { businessId, tier });
}
