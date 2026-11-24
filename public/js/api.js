// RENTORA – API Client & State Store
const API_BASE = '/api';

export const RentoraAPI = {
  getToken() {
    return localStorage.getItem('rentora_token') || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('rentora_token', token);
    } else {
      localStorage.removeItem('rentora_token');
    }
  },

  getUser() {
    const raw = localStorage.getItem('rentora_user');
    return raw ? JSON.parse(raw) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('rentora_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rentora_user');
    }
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error.message);
      throw error;
    }
  },

  // Auth Endpoints
  register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Property Endpoints
  getProperties(queryParams = {}) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    }
    return this.request(`/properties?${searchParams.toString()}`);
  },

  getFeaturedProperties() {
    return this.request('/properties/sponsored/featured');
  },

  getPropertyById(id) {
    return this.request(`/properties/${id}`);
  },

  getSellerListings() {
    return this.request('/properties/seller/my-listings');
  },

  createProperty(propertyData) {
    return this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  },

  updateProperty(id, propertyData) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  },

  updatePropertyStatus(id, status) {
    return this.request(`/properties/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  togglePropertySponsor(id) {
    return this.request(`/properties/${id}/sponsor`, {
      method: 'POST',
    });
  },

  deleteProperty(id) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  },

  // Enquiries
  sendEnquiry(enquiryData) {
    return this.request('/enquiries', {
      method: 'POST',
      body: JSON.stringify(enquiryData),
    });
  },

  getCustomerEnquiries() {
    return this.request('/enquiries/customer');
  },

  getSellerEnquiries() {
    return this.request('/enquiries/seller');
  },

  updateEnquiryStatus(id, status, sellerResponse = '') {
    return this.request(`/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, sellerResponse }),
    });
  },

  // Visits
  scheduleVisit(visitData) {
    return this.request('/visits', {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
  },

  getCustomerVisits() {
    return this.request('/visits/customer');
  },

  getSellerVisits() {
    return this.request('/visits/seller');
  },

  updateVisitStatus(id, status, sellerNotes = '') {
    return this.request(`/visits/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, sellerNotes }),
    });
  },

  // Favourites
  toggleFavourite(propertyId) {
    return this.request(`/favourites/${propertyId}`, {
      method: 'POST',
    });
  },

  getFavourites() {
    return this.request('/favourites');
  },

  // Subscriptions & Payments
  getSubscriptionPlans() {
    return this.request('/subscriptions/plans');
  },

  getMySubscription() {
    return this.request('/subscriptions/my-subscription');
  },

  createPaymentOrder(plan, billingCycle = 'monthly') {
    return this.request('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan, billingCycle }),
    });
  },

  verifyPayment(verificationData) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  },

  getPaymentHistory() {
    return this.request('/payments/history');
  },

  // Reports & Notifications
  reportListing(propertyId, reason, details = '') {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({ propertyId, reason, details }),
    });
  },

  getNotifications() {
    return this.request('/notifications');
  },

  markNotificationsRead(notificationId = null) {
    return this.request('/notifications/mark-read', {
      method: 'PATCH',
      body: JSON.stringify({ notificationId }),
    });
  },

  // Admin Endpoints
  getAdminMetrics() {
    return this.request('/admin/metrics');
  },

  getAdminUsers(role = '') {
    return this.request(`/admin/users${role ? `?role=${role}` : ''}`);
  },

  toggleUserVerification(userId) {
    return this.request(`/admin/users/${userId}/verify`, {
      method: 'PATCH',
    });
  },

  getAdminProperties(queryParams = {}) {
    const searchParams = new URLSearchParams(queryParams);
    return this.request(`/admin/properties?${searchParams.toString()}`);
  },

  moderateProperty(id, moderationData) {
    return this.request(`/admin/properties/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify(moderationData),
    });
  },

  getAdminPayments() {
    return this.request('/admin/payments');
  },

  getAdminReports() {
    return this.request('/admin/reports');
  },

  updateReportStatus(reportId, status, adminAction = '') {
    return this.request(`/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminAction }),
    });
  },
};

// UI Helper: Toast Notifications
export function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === 'success' ? '✓' : 'ℹ'}</span>
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Format Currency to INR (e.g. ₹8,500)
export function formatINR(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN');
}
