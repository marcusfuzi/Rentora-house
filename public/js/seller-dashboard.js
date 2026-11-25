import { RentoraAPI, formatINR, showToast } from './api.js';
import { getCurrentUser } from './auth.js';

export async function renderSellerDashboard() {
  const container = document.getElementById('dashboardViewContent');
  if (!container) return;

  const user = getCurrentUser();
  if (!user || user.role !== 'seller') {
    showToast('Please log in with a Seller account to access the Landlord Portal', 'danger');
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="dashboard-container">
      <div class="container">
        <!-- Dashboard Top Breadcrumb Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <a href="#/" class="btn btn-sm btn-ghost" style="color:var(--navy-700); font-weight:700;">
            ← Back to Marketplace / Home
          </a>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.8rem; color:var(--text-muted);">Quick Switch Role:</span>
            <button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:4px 10px;" onclick="window.triggerDemoLogin('customer')">
              Switch to Tenant (Customer)
            </button>
            <button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:4px 10px;" onclick="window.triggerDemoLogin('admin')">
              Switch to Admin
            </button>
          </div>
        </div>

        <!-- Seller Dashboard Header -->
        <div class="dashboard-header">
          <div class="dashboard-header-pattern"></div>
          <div class="dashboard-user-info">
            <div class="dashboard-avatar-large" style="display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:800; color:#FFFFFF;">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="dashboard-welcome">
              <h2>${user.name}'s Landlord Dashboard</h2>
              <p>Active Subscription: <strong style="color:var(--coral-500); text-transform:uppercase;">${user.subscription?.plan || 'Free'} Plan</strong> • ${user.phone || user.email}</p>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="window.openAddPropertyModal()">
              ➕ List New Property
            </button>
            <button class="btn btn-outline" style="color:#FFFFFF; border-color:rgba(255,255,255,0.3);" onclick="window.switchSellerTab('subscription')">
              ⭐ Manage Subscription
            </button>
            <button onclick="window.logoutUser()" class="btn btn-sm" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700; padding:8px 16px;">
              🚪 Logout
            </button>
          </div>
        </div>

        <!-- Metrics Overview Grid -->
        <div class="metrics-grid" id="sellerMetricsGrid">
          <div class="metric-card">
            <div class="metric-data">
              <h4>Total Listings</h4>
              <p id="metricTotalProps">--</p>
            </div>
            <div class="metric-icon-box navy">🏠</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Active Rentals</h4>
              <p id="metricActiveProps">--</p>
            </div>
            <div class="metric-icon-box teal">🟢</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Total Property Views</h4>
              <p id="metricTotalViews">--</p>
            </div>
            <div class="metric-icon-box coral">👁️</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Tenant Inquiries</h4>
              <p id="metricTotalEnquiries">--</p>
            </div>
            <div class="metric-icon-box amber">✉️</div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="dashboard-tabs-bar">
          <button class="dash-tab-btn active" data-tab="listings" onclick="window.switchSellerTab('listings')">
            🏢 My Properties (<span id="sellerListingsCount">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="enquiries" onclick="window.switchSellerTab('enquiries')">
            📬 Incoming Enquiries (<span id="sellerEnquiriesCount">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="visits" onclick="window.switchSellerTab('visits')">
            📅 Visit Requests (<span id="sellerVisitsCount">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="subscription" onclick="window.switchSellerTab('subscription')">
            💳 Subscription & Ads Plan
          </button>
        </div>

        <!-- Tab Content -->
        <div id="sellerTabContent">
          <div style="text-align:center; padding:40px;">Loading landlord workspace...</div>
        </div>
      </div>
    </div>
  `;

  // Preload secondary counts in background
  preloadSellerCounts();

  // Load default listings
  loadSellerListings();
}

async function preloadSellerCounts() {
  try {
    const [enqRes, visRes] = await Promise.all([
      RentoraAPI.getSellerEnquiries().catch(() => ({ data: [] })),
      RentoraAPI.getSellerVisits().catch(() => ({ data: [] })),
    ]);

    const enqBadge = document.getElementById('sellerEnquiriesCount');
    const visBadge = document.getElementById('sellerVisitsCount');
    if (enqBadge) enqBadge.textContent = enqRes.data?.length || 0;
    if (visBadge) visBadge.textContent = visRes.data?.length || 0;
  } catch (err) {
    // Ignore
  }
}

window.switchSellerTab = function (tabName) {
  const tabBtns = document.querySelectorAll('.dash-tab-btn');
  tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));

  if (tabName === 'listings') {
    loadSellerListings();
  } else if (tabName === 'enquiries') {
    loadSellerEnquiries();
  } else if (tabName === 'visits') {
    loadSellerVisits();
  } else if (tabName === 'subscription') {
    loadSellerSubscription();
  }
};

async function loadSellerListings() {
  const content = document.getElementById('sellerTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getSellerListings();
    const stats = res.stats || {};
    const properties = res.data || [];

    // Update metrics
    const metricTotalProps = document.getElementById('metricTotalProps');
    const metricActiveProps = document.getElementById('metricActiveProps');
    const metricTotalViews = document.getElementById('metricTotalViews');
    const metricTotalEnquiries = document.getElementById('metricTotalEnquiries');
    const listingsCountBadge = document.getElementById('sellerListingsCount');

    if (metricTotalProps) metricTotalProps.textContent = stats.totalListings || 0;
    if (metricActiveProps) metricActiveProps.textContent = stats.activeListings || 0;
    if (metricTotalViews) metricTotalViews.textContent = stats.totalViews || 0;
    if (metricTotalEnquiries) metricTotalEnquiries.textContent = stats.totalEnquiries || 0;
    if (listingsCountBadge) listingsCountBadge.textContent = properties.length;

    if (properties.length === 0) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">🏠</div>
          <h3 class="empty-state-title">You haven't listed any properties yet</h3>
          <p class="empty-state-desc">Start receiving tenant enquiries by posting your house, flat, or apartment on Rentora.</p>
          <button class="btn btn-primary" onclick="window.openAddPropertyModal()">+ Add Your First Property</button>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Property Details</th>
              <th>Rent / Deposit</th>
              <th>Type & BHK</th>
              <th>Status</th>
              <th>Sponsored Ad</th>
              <th>Views & Leads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${properties
              .map((p) => {
                const statusBadge =
                  p.status === 'active'
                    ? '<span class="badge badge-success">Active</span>'
                    : p.status === 'rented'
                    ? '<span class="badge badge-navy">Rented Out</span>'
                    : '<span class="badge" style="background:#FEE2E2; color:#EF4444;">Inactive</span>';

                const sponsorBtn = p.isSponsored
                  ? `<button class="btn btn-sm btn-outline" style="border-color:#F59E0B; color:#B45309;" onclick="window.toggleListingSponsor('${p._id}')">⭐ Sponsored (Active)</button>`
                  : `<button class="btn btn-sm btn-outline" onclick="window.toggleListingSponsor('${p._id}')">🚀 Promote Listing</button>`;

                return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                      <img src="${p.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=200'}" style="width:54px; height:54px; border-radius:8px; object-fit:cover;" alt="Prop"/>
                      <div>
                        <strong>${p.title}</strong><br/>
                        <span style="font-size:0.8rem; color:var(--text-muted);">📍 ${p.location?.locality}, ${p.location?.city}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>${formatINR(p.rent)}/mo</strong><br/>
                    <small style="color:var(--text-muted);">Deposit: ${formatINR(p.securityDeposit)}</small>
                  </td>
                  <td>${p.bhk} • ${p.propertyType}</td>
                  <td>${statusBadge}</td>
                  <td>${sponsorBtn}</td>
                  <td>
                    👁️ ${p.viewsCount || 0} views<br/>
                    ✉️ ${p.enquiriesCount || 0} enquiries
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-sm btn-ghost" title="Mark Rented/Active" onclick="window.toggleListingStatus('${p._id}', '${p.status === 'active' ? 'rented' : 'active'}')">
                        ${p.status === 'active' ? 'Mark Rented' : 'Activate'}
                      </button>
                      <button class="btn btn-sm btn-ghost" title="View" onclick="window.viewPropertyDetails('${p._id}')">
                        View
                      </button>
                      <button class="btn btn-sm btn-ghost" style="color:#EF4444;" title="Delete" onclick="window.deleteSellerListing('${p._id}')">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load properties: ${err.message}</p>`;
  }
}

async function loadSellerEnquiries() {
  const content = document.getElementById('sellerTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getSellerEnquiries();
    const enquiries = res.data || [];
    const enqBadge = document.getElementById('sellerEnquiriesCount');
    if (enqBadge) enqBadge.textContent = enquiries.length;

    if (enquiries.length === 0) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">✉️</div>
          <h3 class="empty-state-title">No tenant enquiries yet</h3>
          <p class="empty-state-desc">When prospective tenants submit an inquiry for your properties, they will appear here with contact numbers and move-in dates.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Tenant Name & Contacts</th>
              <th>Tenant Type / Move-in</th>
              <th>Tenant Message</th>
              <th>Status & Action</th>
            </tr>
          </thead>
          <tbody>
            ${enquiries
              .map((e) => {
                const statusBadge =
                  e.status === 'accepted'
                    ? '<span class="badge badge-success">Accepted</span>'
                    : e.status === 'rejected'
                    ? '<span class="badge" style="background:#FEE2E2; color:#EF4444;">Declined</span>'
                    : '<span class="badge" style="background:#FEF3C7; color:#D97706;">Pending</span>';

                return `
                <tr>
                  <td>
                    <strong>${e.property?.title || 'Property'}</strong><br/>
                    <small style="color:var(--text-muted);">${e.property?.bhk} • ${formatINR(e.property?.rent)}/mo</small>
                  </td>
                  <td>
                    <strong>${e.fullName}</strong><br/>
                    📞 <a href="tel:${e.phone}" style="color:var(--coral-500); font-weight:600;">${e.phone}</a><br/>
                    ✉️ ${e.email}
                  </td>
                  <td>
                    <span class="badge badge-navy">${e.tenantType} (${e.occupantsCount} occupants)</span><br/>
                    <small style="color:var(--text-muted);">Move-in: ${new Date(e.moveInDate).toLocaleDateString()}</small>
                  </td>
                  <td style="max-width:280px;">
                    <p style="font-size:0.85rem; line-height:1.4;">${e.message}</p>
                    ${e.sellerResponse ? `<small style="color:var(--teal-600); font-weight:600;">Your Reply: ${e.sellerResponse}</small>` : ''}
                  </td>
                  <td>
                    <div style="margin-bottom:8px;">${statusBadge}</div>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-sm btn-primary" onclick="window.respondToEnquiry('${e._id}', 'accepted')">Accept</button>
                      <button class="btn btn-sm btn-outline" onclick="window.respondToEnquiry('${e._id}', 'rejected')">Decline</button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load enquiries: ${err.message}</p>`;
  }
}

async function loadSellerVisits() {
  const content = document.getElementById('sellerTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getSellerVisits();
    const visits = res.data || [];
    const visBadge = document.getElementById('sellerVisitsCount');
    if (visBadge) visBadge.textContent = visits.length;

    if (visits.length === 0) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">📅</div>
          <h3 class="empty-state-title">No visit appointments</h3>
          <p class="empty-state-desc">Tenant requests for in-person or virtual property tours will show up here.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Tenant</th>
              <th>Visit Mode</th>
              <th>Requested Slot</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${visits
              .map((v) => {
                const statusBadge =
                  v.status === 'confirmed'
                    ? '<span class="badge badge-success">Confirmed</span>'
                    : v.status === 'completed'
                    ? '<span class="badge badge-navy">Completed</span>'
                    : v.status === 'cancelled'
                    ? '<span class="badge" style="background:#FEE2E2; color:#EF4444;">Cancelled</span>'
                    : '<span class="badge" style="background:#FEF3C7; color:#D97706;">Requested</span>';

                return `
                <tr>
                  <td><strong>${v.property?.title || 'Property'}</strong></td>
                  <td>${v.customer?.name || 'Tenant'}<br/>📞 ${v.customer?.phone || 'N/A'}</td>
                  <td><span class="badge badge-navy">${v.visitType}</span></td>
                  <td><strong>${new Date(v.preferredDate).toLocaleDateString()}</strong><br/>${v.timeSlot}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-sm btn-primary" onclick="window.updateVisitStatus('${v._id}', 'confirmed')">Confirm</button>
                      <button class="btn btn-sm btn-outline" onclick="window.updateVisitStatus('${v._id}', 'completed')">Done</button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load visits: ${err.message}</p>`;
  }
}

async function loadSellerSubscription() {
  const content = document.getElementById('sellerTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getMySubscription();
    const sub = res.subscription || {};
    const plan = sub.planDetails || {};

    content.innerHTML = `
      <!-- Active Subscription Status Banner -->
      <div style="background:#FFFFFF; border-radius:var(--radius-xl); border:1.5px solid var(--border-light); padding:32px; box-shadow:var(--shadow-sm); margin-bottom:40px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; border-bottom:1px solid var(--border-light); padding-bottom:24px; margin-bottom:24px;">
          <div>
            <div style="font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Current Active Plan</div>
            <h2 style="font-size:2rem; font-weight:800; color:var(--navy-900); display:flex; align-items:center; gap:12px;">
              ${plan.name || 'Free Starter'}
              <span class="badge ${sub.plan === 'premium' ? 'badge-sponsored' : sub.plan === 'pro' ? 'badge-verified' : 'badge-navy'}">
                ${sub.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </h2>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.1rem; font-weight:800; color:var(--navy-900);">${sub.daysRemaining || 0} Days Remaining</div>
            <small style="color:var(--text-muted);">Renews on ${new Date(sub.endDate).toLocaleDateString()}</small>
          </div>
        </div>

        <!-- Limits Matrix -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
          <div style="padding:16px; background:var(--navy-50); border-radius:var(--radius-md);">
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">ACTIVE PROPERTY LISTINGS</div>
            <div style="font-size:1.5rem; font-weight:800; color:var(--navy-900);">${sub.listingLimit || 2} Max Allowed</div>
          </div>
          <div style="padding:16px; background:var(--navy-50); border-radius:var(--radius-md);">
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">SPONSORED AD SLOTS</div>
            <div style="font-size:1.5rem; font-weight:800; color:var(--coral-500);">${sub.sponsoredSlotsUsed || 0} / ${sub.sponsoredSlots || 0} Used</div>
          </div>
          <div style="padding:16px; background:var(--navy-50); border-radius:var(--radius-md);">
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">SEARCH VISIBILITY</div>
            <div style="font-size:1.2rem; font-weight:700; color:var(--navy-900);">
              ${sub.plan === 'premium' ? '🔥 10x Top Placement' : sub.plan === 'pro' ? '⚡ 3x High Boost' : 'Standard'}
            </div>
          </div>
        </div>
      </div>

      <!-- Upgrade Subscription Plans Grid -->
      <div class="pricing-header">
        <h2>Upgrade Your Landlord Subscription</h2>
        <p style="color:var(--text-secondary);">Unlock priority sponsored placements, unlimited rental listings, and verified landlord credibility.</p>
      </div>

      <div class="pricing-cards-grid">
        <!-- Free Starter -->
        <div class="pricing-card">
          <div class="pricing-plan-name">Free Starter</div>
          <div class="pricing-plan-price">₹0 <span class="period">/month</span></div>
          <div class="pricing-plan-desc">Essential plan for homeowners renting out 1 or 2 properties.</div>
          <ul class="pricing-features-list">
            <li class="pricing-feature-item">✓ 2 Active Property Listings</li>
            <li class="pricing-feature-item">✓ Standard Search Visibility</li>
            <li class="pricing-feature-item">✓ Customer Enquiries Inbox</li>
            <li class="pricing-feature-item">✓ Basic Performance Analytics</li>
          </ul>
          <button class="btn btn-outline" disabled>Current Base Plan</button>
        </div>

        <!-- Pro Landlord -->
        <div class="pricing-card is-popular">
          <div class="popular-ribbon">Most Popular</div>
          <div class="pricing-plan-name">Pro Landlord</div>
          <div class="pricing-plan-price">₹999 <span class="period">/month</span></div>
          <div class="pricing-plan-desc">For serious landlords seeking faster tenant occupancy and verified badges.</div>
          <ul class="pricing-features-list">
            <li class="pricing-feature-item">✓ <strong>10 Active Property Listings</strong></li>
            <li class="pricing-feature-item">✓ <strong>2 Sponsored Ad Slots Included</strong></li>
            <li class="pricing-feature-item">✓ <strong>Verified Landlord Badge</strong></li>
            <li class="pricing-feature-item">✓ 3x Higher Search Visibility</li>
            <li class="pricing-feature-item">✓ Priority Customer Inquiries</li>
            <li class="pricing-feature-item">✓ View & Click Lead Analytics</li>
          </ul>
          <button class="btn btn-primary" onclick="window.startRazorpayCheckout('pro', 999)">
            Upgrade to Pro (₹999)
          </button>
        </div>

        <!-- Premium Enterprise -->
        <div class="pricing-card">
          <div class="pricing-plan-name">Premium Enterprise</div>
          <div class="pricing-plan-price">₹2,499 <span class="period">/month</span></div>
          <div class="pricing-plan-desc">Maximum visibility for real estate brokers and multi-property landlords.</div>
          <ul class="pricing-features-list">
            <li class="pricing-feature-item">✓ <strong>Unlimited Active Listings</strong></li>
            <li class="pricing-feature-item">✓ <strong>6 Sponsored Ad Slots Included</strong></li>
            <li class="pricing-feature-item">✓ <strong>Exclusive Gold Partner Badge</strong></li>
            <li class="pricing-feature-item">✓ Top Placement in Search Results</li>
            <li class="pricing-feature-item">✓ Instant SMS & WhatsApp Tenant Alerts</li>
            <li class="pricing-feature-item">✓ Dedicated Account Manager</li>
          </ul>
          <button class="btn btn-navy" onclick="window.startRazorpayCheckout('premium', 2499)">
            Upgrade to Premium (₹2,499)
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load subscription: ${err.message}</p>`;
  }
}

// Listing CRUD Actions
window.toggleListingStatus = async function (propertyId, newStatus) {
  try {
    await RentoraAPI.updatePropertyStatus(propertyId, newStatus);
    showToast(`Property marked as ${newStatus}!`);
    loadSellerListings();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

window.toggleListingSponsor = async function (propertyId) {
  try {
    const res = await RentoraAPI.togglePropertySponsor(propertyId);
    showToast(res.message);
    loadSellerListings();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

window.deleteSellerListing = async function (propertyId) {
  if (!confirm('Are you sure you want to remove this property listing permanently?')) return;
  try {
    await RentoraAPI.deleteProperty(propertyId);
    showToast('Listing removed successfully');
    loadSellerListings();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

// Enquiry Response
window.respondToEnquiry = async function (enquiryId, status) {
  const replyNote = prompt(
    `Enter a response note for the prospective tenant (${status.toUpperCase()}):`,
    status === 'accepted' ? 'We would love to show you the property. Please call me to fix a time.' : 'Sorry, the property is currently under token booking.'
  );

  if (replyNote === null) return;

  try {
    await RentoraAPI.updateEnquiryStatus(enquiryId, status, replyNote);
    showToast(`Enquiry marked as ${status.toUpperCase()}!`);
    loadSellerEnquiries();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

// Visit Status
window.updateVisitStatus = async function (visitId, status) {
  try {
    await RentoraAPI.updateVisitStatus(visitId, status, 'Confirmed by Landlord');
    showToast(`Visit marked as ${status}!`);
    loadSellerVisits();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

// Open Add Property Modal
window.openAddPropertyModal = function () {
  const modal = document.getElementById('addPropertyModal');
  if (modal) modal.classList.add('active');
};

// Razorpay Modal Checkout Workflow
window.startRazorpayCheckout = async function (planKey, amountINR) {
  try {
    const orderRes = await RentoraAPI.createPaymentOrder(planKey, 'monthly');
    const order = orderRes.order;

    // Simulated / Test Mode Razorpay Checkout Flow Modal
    const checkoutModal = document.getElementById('paymentCheckoutModal');
    const checkoutDetails = document.getElementById('paymentCheckoutDetails');
    if (!checkoutModal || !checkoutDetails) return;

    checkoutDetails.innerHTML = `
      <div style="text-align:center; padding:10px 0 20px;">
        <div style="width:60px; height:60px; border-radius:50%; background:#E0F2FE; color:#0284C7; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 12px;">
          💳
        </div>
        <h3 style="font-size:1.4rem; font-weight:800; color:var(--navy-900);">Razorpay Secure Checkout</h3>
        <span class="badge badge-navy" style="margin-top:6px;">TEST MODE ENABLED</span>
      </div>

      <div style="background:var(--navy-50); border-radius:var(--radius-lg); padding:20px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span style="color:var(--text-secondary); font-weight:600;">Selected Plan:</span>
          <strong style="color:var(--navy-900); text-transform:uppercase;">${planKey} Plan</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span style="color:var(--text-secondary); font-weight:600;">Billing Term:</span>
          <strong style="color:var(--navy-900);">Monthly Subscription</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <span style="color:var(--text-secondary); font-weight:600;">Order ID:</span>
          <span style="font-family:monospace; font-size:0.85rem;">${order.id}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-light); padding-top:10px; margin-top:10px;">
          <span style="font-weight:700; color:var(--navy-900);">Total Payable:</span>
          <span style="font-size:1.4rem; font-weight:800; color:var(--navy-900);">${formatINR(amountINR)}</span>
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <label class="form-label">Select Test Payment Method</label>
        <select id="testPaymentMethod" class="form-control">
          <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
          <option value="Card">Visa / MasterCard Debit / Credit Card</option>
          <option value="NetBanking">HDFC / ICICI / SBI NetBanking</option>
        </select>
      </div>

      <button class="btn btn-primary" style="width:100%; justify-content:center; padding:14px; font-size:1.05rem;" id="confirmPaymentBtn">
        Pay ${formatINR(amountINR)} & Activate Subscription
      </button>
    `;

    checkoutModal.classList.add('active');

    document.getElementById('confirmPaymentBtn')?.addEventListener('click', async () => {
      try {
        const payBtn = document.getElementById('confirmPaymentBtn');
        payBtn.disabled = true;
        payBtn.textContent = 'Verifying Transaction with Razorpay...';

        const verifyRes = await RentoraAPI.verifyPayment({
          razorpayOrderId: order.id,
          razorpayPaymentId: `pay_${Date.now().toString(36)}`,
          razorpaySignature: 'simulated_test_sig',
          plan: planKey,
          billingCycle: 'monthly',
        });

        checkoutModal.classList.remove('active');
        showToast(verifyRes.message);

        // Update local user state
        const me = await RentoraAPI.getMe();
        RentoraAPI.setUser(me.user);

        loadSellerSubscription();
      } catch (payErr) {
        showToast(payErr.message, 'danger');
      }
    });
  } catch (err) {
    showToast(err.message, 'danger');
  }
};
