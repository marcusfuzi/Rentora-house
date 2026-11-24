import { RentoraAPI, formatINR, showToast } from './api.js';
import { getCurrentUser } from './auth.js';

export async function renderCustomerDashboard() {
  const container = document.getElementById('dashboardViewContent');
  if (!container) return;

  const user = getCurrentUser();
  if (!user) {
    window.location.hash = '#/';
    return;
  }

  container.innerHTML = `
    <div class="dashboard-container">
      <div class="container">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
          <div class="dashboard-header-pattern"></div>
          <div class="dashboard-user-info">
            <div class="dashboard-avatar-large" style="display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:800; color:#FFFFFF;">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="dashboard-welcome">
              <h2>Welcome, ${user.name}</h2>
              <p>Tenant & Customer Portal • ${user.email} • ${user.phone || 'No phone added'}</p>
            </div>
          </div>
          <div>
            <span class="badge badge-success" style="font-size:0.8rem; padding:6px 14px;">Verified Tenant Account</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="dashboard-tabs-bar">
          <button class="dash-tab-btn active" data-tab="saved">
            ❤️ Saved Favourites (<span id="favCountBadge">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="enquiries">
            ✉️ My Enquiries (<span id="enquiryCountBadge">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="visits">
            📅 Scheduled Visits (<span id="visitCountBadge">0</span>)
          </button>
          <button class="dash-tab-btn" data-tab="notifications">
            🔔 Notifications
          </button>
          <button class="dash-tab-btn" data-tab="profile">
            ⚙️ Profile Settings
          </button>
        </div>

        <!-- Tab Content Panes -->
        <div id="customerTabContent">
          <div style="text-align:center; padding:40px;">Loading your rental activity...</div>
        </div>
      </div>
    </div>
  `;

  // Bind tab switching
  const tabBtns = container.querySelectorAll('.dash-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadCustomerTab(btn.dataset.tab);
    });
  });

  // Default tab: saved
  loadCustomerTab('saved');
}

async function loadCustomerTab(tabName) {
  const content = document.getElementById('customerTabContent');
  if (!content) return;

  if (tabName === 'saved') {
    content.innerHTML = '<div style="text-align:center; padding:40px;">Loading saved properties...</div>';
    try {
      const res = await RentoraAPI.getFavourites();
      const favs = res.data || [];
      document.getElementById('favCountBadge').textContent = favs.length;

      if (favs.length === 0) {
        content.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">❤️</div>
            <h3 class="empty-state-title">No saved properties yet</h3>
            <p class="empty-state-desc">When browsing properties, click the heart icon on any card to save it here for easy comparison.</p>
            <a href="#/" class="btn btn-primary">Browse Rental Homes</a>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="properties-grid">
            ${favs
              .map(
                (p) => `
              <div class="property-card" id="fav-card-${p._id}">
                <div class="card-media">
                  <img src="${p.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800'}" class="card-img" alt="${p.title}"/>
                  <div class="card-badges-top">
                    ${p.isSponsored ? '<span class="badge badge-sponsored">⭐ Sponsored</span>' : ''}
                    <span class="badge badge-navy">${p.propertyType}</span>
                  </div>
                  <button class="card-fav-btn active" title="Remove" onclick="window.removeFavoriteFromList('${p._id}')">
                    <svg viewBox="0 0 24 24" stroke-width="2" style="fill:#EF4444; stroke:#EF4444;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                </div>
                <div class="card-body">
                  <div class="card-price-row">
                    <div class="card-price">${formatINR(p.rent)} <span>/mo</span></div>
                  </div>
                  <h3 class="card-title">${p.title}</h3>
                  <div class="card-location">📍 ${p.location?.locality}, ${p.location?.city}</div>
                  <div class="card-footer" style="padding-top:12px; border-top:1px solid var(--border-light);">
                    <button class="btn btn-sm btn-navy" style="width:100%; justify-content:center;" onclick="window.viewPropertyDetails('${p._id}')">
                      View Details & Contact Owner
                    </button>
                  </div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `;
      }
    } catch (err) {
      content.innerHTML = `<p style="color:#EF4444;">Failed to load saved properties: ${err.message}</p>`;
    }
  } else if (tabName === 'enquiries') {
    content.innerHTML = '<div style="text-align:center; padding:40px;">Loading your enquiries...</div>';
    try {
      const res = await RentoraAPI.getCustomerEnquiries();
      const enquiries = res.data || [];
      document.getElementById('enquiryCountBadge').textContent = enquiries.length;

      if (enquiries.length === 0) {
        content.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">✉️</div>
            <h3 class="empty-state-title">No enquiries sent yet</h3>
            <p class="empty-state-desc">When you find a house or flat you like, click "Send Enquiry" to contact the landlord directly.</p>
            <a href="#/" class="btn btn-primary">Find Rental Properties</a>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="dash-table-wrap">
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Landlord</th>
                  <th>Move-in Date</th>
                  <th>Status</th>
                  <th>Landlord Response</th>
                  <th>Actions</th>
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
                        <span style="font-size:0.8rem; color:var(--text-muted);">📍 ${e.property?.location?.city || ''} • ${formatINR(e.property?.rent)}/mo</span>
                      </td>
                      <td>
                        ${e.seller?.name || 'Owner'}<br/>
                        <span style="font-size:0.8rem; color:var(--text-muted);">${e.seller?.phone || ''}</span>
                      </td>
                      <td>${new Date(e.moveInDate).toLocaleDateString()}</td>
                      <td>${statusBadge}</td>
                      <td>
                        <em style="color:${e.sellerResponse ? 'var(--navy-900)' : 'var(--text-muted)'};">
                          ${e.sellerResponse || 'Awaiting response...'}
                        </em>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-outline" onclick="window.viewPropertyDetails('${e.property?._id}')">
                          View
                        </button>
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      content.innerHTML = `<p style="color:#EF4444;">Failed to load enquiries: ${err.message}</p>`;
    }
  } else if (tabName === 'visits') {
    content.innerHTML = '<div style="text-align:center; padding:40px;">Loading your scheduled visits...</div>';
    try {
      const res = await RentoraAPI.getCustomerVisits();
      const visits = res.data || [];
      document.getElementById('visitCountBadge').textContent = visits.length;

      if (visits.length === 0) {
        content.innerHTML = `
          <div class="empty-state-box">
            <div class="empty-state-icon">📅</div>
            <h3 class="empty-state-title">No visits scheduled</h3>
            <p class="empty-state-desc">You can book in-person or video visits directly with verified landlords from any property page.</p>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="dash-table-wrap">
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Landlord</th>
                  <th>Visit Type</th>
                  <th>Date & Time Slot</th>
                  <th>Status</th>
                  <th>Notes</th>
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
                      <td>${v.seller?.name || 'Owner'}<br/><span style="font-size:0.8rem; color:var(--text-muted);">${v.seller?.phone || ''}</span></td>
                      <td><span class="badge badge-navy">${v.visitType}</span></td>
                      <td><strong>${new Date(v.preferredDate).toLocaleDateString()}</strong><br/>${v.timeSlot}</td>
                      <td>${statusBadge}</td>
                      <td><small>${v.sellerNotes || v.customerNotes || 'No notes'}</small></td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      content.innerHTML = `<p style="color:#EF4444;">Failed to load visits: ${err.message}</p>`;
    }
  } else if (tabName === 'notifications') {
    try {
      const res = await RentoraAPI.getNotifications();
      const notifs = res.data || [];
      content.innerHTML = `
        <div style="background:#FFFFFF; border-radius:var(--radius-lg); border:1px solid var(--border-light); padding:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="font-size:1.2rem; font-weight:700;">Recent Notifications</h3>
            <button class="btn btn-sm btn-ghost" onclick="window.markAllNotificationsRead()">Mark all as read</button>
          </div>
          ${
            notifs.length === 0
              ? '<p style="color:var(--text-muted); text-align:center; padding:20px;">No notifications yet.</p>'
              : `<div style="display:flex; flex-direction:column; gap:12px;">
                  ${notifs
                    .map(
                      (n) => `
                    <div style="padding:14px; background:${n.isRead ? 'var(--navy-50)' : '#FFF7ED'}; border-left:4px solid ${n.isRead ? 'var(--navy-600)' : 'var(--coral-500)'}; border-radius:var(--radius-sm);">
                      <div style="display:flex; justify-content:space-between;">
                        <strong>${n.title}</strong>
                        <small style="color:var(--text-muted);">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                      <div style="font-size:0.9rem; color:var(--text-secondary); margin-top:4px;">${n.message}</div>
                    </div>
                  `
                    )
                    .join('')}
                </div>`
          }
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p style="color:#EF4444;">Failed to load notifications</p>`;
    }
  } else if (tabName === 'profile') {
    const user = getCurrentUser();
    content.innerHTML = `
      <div style="max-width:600px; background:#FFFFFF; border-radius:var(--radius-lg); border:1px solid var(--border-light); padding:28px;">
        <h3 style="font-size:1.2rem; font-weight:700; margin-bottom:20px;">Account & Personal Details</h3>
        <form id="customerProfileForm">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="custProfileName" class="form-control" value="${user?.name || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address (Registered)</label>
            <input type="email" class="form-control" value="${user?.email || ''}" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" id="custProfilePhone" class="form-control" value="${user?.phone || ''}" placeholder="+91 XXXXX XXXXX" />
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top:10px;">Save Profile Updates</button>
        </form>
      </div>
    `;

    document.getElementById('customerProfileForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById('custProfileName').value;
        const phone = document.getElementById('custProfilePhone').value;
        const res = await RentoraAPI.updateProfile({ name, phone });
        RentoraAPI.setUser(res.user);
        showToast('Profile updated successfully!');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }
}

// Global Remove from Favourites
window.removeFavoriteFromList = async function (propertyId) {
  try {
    await RentoraAPI.toggleFavourite(propertyId);
    showToast('Removed from saved properties');
    document.getElementById(`fav-card-${propertyId}`)?.remove();
    loadCustomerTab('saved');
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

window.markAllNotificationsRead = async function () {
  try {
    await RentoraAPI.markNotificationsRead();
    showToast('All notifications marked as read');
    loadCustomerTab('notifications');
  } catch (err) {
    showToast(err.message, 'danger');
  }
};
