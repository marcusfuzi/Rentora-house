import { RentoraAPI, showToast } from './api.js';

let currentUser = RentoraAPI.getUser();

export function getCurrentUser() {
  return currentUser;
}

export function isLoggedIn() {
  return !!currentUser && !!RentoraAPI.getToken();
}

export async function loginUser(email, password, role) {
  try {
    const res = await RentoraAPI.login({ email, password, role });
    RentoraAPI.setToken(res.token);
    RentoraAPI.setUser(res.user);
    currentUser = res.user;

    showToast(`Welcome back, ${res.user.name}!`);
    updateAuthUI();

    // Auto-navigate to user's dashboard
    navigateToDashboard();
    return res.user;
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}

export async function registerUser(userData) {
  try {
    const res = await RentoraAPI.register(userData);
    RentoraAPI.setToken(res.token);
    RentoraAPI.setUser(res.user);
    currentUser = res.user;

    showToast(`Account created! Welcome to Rentora, ${res.user.name}!`);
    updateAuthUI();

    // Auto-navigate to dashboard
    navigateToDashboard();
    return res.user;
  } catch (error) {
    showToast(error.message, 'danger');
    throw error;
  }
}

export function logoutUser() {
  RentoraAPI.setToken(null);
  RentoraAPI.setUser(null);
  currentUser = null;

  showToast('You have been logged out successfully.', 'info');
  updateAuthUI();
  window.location.hash = '#/';
  window.dispatchEvent(new CustomEvent('rentora:auth-change'));
}

// Make logoutUser globally accessible
window.logoutUser = logoutUser;

export function navigateToDashboard() {
  if (!isLoggedIn() || !currentUser) {
    showToast('Please sign in to view your dashboard', 'info');
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal('login');
    }
    return;
  }

  if (currentUser.role === 'admin') {
    window.location.hash = '#/admin';
  } else if (currentUser.role === 'seller') {
    window.location.hash = '#/seller/dashboard';
  } else {
    window.location.hash = '#/customer/dashboard';
  }
}

// Make navigateToDashboard globally accessible
window.navigateToDashboard = navigateToDashboard;

export async function quickDemoLogin(type) {
  const credentials = {
    customer: { email: 'customer@rentora.com', password: 'Customer@123', role: 'customer' },
    seller: { email: 'seller@rentora.com', password: 'Seller@123', role: 'seller' },
    landlord: { email: 'landlord@rentora.com', password: 'Landlord@123', role: 'seller' },
    admin: { email: 'admin@rentora.com', password: 'Admin@123', role: 'admin' },
  };

  const cred = credentials[type];
  if (!cred) return;

  try {
    const user = await loginUser(cred.email, cred.password, cred.role);
    window.dispatchEvent(new CustomEvent('rentora:auth-change', { detail: user }));

    // Route user to appropriate view
    const targetHash =
      user.role === 'admin'
        ? '#/admin'
        : user.role === 'seller'
        ? '#/seller/dashboard'
        : '#/customer/dashboard';

    if (window.location.hash === targetHash) {
      window.dispatchEvent(new Event('hashchange'));
    } else {
      window.location.hash = targetHash;
    }
  } catch (err) {
    console.error('Demo login failed:', err);
  }
}

window.quickDemoLogin = quickDemoLogin;
window.triggerDemoLogin = quickDemoLogin;

export function updateAuthUI() {
  const navUserSection = document.getElementById('navUserSection');
  const navDashboardLink = document.getElementById('navDashboardLink');
  if (!navUserSection) return;

  if (isLoggedIn() && currentUser) {
    const roleBadge =
      currentUser.role === 'admin'
        ? '<span class="badge badge-navy" style="font-size:0.65rem">ADMIN</span>'
        : currentUser.role === 'seller'
        ? `<span class="badge ${
            currentUser.subscription?.plan === 'premium'
              ? 'badge-sponsored'
              : currentUser.subscription?.plan === 'pro'
              ? 'badge-verified'
              : 'badge-navy'
          }" style="font-size:0.65rem">${(currentUser.subscription?.plan || 'Free').toUpperCase()} SELLER</span>`
        : '<span class="badge badge-success" style="font-size:0.65rem">TENANT</span>';

    const dashboardLink =
      currentUser.role === 'admin'
        ? '#/admin'
        : currentUser.role === 'seller'
        ? '#/seller/dashboard'
        : '#/customer/dashboard';

    navUserSection.innerHTML = `
      <div class="nav-user-dropdown" style="display:flex; align-items:center; gap:8px;">
        <a href="${dashboardLink}" class="user-profile-btn" title="View Profile & Dashboard">
          <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
          <div style="text-align:left; line-height:1.2;">
            <div style="font-size:0.85rem; font-weight:700;">${currentUser.name}</div>
            ${roleBadge}
          </div>
        </a>
        <a href="${dashboardLink}" class="btn btn-sm btn-navy" title="Open Dashboard">
          Dashboard
        </a>
        <button id="logoutBtn" onclick="window.logoutUser()" class="btn btn-sm" title="Log Out" style="background:#FEE2E2; color:#DC2626; border:1px solid #FECACA; font-weight:700;">
          🚪 Logout
        </button>
      </div>
    `;

    if (navDashboardLink) {
      navDashboardLink.style.display = 'inline-flex';
      navDashboardLink.setAttribute('href', dashboardLink);
    }
  } else {
    navUserSection.innerHTML = `
      <button id="openLoginBtn" class="btn btn-ghost" onclick="window.openAuthModal('login')">
        Sign In
      </button>
      <button id="openRegisterBtn" class="btn btn-primary" onclick="window.openAuthModal('register')">
        Get Started
      </button>
    `;

    if (navDashboardLink) {
      navDashboardLink.setAttribute('href', 'javascript:void(0)');
    }
  }
}
