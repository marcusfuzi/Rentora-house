import { RentoraAPI, showToast } from './api.js';
import { createPropertyCardHTML } from './properties.js';
import { renderPropertyMarkers } from './map.js';

export const activeFilters = {
  search: '',
  location: '',
  lat: null,
  lng: null,
  radius: 20,
  propertyType: [],
  bhk: [],
  minRent: '',
  maxRent: '',
  furnishing: [],
  bathrooms: '',
  parking: '',
  preferredTenant: '',
  availability: '',
  amenities: [],
  sort: 'smart', // 'smart', 'price_asc', 'price_desc', 'nearest', 'newest'
};

export async function fetchAndRenderProperties() {
  const grid = document.getElementById('propertiesGrid');
  const countTitle = document.getElementById('resultsCount');
  if (!grid) return;

  // Show loading skeleton
  grid.innerHTML = Array(6)
    .fill(0)
    .map(
      () => `
      <div class="property-card" style="min-height:360px; background:#FFFFFF; padding:16px; opacity:0.6;">
        <div style="width:100%; height:200px; background:var(--navy-50); border-radius:12px; margin-bottom:12px;"></div>
        <div style="width:40%; height:24px; background:var(--navy-50); border-radius:6px; margin-bottom:8px;"></div>
        <div style="width:80%; height:18px; background:var(--navy-50); border-radius:6px; margin-bottom:14px;"></div>
        <div style="width:100%; height:32px; background:var(--navy-50); border-radius:6px;"></div>
      </div>
    `
    )
    .join('');

  try {
    const queryParams = {
      search: activeFilters.search,
      location: activeFilters.location,
      lat: activeFilters.lat,
      lng: activeFilters.lng,
      radius: activeFilters.radius,
      propertyType: activeFilters.propertyType.join(','),
      bhk: activeFilters.bhk.join(','),
      minRent: activeFilters.minRent,
      maxRent: activeFilters.maxRent,
      furnishing: activeFilters.furnishing.join(','),
      bathrooms: activeFilters.bathrooms,
      parking: activeFilters.parking,
      preferredTenant: activeFilters.preferredTenant,
      availability: activeFilters.availability,
      amenities: activeFilters.amenities.join(','),
      sort: activeFilters.sort,
    };

    const res = await RentoraAPI.getProperties(queryParams);
    const properties = res.data || [];

    // Cache properties for client quick lookups
    window._propertyCache = {};
    properties.forEach((p) => {
      window._propertyCache[p._id] = p;
    });

    if (countTitle) {
      const locText = activeFilters.location ? ` in "${activeFilters.location}"` : '';
      countTitle.innerHTML = `Showing <span>${properties.length}</span> rental homes${locText}`;
    }

    if (properties.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-box" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No rental homes found matching your filters</h3>
          <p class="empty-state-desc">Try widening your search radius or clearing some of the selected filters to view nearby properties.</p>
          <button class="btn btn-outline-primary" onclick="window.resetAllFilters()">Reset All Filters</button>
        </div>
      `;
    } else {
      grid.innerHTML = properties.map((p) => createPropertyCardHTML(p)).join('');
    }

    // Update map with properties, radius circle, and center pin
    renderPropertyMarkers(properties, res.targetCoordinates, activeFilters.radius);
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    grid.innerHTML = `
      <div class="empty-state-box" style="grid-column: 1 / -1;">
        <h3 class="empty-state-title" style="color:#EF4444;">Error Loading Properties</h3>
        <p class="empty-state-desc">${error.message}</p>
        <button class="btn btn-navy" onclick="window.fetchAndRenderProperties()">Try Again</button>
      </div>
    `;
  }
}

export function initFilterListeners() {
  // Hero Search Form
  const heroSearchForm = document.getElementById('heroSearchForm');
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const locInput = document.getElementById('heroLocationInput');
      const bhkSelect = document.getElementById('heroBhkSelect');
      const typeSelect = document.getElementById('heroTypeSelect');
      const budgetSelect = document.getElementById('heroBudgetSelect');

      if (locInput) activeFilters.location = locInput.value.trim();
      if (bhkSelect && bhkSelect.value) activeFilters.bhk = [bhkSelect.value];
      if (typeSelect && typeSelect.value) activeFilters.propertyType = [typeSelect.value];

      if (budgetSelect && budgetSelect.value) {
        const [min, max] = budgetSelect.value.split('-');
        activeFilters.minRent = min || '';
        activeFilters.maxRent = max || '';
      }

      fetchAndRenderProperties();

      // Smooth scroll down to results
      document.getElementById('marketplaceSection')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Radius pill buttons
  const radiusBtns = document.querySelectorAll('.radius-pill-btn');
  radiusBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      radiusBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.radius = parseInt(btn.dataset.radius, 10);
      fetchAndRenderProperties();
    });
  });

  // Popular location chips
  const locationChips = document.querySelectorAll('.location-chip');
  locationChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      locationChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const locName = chip.dataset.location;

      activeFilters.location = locName;
      const heroInput = document.getElementById('heroLocationInput');
      if (heroInput) heroInput.value = locName;

      fetchAndRenderProperties();
      document.getElementById('marketplaceSection')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Property Type pills in sidebar
  document.querySelectorAll('#propertyTypePills .filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.type;
      if (type === 'All') {
        activeFilters.propertyType = [];
        document.querySelectorAll('#propertyTypePills .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      } else {
        document.querySelector('#propertyTypePills .filter-pill[data-type="All"]')?.classList.remove('active');
        pill.classList.toggle('active');
        if (pill.classList.contains('active')) {
          activeFilters.propertyType.push(type);
        } else {
          activeFilters.propertyType = activeFilters.propertyType.filter((t) => t !== type);
        }
      }
      fetchAndRenderProperties();
    });
  });

  // BHK filter pills
  document.querySelectorAll('#bhkFilterPills .filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const bhk = pill.dataset.bhk;
      if (bhk === 'All') {
        activeFilters.bhk = [];
        document.querySelectorAll('#bhkFilterPills .filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      } else {
        document.querySelector('#bhkFilterPills .filter-pill[data-type="All"]')?.classList.remove('active');
        pill.classList.toggle('active');
        if (pill.classList.contains('active')) {
          activeFilters.bhk.push(bhk);
        } else {
          activeFilters.bhk = activeFilters.bhk.filter((b) => b !== bhk);
        }
      }
      fetchAndRenderProperties();
    });
  });

  // Max Rent Slider in sidebar
  const rentSlider = document.getElementById('sidebarRentSlider');
  const rentValDisplay = document.getElementById('rentSliderValue');
  if (rentSlider && rentValDisplay) {
    rentSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      rentValDisplay.textContent = '₹' + val.toLocaleString('en-IN');
      activeFilters.maxRent = val < 100000 ? val : '';
    });
    rentSlider.addEventListener('change', () => {
      fetchAndRenderProperties();
    });
  }

  // Furnishing checkboxes
  document.querySelectorAll('input[name="furnishing"]').forEach((chk) => {
    chk.addEventListener('change', () => {
      activeFilters.furnishing = Array.from(document.querySelectorAll('input[name="furnishing"]:checked')).map(
        (c) => c.value
      );
      fetchAndRenderProperties();
    });
  });

  // Amenities checkboxes
  document.querySelectorAll('input[name="amenity"]').forEach((chk) => {
    chk.addEventListener('change', () => {
      activeFilters.amenities = Array.from(document.querySelectorAll('input[name="amenity"]:checked')).map(
        (c) => c.value
      );
      fetchAndRenderProperties();
    });
  });

  // Tenant preference
  const tenantSelect = document.getElementById('preferredTenantSelect');
  if (tenantSelect) {
    tenantSelect.addEventListener('change', (e) => {
      activeFilters.preferredTenant = e.target.value;
      fetchAndRenderProperties();
    });
  }

  // Sorting Dropdown
  const sortSelect = document.getElementById('propertySortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeFilters.sort = e.target.value;
      fetchAndRenderProperties();
    });
  }

  // Reset Filters button
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', window.resetAllFilters);
  }
}

window.resetAllFilters = function () {
  activeFilters.search = '';
  activeFilters.location = '';
  activeFilters.lat = null;
  activeFilters.lng = null;
  activeFilters.radius = 20;
  activeFilters.propertyType = [];
  activeFilters.bhk = [];
  activeFilters.minRent = '';
  activeFilters.maxRent = '';
  activeFilters.furnishing = [];
  activeFilters.bathrooms = '';
  activeFilters.parking = '';
  activeFilters.preferredTenant = '';
  activeFilters.availability = '';
  activeFilters.amenities = [];
  activeFilters.sort = 'smart';

  // Clear inputs
  const heroInput = document.getElementById('heroLocationInput');
  if (heroInput) heroInput.value = '';

  document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.filter-pill[data-type="All"], .filter-pill[data-bhk="All"]').forEach((p) =>
    p.classList.add('active')
  );
  document.querySelectorAll('input[type="checkbox"]').forEach((chk) => (chk.checked = false));

  const rentSlider = document.getElementById('sidebarRentSlider');
  const rentValDisplay = document.getElementById('rentSliderValue');
  if (rentSlider && rentValDisplay) {
    rentSlider.value = 100000;
    rentValDisplay.textContent = '₹1,00,000+';
  }

  fetchAndRenderProperties();
  showToast('Filters reset to default');
};
