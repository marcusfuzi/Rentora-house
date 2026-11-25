import { RentoraAPI, showToast } from './api.js';
import { updateAuthUI, loginUser, registerUser, quickDemoLogin, getCurrentUser, isLoggedIn } from './auth.js';
import { initMap, renderPropertyMarkers } from './map.js';
import { initFilterListeners, fetchAndRenderProperties, activeFilters } from './filters.js';
import { renderCustomerDashboard } from './customer-dashboard.js';
import { renderSellerDashboard } from './seller-dashboard.js';
import { renderAdminDashboard } from './admin-dashboard.js';

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[RENTORA] Initializing full-stack rental marketplace client...');

  // 1. Update Navigation Auth State
  updateAuthUI();

  // 2. Initialize Leaflet Map
  initMap('leafletMap');

  // 3. Initialize Filters & Listeners
  initFilterListeners();

  // 4. Setup Global Modals and Form Handlers
  setupModalsAndForms();

  // 5. Handle Routing
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // 6. Listen for auth changes
  window.addEventListener('rentora:auth-change', () => {
    updateAuthUI();
    handleRoute();
  });
});

// SPA Hash Router
function handleRoute() {
  const hash = window.location.hash || '#/';
  const mainView = document.getElementById('mainMarketplaceView');
  const dashboardView = document.getElementById('dashboardViewContent');
  const heroSection = document.getElementById('heroSection');
  const howItWorksSection = document.getElementById('howItWorksSection');
  const pricingSection = document.getElementById('pricingSection');
  const navHomeLink = document.getElementById('navHomeLink');
  const navDashboardLink = document.getElementById('navDashboardLink');

  if (hash.startsWith('#/customer/dashboard')) {
    if (!isLoggedIn()) {
      showToast('Please sign in to access your customer dashboard', 'danger');
      window.openAuthModal('login');
      window.location.hash = '#/';
      return;
    }
    if (mainView) mainView.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    if (howItWorksSection) howItWorksSection.style.display = 'none';
    if (pricingSection) pricingSection.style.display = 'none';
    if (dashboardView) {
      dashboardView.style.display = 'block';
      renderCustomerDashboard();
    }
    if (navHomeLink) navHomeLink.classList.remove('active');
    if (navDashboardLink) navDashboardLink.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (hash.startsWith('#/seller/dashboard')) {
    if (!isLoggedIn() || getCurrentUser()?.role !== 'seller') {
      showToast('Landlord clearance required. Please login with a seller account.', 'danger');
      window.openAuthModal('login');
      window.location.hash = '#/';
      return;
    }
    if (mainView) mainView.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    if (howItWorksSection) howItWorksSection.style.display = 'none';
    if (pricingSection) pricingSection.style.display = 'none';
    if (dashboardView) {
      dashboardView.style.display = 'block';
      renderSellerDashboard();
    }
    if (navHomeLink) navHomeLink.classList.remove('active');
    if (navDashboardLink) navDashboardLink.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (hash.startsWith('#/admin')) {
    if (!isLoggedIn() || getCurrentUser()?.role !== 'admin') {
      showToast('Super Admin clearance required', 'danger');
      window.openAuthModal('login');
      window.location.hash = '#/';
      return;
    }
    if (mainView) mainView.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    if (howItWorksSection) howItWorksSection.style.display = 'none';
    if (pricingSection) pricingSection.style.display = 'none';
    if (dashboardView) {
      dashboardView.style.display = 'block';
      renderAdminDashboard();
    }
    if (navHomeLink) navHomeLink.classList.remove('active');
    if (navDashboardLink) navDashboardLink.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (hash.startsWith('#/pricing') || hash === '#pricingSection') {
    if (dashboardView) dashboardView.style.display = 'none';
    if (heroSection) heroSection.style.display = 'none';
    if (mainView) mainView.style.display = 'none';
    if (howItWorksSection) howItWorksSection.style.display = 'none';
    if (pricingSection) {
      pricingSection.style.display = 'block';
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (navHomeLink) navHomeLink.classList.remove('active');
    if (navDashboardLink) navDashboardLink.classList.remove('active');
  } else {
    // Default: Home & Marketplace
    if (dashboardView) dashboardView.style.display = 'none';
    if (heroSection) heroSection.style.display = 'block';
    if (mainView) mainView.style.display = 'block';
    if (howItWorksSection) howItWorksSection.style.display = 'block';
    if (pricingSection) pricingSection.style.display = 'block';

    if (navHomeLink) navHomeLink.classList.add('active');
    if (navDashboardLink) navDashboardLink.classList.remove('active');

    fetchAndRenderProperties();
  }
}

// Global Modal Handlers
function setupModalsAndForms() {
  // Modal Close buttons
  document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Close modal on click outside
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // View Mode Toggle (Grid vs Split Map)
  const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
  const marketLayout = document.getElementById('marketplaceLayout');
  const mapPane = document.getElementById('mapPaneContainer');

  viewToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;

      if (mode === 'split') {
        if (marketLayout) marketLayout.classList.add('split-map-active');
        if (mapPane) mapPane.style.display = 'block';
        setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
      } else {
        if (marketLayout) marketLayout.classList.remove('split-map-active');
        if (mapPane) mapPane.style.display = 'none';
      }
    });
  });

  // Auth Form Handlers
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const role = document.getElementById('loginRoleSelect')?.value;

      try {
        await loginUser(email, password, role);
        document.getElementById('authModal')?.classList.remove('active');
      } catch (err) {
        // Handled in loginUser
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const phone = document.getElementById('regPhone').value;
      const role = document.querySelector('input[name="regRole"]:checked')?.value || 'customer';

      try {
        await registerUser({ name, email, password, phone, role });
        document.getElementById('authModal')?.classList.remove('active');
      } catch (err) {
        // Handled in registerUser
      }
    });
  }

  // Enquiry Submission Form
  const enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const propertyId = document.getElementById('enquiryPropertyId').value;
      const fullName = document.getElementById('enquiryName').value;
      const email = document.getElementById('enquiryEmail').value;
      const phone = document.getElementById('enquiryPhone').value;
      const moveInDate = document.getElementById('enquiryMoveIn').value;
      const tenantType = document.getElementById('enquiryTenantType').value;
      const occupantsCount = document.getElementById('enquiryOccupants').value;
      const message = document.getElementById('enquiryMessage').value;

      try {
        const res = await RentoraAPI.sendEnquiry({
          propertyId,
          fullName,
          email,
          phone,
          moveInDate,
          tenantType,
          occupantsCount,
          message,
        });

        document.getElementById('enquiryModal')?.classList.remove('active');
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }

  // Schedule Visit Form
  const visitForm = document.getElementById('visitForm');
  if (visitForm) {
    visitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const propertyId = document.getElementById('visitPropertyId').value;
      const visitType = document.getElementById('visitTypeSelect').value;
      const preferredDate = document.getElementById('visitDate').value;
      const timeSlot = document.getElementById('visitTimeSlot').value;
      const customerNotes = document.getElementById('visitNotes').value;

      try {
        const res = await RentoraAPI.scheduleVisit({
          propertyId,
          visitType,
          preferredDate,
          timeSlot,
          customerNotes,
        });

        document.getElementById('visitModal')?.classList.remove('active');
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }

  // Report Listing Form
  const reportForm = document.getElementById('reportForm');
  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const propertyId = document.getElementById('reportPropertyId').value;
      const reason = document.getElementById('reportReasonSelect').value;
      const details = document.getElementById('reportDetails').value;

      try {
        const res = await RentoraAPI.reportListing(propertyId, reason, details);
        document.getElementById('reportModal')?.classList.remove('active');
        showToast(res.message);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }

  // Add Property Form (Seller)
  const addPropertyForm = document.getElementById('addPropertyForm');
  if (addPropertyForm) {
    addPropertyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('propTitle').value;
      const description = document.getElementById('propDesc').value;
      const propertyType = document.getElementById('propType').value;
      const bhk = document.getElementById('propBhk').value;
      const rent = document.getElementById('propRent').value;
      const securityDeposit = document.getElementById('propDeposit').value;
      const maintenance = document.getElementById('propMaintenance').value;
      const areaSqFt = document.getElementById('propArea').value;
      const furnishing = document.getElementById('propFurnishing').value;
      const bathrooms = document.getElementById('propBathrooms').value;
      const parking = document.getElementById('propParking').value;
      const preferredTenant = document.getElementById('propTenant').value;
      const availability = document.getElementById('propAvailability').value;

      // Location
      const address = document.getElementById('propAddress').value;
      const locality = document.getElementById('propLocality').value;
      const city = document.getElementById('propCity').value;
      const pincode = document.getElementById('propPincode').value;

      // Selected Amenities
      const amenities = Array.from(document.querySelectorAll('input[name="newPropAmenity"]:checked')).map(
        (c) => c.value
      );

      // Photos (URL or preset)
      const photoUrlInput = document.getElementById('propPhotoUrl').value.trim();
      const images = photoUrlInput
        ? [photoUrlInput]
        : ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000'];

      try {
        const res = await RentoraAPI.createProperty({
          title,
          description,
          propertyType,
          bhk,
          rent,
          securityDeposit,
          maintenance,
          areaSqFt,
          furnishing,
          bathrooms,
          parking,
          preferredTenant,
          availability,
          amenities,
          images,
          location: {
            address,
            locality,
            city,
            pincode,
          },
        });

        document.getElementById('addPropertyModal')?.classList.remove('active');
        showToast('Property listed successfully on RENTORA!');

        // If in seller dashboard, reload
        if (window.location.hash.includes('seller')) {
          window.switchSellerTab('listings');
        } else {
          fetchAndRenderProperties();
        }
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
  }
}

// Global Auth Modal Switcher
window.openAuthModal = function (tab = 'login') {
  const modal = document.getElementById('authModal');
  const loginPane = document.getElementById('loginPane');
  const registerPane = document.getElementById('registerPane');
  const loginTab = document.getElementById('authTabLogin');
  const regTab = document.getElementById('authTabRegister');

  if (!modal) return;

  if (tab === 'register') {
    loginPane.style.display = 'none';
    registerPane.style.display = 'block';
    loginTab.classList.remove('active');
    regTab.classList.add('active');
  } else {
    loginPane.style.display = 'block';
    registerPane.style.display = 'none';
    loginTab.classList.add('active');
    regTab.classList.remove('active');
  }

  modal.classList.add('active');
};

// Global Demo Login Trigger
window.triggerDemoLogin = function (roleType) {
  quickDemoLogin(roleType);
};
