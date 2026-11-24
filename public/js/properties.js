import { RentoraAPI, formatINR, showToast } from './api.js';
import { isLoggedIn, getCurrentUser } from './auth.js';
import { highlightMapMarker } from './map.js';

let activePropertyModalData = null;

// Render Property Card HTML
export function createPropertyCardHTML(property) {
  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800'];

  const isSponsored = !!property.isSponsored;
  const isFavorited = !!property.isFavorited;
  const distanceBadge = property.distanceKm !== undefined && property.distanceKm !== null
    ? `<span class="distance-tag">${property.distanceKm} km away</span>`
    : '';

  const sellerBadge = property.seller?.isVerified
    ? `<span class="badge badge-verified" style="font-size:0.65rem">VERIFIED</span>`
    : '';

  return `
    <div class="property-card ${isSponsored ? 'is-sponsored' : ''}" 
         id="property-card-${property._id}" 
         onmouseenter="window.onCardHover('${property._id}', true)" 
         onmouseleave="window.onCardHover('${property._id}', false)">
      
      <!-- Card Image Carousel -->
      <div class="card-media">
        <img src="${images[0]}" 
             id="card-img-${property._id}" 
             class="card-img" 
             alt="${property.title}" 
             loading="lazy" />

        <div class="card-badges-top">
          ${isSponsored ? '<span class="badge badge-sponsored">⭐ Sponsored</span>' : ''}
          <span class="badge badge-navy">${property.propertyType}</span>
        </div>

        <button class="card-fav-btn ${isFavorited ? 'active' : ''}" 
                title="${isFavorited ? 'Remove from saved' : 'Save to favourites'}"
                onclick="window.toggleFavorite('${property._id}', event)">
          <svg viewBox="0 0 24 24" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        ${
          images.length > 1
            ? `
          <div class="card-carousel-nav">
            ${images
              .map(
                (_, idx) =>
                  `<span class="carousel-dot ${idx === 0 ? 'active' : ''}" 
                         onclick="window.switchCardImage('${property._id}', ${idx}, event)"></span>`
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <!-- Card Body Content -->
      <div class="card-body">
        <div class="card-price-row">
          <div class="card-price">${formatINR(property.rent)} <span>/month</span></div>
          <div class="card-deposit">Deposit: ${formatINR(property.securityDeposit)}</div>
        </div>

        <h3 class="card-title" title="${property.title}">${property.title}</h3>

        <div class="card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${property.location?.locality}, ${property.location?.city}
          </span>
          ${distanceBadge}
        </div>

        <!-- Specs row -->
        <div class="card-specs-row">
          <div class="spec-item" title="BHK Configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            ${property.bhk}
          </div>
          <div class="spec-item" title="Super Area">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            ${property.areaSqFt} sq.ft
          </div>
          <div class="spec-item" title="Furnishing">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            ${property.furnishing.replace(' Furnished', '')}
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <div class="card-seller-brief">
            <div class="seller-avatar-small" style="display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem; color:#1E3E62;">
              ${(property.seller?.name || 'Landlord').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="seller-name-small">${property.seller?.name || 'Verified Owner'}</div>
              ${sellerBadge}
            </div>
          </div>

          <div class="card-actions-wrap">
            <button class="btn btn-sm btn-navy" onclick="window.viewPropertyDetails('${property._id}')">
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global Card Hover synchronizer
window.onCardHover = function (propertyId, isEntering) {
  highlightMapMarker(propertyId, isEntering);
};

// Global Switch Card Image
window.switchCardImage = function (propertyId, index, event) {
  event.stopPropagation();
  const card = document.getElementById(`property-card-${propertyId}`);
  if (!card) return;

  const dots = card.querySelectorAll('.carousel-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === index));

  const imgEl = document.getElementById(`card-img-${propertyId}`);
  if (imgEl && window._propertyCache && window._propertyCache[propertyId]) {
    const images = window._propertyCache[propertyId].images;
    if (images && images[index]) {
      imgEl.src = images[index];
    }
  }
};

// Toggle Favourite
window.toggleFavorite = async function (propertyId, event) {
  if (event) event.stopPropagation();

  if (!isLoggedIn()) {
    showToast('Please login to save favourite properties!', 'danger');
    window.openAuthModal('login');
    return;
  }

  try {
    const res = await RentoraAPI.toggleFavourite(propertyId);
    showToast(res.message);

    const btn = event ? event.currentTarget : null;
    if (btn) {
      btn.classList.toggle('active', res.isFavorited);
    }

    // Refresh if in customer dashboard
    if (window.location.hash.includes('customer')) {
      window.dispatchEvent(new CustomEvent('rentora:favourites-updated'));
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
};

// View Detailed Property Modal
window.viewPropertyDetails = async function (propertyId) {
  try {
    const res = await RentoraAPI.getPropertyById(propertyId);
    const prop = res.data;
    activePropertyModalData = prop;

    const modal = document.getElementById('propertyDetailModal');
    const content = document.getElementById('propertyDetailContent');
    if (!modal || !content) return;

    const images = prop.images && prop.images.length > 0
      ? prop.images
      : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200'];

    const amenitiesList = (prop.amenities || [
      'Water Supply',
      'Power Backup',
      'Security',
      'Wi-Fi',
      'Parking',
    ])
      .map(
        (a) => `
        <div style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:var(--navy-50); border-radius:var(--radius-md); font-size:0.88rem; font-weight:600; color:var(--navy-900);">
          <span style="color:var(--teal-600); font-weight:bold;">✓</span> ${a}
        </div>
      `
      )
      .join('');

    content.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:24px;">
        <!-- Photo Gallery -->
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:12px; height:340px; border-radius:var(--radius-lg); overflow:hidden;">
          <img src="${images[0]}" id="modalMainImg" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" alt="${prop.title}"/>
          <div style="display:grid; grid-template-rows: repeat(${Math.min(images.length - 1 || 1, 2)}, 1fr); gap:12px; height:100%;">
            ${
              images.slice(1, 3).map(
                (img, idx) => `
              <img src="${img}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="document.getElementById('modalMainImg').src='${img}'" alt="Thumb"/>
            `
              ).join('') || `<img src="${images[0]}" style="width:100%; height:100%; object-fit:cover;" alt="Thumb"/>`
            }
          </div>
        </div>

        <!-- Header Row -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap;">
          <div>
            <div style="display:flex; gap:8px; margin-bottom:8px;">
              ${prop.isSponsored ? '<span class="badge badge-sponsored">⭐ Sponsored Property</span>' : ''}
              <span class="badge badge-navy">${prop.propertyType}</span>
              <span class="badge badge-success">${prop.availability}</span>
            </div>
            <h2 style="font-size:1.8rem; font-weight:800; color:var(--navy-900); margin-bottom:8px;">${prop.title}</h2>
            <div style="display:flex; align-items:center; gap:6px; font-size:0.95rem; color:var(--text-secondary);">
              📍 ${prop.location?.address}, ${prop.location?.locality}, ${prop.location?.city} (${prop.location?.pincode || ''})
            </div>
          </div>

          <div style="text-align:right;">
            <div style="font-size:2rem; font-weight:800; color:var(--navy-900);">${formatINR(prop.rent)} <span style="font-size:1rem; font-weight:500; color:var(--text-muted);">/month</span></div>
            <div style="font-size:0.88rem; color:var(--text-secondary); margin-top:4px;">
              Deposit: <strong>${formatINR(prop.securityDeposit)}</strong> • Maint: <strong>${formatINR(prop.maintenance)}/mo</strong>
            </div>
          </div>
        </div>

        <!-- Quick Specs Matrix -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; padding:18px; background:var(--navy-50); border-radius:var(--radius-lg); border:1px solid var(--border-light);">
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Config</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.bhk}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Area</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.areaSqFt} sq.ft</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Furnishing</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.furnishing}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Bathrooms</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.bathrooms} Baths</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Parking</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.parking}</div>
          </div>
          <div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Tenant Pref</div>
            <div style="font-size:1rem; font-weight:700; color:var(--navy-900);">${prop.preferredTenant}</div>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:8px;">About This Property</h4>
          <p style="color:var(--text-secondary); line-height:1.7; font-size:0.95rem;">${prop.description}</p>
        </div>

        <!-- Amenities -->
        <div>
          <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:12px;">Amenities & Features</h4>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:10px;">
            ${amenitiesList}
          </div>
        </div>

        <!-- Landlord & Direct Actions Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; padding:20px; border-radius:var(--radius-lg); background:#FFFFFF; border:1.5px solid var(--border-light); box-shadow:var(--shadow-sm); flex-wrap:wrap;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--navy-900); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem;">
              ${(prop.seller?.name || 'L').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700; font-size:1rem; color:var(--navy-900);">${prop.seller?.name || 'Property Landlord'}</div>
              <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; gap:6px; align-items:center;">
                ${prop.seller?.isVerified ? '<span class="badge badge-verified" style="font-size:0.65rem">VERIFIED LANDLORD</span>' : 'Owner'}
                • Direct Owner Listing
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="window.openContactOwnerModal('${prop.seller?.name}', '${prop.seller?.phone || '+91 98765 43210'}', '${prop.seller?.email || 'owner@rentora.com'}')">
              📞 Contact Owner
            </button>
            <button class="btn btn-navy" onclick="window.openVisitModal('${prop._id}')">
              📅 Schedule Visit
            </button>
            <button class="btn btn-primary" onclick="window.openEnquiryModal('${prop._id}', '${encodeURIComponent(prop.title)}')">
              ✉️ Send Enquiry
            </button>
          </div>
        </div>

        <!-- Report Listing Footer -->
        <div style="text-align:right;">
          <button class="btn btn-ghost btn-sm" style="color:#EF4444;" onclick="window.openReportModal('${prop._id}')">
            ⚠️ Report incorrect or fake listing
          </button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  } catch (err) {
    showToast('Failed to load property details', 'danger');
  }
};

// Contact Owner Modal
window.openContactOwnerModal = function (name, phone, email) {
  const modal = document.getElementById('contactOwnerModal');
  const details = document.getElementById('contactOwnerDetails');
  if (!modal || !details) return;

  const cleanPhone = phone.replace(/\s+/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.replace('+', '')}&text=Hello%20${encodeURIComponent(
    name
  )},%20I%20saw%20your%20rental%20property%20on%20RENTORA%20and%20am%20interested!`;

  details.innerHTML = `
    <div style="text-align:center; padding:10px 0 20px;">
      <div style="width:64px; height:64px; border-radius:50%; background:var(--coral-100); color:var(--coral-500); display:flex; align-items:center; justify-content:center; font-size:1.6rem; font-weight:800; margin:0 auto 14px;">
        ${name.charAt(0).toUpperCase()}
      </div>
      <h3 style="font-size:1.3rem; font-weight:800; color:var(--navy-900);">${name}</h3>
      <p style="color:var(--text-secondary); font-size:0.9rem;">Verified Property Owner</p>
    </div>

    <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px;">
      <div style="padding:14px; background:var(--navy-50); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">PHONE NUMBER</div>
          <div style="font-size:1.1rem; font-weight:700; color:var(--navy-900);">${phone}</div>
        </div>
        <a href="tel:${cleanPhone}" class="btn btn-sm btn-navy">Call Now</a>
      </div>

      <div style="padding:14px; background:var(--navy-50); border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">EMAIL</div>
          <div style="font-size:0.95rem; font-weight:600; color:var(--navy-900);">${email}</div>
        </div>
        <a href="mailto:${email}" class="btn btn-sm btn-outline">Send Email</a>
      </div>
    </div>

    <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%; justify-content:center; background:#25D366; border-color:#25D366;">
      💬 Chat on WhatsApp
    </a>
  `;

  modal.classList.add('active');
};

// Enquiry Modal
window.openEnquiryModal = function (propertyId, propTitleEncoded) {
  if (!isLoggedIn()) {
    showToast('Please login to send rental enquiries', 'danger');
    window.openAuthModal('login');
    return;
  }

  const modal = document.getElementById('enquiryModal');
  const propIdInput = document.getElementById('enquiryPropertyId');
  const propTitleHeader = document.getElementById('enquiryPropertyTitle');

  if (propIdInput) propIdInput.value = propertyId;
  if (propTitleHeader && propTitleEncoded) {
    propTitleHeader.textContent = decodeURIComponent(propTitleEncoded);
  }

  const user = getCurrentUser();
  if (user) {
    const nameInput = document.getElementById('enquiryName');
    const emailInput = document.getElementById('enquiryEmail');
    const phoneInput = document.getElementById('enquiryPhone');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
  }

  modal.classList.add('active');
};

// Schedule Visit Modal
window.openVisitModal = function (propertyId) {
  if (!isLoggedIn()) {
    showToast('Please login to schedule property visits', 'danger');
    window.openAuthModal('login');
    return;
  }

  const modal = document.getElementById('visitModal');
  const propIdInput = document.getElementById('visitPropertyId');
  if (propIdInput) propIdInput.value = propertyId;

  // Set default date to tomorrow
  const dateInput = document.getElementById('visitDate');
  if (dateInput) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateInput.value = tomorrow;
    dateInput.min = tomorrow;
  }

  modal.classList.add('active');
};

// Report Listing Modal
window.openReportModal = function (propertyId) {
  if (!isLoggedIn()) {
    showToast('Please login to report a listing', 'danger');
    window.openAuthModal('login');
    return;
  }

  const modal = document.getElementById('reportModal');
  const propIdInput = document.getElementById('reportPropertyId');
  if (propIdInput) propIdInput.value = propertyId;

  modal.classList.add('active');
};
