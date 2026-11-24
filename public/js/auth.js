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

  showToast('You have been logged out.');
  updateAuthUI();
  window.location.hash = '#/';
  window.dispatchEvent(new CustomEvent('rentora:auth-change'));
}

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
    if (user.role === 'admin') {
      window.location.hash = '#/admin';
    } else if (user.role === 'seller') {
      window.location.hash = '#/seller/dashboard';
    } else {
      window.location.hash = '#/customer/dashboard';
    }
  } catch (err) {
    console.error('Demo login failed:', err);
  }
}

export function updateAuthUI() {
  const navUserSection = document.getElementById('navUserSection');
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
        : '<span class="badge badge-success" style="font-size:0.65rem">CUSTOMER</span>';

    const dashboardLink =
      currentUser.role === 'admin'
        ? '#/admin'
        : currentUser.role === 'seller'
        ? '#/seller/dashboard'
        : '#/customer/dashboard';

    navUserSection.innerHTML = `
      <div class="nav-user-dropdown" style="display:flex; align-items:center; gap:10px;">
        <a href="${dashboardLink}" class="user-profile-btn">
          <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
          <div style="text-align:left; line-height:1.2;">
            <div style="font-size:0.85rem; font-weight:700;">${currentUser.name}</div>
            ${roleBadge}
          </div>
        </a>
        <a href="${dashboardLink}" class="btn btn-sm btn-outline" title="Dashboard">
          Dashboard
        </a>
        <button id="logoutBtn" class="btn btn-sm btn-ghost" title="Logout" style="color:#EF4444;">
          Logout
        </button>
      </div>
    `;

    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
  } else {
    navUserSection.innerHTML = `
      <button id="openLoginBtn" class="btn btn-ghost">
        Sign In
      </button>
      <button id="openRegisterBtn" class="btn btn-primary">
        Get Started
      </button>
    `;

    document.getElementById('openLoginBtn')?.addEventListener('click', () => {
      window.openAuthModal('login');
    });
    document.getElementById('openRegisterBtn')?.addEventListener('click', () => {
      window.openAuthModal('register');
    });
  }
}
