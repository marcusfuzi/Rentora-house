import { RentoraAPI, formatINR, showToast } from './api.js';
import { getCurrentUser } from './auth.js';

export async function renderAdminDashboard() {
  const container = document.getElementById('dashboardViewContent');
  if (!container) return;

  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    showToast('Admin clearance required', 'danger');
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
            <button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:4px 10px;" onclick="window.triggerDemoLogin('seller')">
              Switch to Landlord (Pro)
            </button>
            <button class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:4px 10px;" onclick="window.triggerDemoLogin('customer')">
              Switch to Tenant
            </button>
          </div>
        </div>

        <!-- Admin Dashboard Header -->
        <div class="dashboard-header" style="background: linear-gradient(135deg, #070d18 0%, #152A4A 100%);">
          <div class="dashboard-header-pattern"></div>
          <div class="dashboard-user-info">
            <div class="dashboard-avatar-large" style="background:#EF4444; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.8rem;">
              ⚡
            </div>
            <div class="dashboard-welcome">
              <h2>RENTORA Admin Portal</h2>
              <p>Platform Command Center • Logged in as ${user.email}</p>
            </div>
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <span class="badge badge-navy" style="background:rgba(255,255,255,0.15); color:#FFFFFF; font-size:0.85rem; padding:8px 16px;">
              SUPER ADMIN CONSOLE
            </span>
            <button onclick="window.logoutUser()" class="btn btn-sm" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700; padding:8px 16px;">
              🚪 Logout
            </button>
          </div>
        </div>

        <!-- Metrics Overview Grid -->
        <div class="metrics-grid" id="adminMetricsGrid">
          <div class="metric-card">
            <div class="metric-data">
              <h4>Total Platform Users</h4>
              <p id="admMetricUsers">--</p>
            </div>
            <div class="metric-icon-box navy">👥</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Active Properties</h4>
              <p id="admMetricProps">--</p>
            </div>
            <div class="metric-icon-box teal">🏠</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Total Platform Revenue</h4>
              <p id="admMetricRevenue">--</p>
            </div>
            <div class="metric-icon-box coral">💰</div>
          </div>
          <div class="metric-card">
            <div class="metric-data">
              <h4>Flagged / Reports</h4>
              <p id="admMetricReports">--</p>
            </div>
            <div class="metric-icon-box amber">⚠️</div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="dashboard-tabs-bar">
          <button class="dash-tab-btn active" data-tab="properties" onclick="window.switchAdminTab('properties')">
            🏠 Property Moderation
          </button>
          <button class="dash-tab-btn" data-tab="users" onclick="window.switchAdminTab('users')">
            👥 Users & Landlords
          </button>
          <button class="dash-tab-btn" data-tab="payments" onclick="window.switchAdminTab('payments')">
            💳 Subscription Transactions
          </button>
          <button class="dash-tab-btn" data-tab="reports" onclick="window.switchAdminTab('reports')">
            ⚠️ Reported Listings
          </button>
        </div>

        <!-- Tab Content -->
        <div id="adminTabContent">
          <div style="text-align:center; padding:40px;">Loading platform metrics...</div>
        </div>
      </div>
    </div>
  `;

  loadAdminMetrics();
  loadAdminProperties();
}

async function loadAdminMetrics() {
  try {
    const res = await RentoraAPI.getAdminMetrics();
    const data = res.data;
    const usersEl = document.getElementById('admMetricUsers');
    const propsEl = document.getElementById('admMetricProps');
    const revEl = document.getElementById('admMetricRevenue');
    const repEl = document.getElementById('admMetricReports');

    if (usersEl) usersEl.textContent = data.users.total;
    if (propsEl) propsEl.textContent = data.properties.active;
    if (revEl) revEl.textContent = formatINR(data.business.totalRevenue);
    if (repEl) repEl.textContent = data.business.pendingReports;
  } catch (err) {
    console.error('Failed to load admin metrics:', err);
  }
}

window.switchAdminTab = function (tabName) {
  const tabBtns = document.querySelectorAll('.dash-tab-btn');
  tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabName));

  if (tabName === 'properties') {
    loadAdminProperties();
  } else if (tabName === 'users') {
    loadAdminUsers();
  } else if (tabName === 'payments') {
    loadAdminPayments();
  } else if (tabName === 'reports') {
    loadAdminReports();
  }
};

async function loadAdminProperties() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getAdminProperties();
    const properties = res.data || [];

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Landlord</th>
              <th>Rent</th>
              <th>Status</th>
              <th>Sponsored</th>
              <th>Moderate</th>
            </tr>
          </thead>
          <tbody>
            ${properties
              .map((p) => {
                const statusBadge =
                  p.status === 'active'
                    ? '<span class="badge badge-success">Active</span>'
                    : p.status === 'rented'
                    ? '<span class="badge badge-navy">Rented</span>'
                    : '<span class="badge" style="background:#FEE2E2; color:#EF4444;">Suspended</span>';

                return `
                <tr>
                  <td>
                    <strong>${p.title}</strong><br/>
                    <small style="color:var(--text-muted);">📍 ${p.location?.city} • ${p.bhk}</small>
                  </td>
                  <td>
                    ${p.seller?.name || 'Owner'}<br/>
                    <small style="color:var(--text-muted);">${p.seller?.email || ''}</small>
                  </td>
                  <td>${formatINR(p.rent)}/mo</td>
                  <td>${statusBadge}</td>
                  <td>${p.isSponsored ? '<span class="badge badge-sponsored">⭐ Yes</span>' : 'No'}</td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-sm btn-ghost" onclick="window.moderateProp('${p._id}', '${p.status === 'active' ? 'suspended' : 'active'}')">
                        ${p.status === 'active' ? 'Suspend' : 'Approve'}
                      </button>
                      <button class="btn btn-sm btn-ghost" style="color:#D97706;" onclick="window.moderateProp('${p._id}', null, ${!p.isSponsored})">
                        ${p.isSponsored ? 'Unsponsor' : 'Sponsor'}
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

async function loadAdminUsers() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getAdminUsers();
    const users = res.data || [];

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email & Phone</th>
              <th>Role</th>
              <th>Subscription</th>
              <th>Verification</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const roleBadge =
                  u.role === 'admin'
                    ? '<span class="badge badge-navy">Admin</span>'
                    : u.role === 'seller'
                    ? '<span class="badge badge-verified">Seller</span>'
                    : '<span class="badge badge-success">Customer</span>';

                return `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td>${u.email}<br/><small style="color:var(--text-muted);">${u.phone || 'No phone'}</small></td>
                  <td>${roleBadge}</td>
                  <td><strong style="text-transform:uppercase;">${u.subscription?.plan || 'Free'}</strong></td>
                  <td>
                    ${
                      u.isVerified
                        ? '<span class="badge badge-verified">Verified</span>'
                        : '<span class="badge" style="background:#F1F5F9; color:#64748B;">Unverified</span>'
                    }
                  </td>
                  <td>
                    ${
                      u.role === 'seller'
                        ? `<button class="btn btn-sm btn-outline" onclick="window.toggleUserVerify('${u._id}')">
                            ${u.isVerified ? 'Revoke Badge' : 'Verify Landlord'}
                          </button>`
                        : '-'
                    }
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
    content.innerHTML = `<p style="color:#EF4444;">Failed to load users: ${err.message}</p>`;
  }
}

async function loadAdminPayments() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getAdminPayments();
    const payments = res.data || [];

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer / Landlord</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Gateway Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (p) => `
              <tr>
                <td><strong style="font-family:monospace;">${p.invoiceNumber}</strong></td>
                <td>${p.user?.name || 'User'}<br/><small style="color:var(--text-muted);">${p.user?.email || ''}</small></td>
                <td><span class="badge badge-navy">${p.plan?.toUpperCase()} (${p.billingCycle})</span></td>
                <td><strong>${formatINR(p.amount)}</strong></td>
                <td><span class="badge badge-success">${p.status?.toUpperCase()}</span></td>
                <td>${new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load payments: ${err.message}</p>`;
  }
}

async function loadAdminReports() {
  const content = document.getElementById('adminTabContent');
  if (!content) return;

  try {
    const res = await RentoraAPI.getAdminReports();
    const reports = res.data || [];

    if (reports.length === 0) {
      content.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">✅</div>
          <h3 class="empty-state-title">No pending reports</h3>
          <p class="empty-state-desc">All user flags and fake listing complaints have been resolved.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="dash-table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Flagged Property</th>
              <th>Reported By</th>
              <th>Reason</th>
              <th>Details</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${reports
              .map(
                (r) => `
              <tr>
                <td><strong>${r.property?.title || 'Property'}</strong></td>
                <td>${r.reportedBy?.name || 'User'}</td>
                <td><span class="badge" style="background:#FEE2E2; color:#EF4444;">${r.reason}</span></td>
                <td><small>${r.details || 'No extra info'}</small></td>
                <td><span class="badge badge-navy">${r.status}</span></td>
                <td>
                  <div style="display:flex; gap:6px;">
                    <button class="btn btn-sm btn-primary" onclick="window.resolveReport('${r._id}', 'resolved', 'Listing verified and action taken')">Resolve</button>
                    <button class="btn btn-sm btn-outline" onclick="window.resolveReport('${r._id}', 'dismissed', 'False complaint')">Dismiss</button>
                  </div>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#EF4444;">Failed to load reports: ${err.message}</p>`;
  }
}

window.moderateProp = async function (id, status, isSponsored) {
  try {
    const payload = {};
    if (status) payload.status = status;
    if (isSponsored !== undefined) payload.isSponsored = isSponsored;

    await RentoraAPI.moderateProperty(id, payload);
    showToast('Property updated');
    loadAdminProperties();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

window.toggleUserVerify = async function (id) {
  try {
    const res = await RentoraAPI.toggleUserVerification(id);
    showToast(res.message);
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

window.resolveReport = async function (id, status, note) {
  try {
    await RentoraAPI.updateReportStatus(id, status, note);
    showToast(`Report marked as ${status}`);
    loadAdminReports();
  } catch (err) {
    showToast(err.message, 'danger');
  }
};
