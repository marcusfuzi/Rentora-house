import { formatINR } from './api.js';

let mapInstance = null;
let markersGroup = null;
let radiusCircle = null;
let centerMarker = null;
const markerIdMap = new Map();

export function initMap(elementId = 'leafletMap', defaultLat = 29.0718, defaultLng = 80.1084, defaultZoom = 13) {
  const mapElement = document.getElementById(elementId);
  if (!mapElement || typeof L === 'undefined') return null;

  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }

  // Tanakpur default coordinates: [29.0718, 80.1084]
  mapInstance = L.map(elementId, {
    center: [defaultLat, defaultLng],
    zoom: defaultZoom,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  // OpenStreetMap clean positron / standard tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> & CartoDB',
    maxZoom: 19,
    subdomains: 'abcd',
  }).addTo(mapInstance);

  markersGroup = L.featureGroup().addTo(mapInstance);

  return mapInstance;
}

export function renderPropertyMarkers(properties, targetCoords = null, radiusKm = 20) {
  if (!mapInstance || !markersGroup || typeof L === 'undefined') return;

  markersGroup.clearLayers();
  markerIdMap.clear();

  if (radiusCircle) {
    mapInstance.removeLayer(radiusCircle);
    radiusCircle = null;
  }
  if (centerMarker) {
    mapInstance.removeLayer(centerMarker);
    centerMarker = null;
  }

  const validBounds = [];

  // If user searched a location with radius, draw radius circle and center pin
  if (targetCoords && targetCoords.lat && targetCoords.lng) {
    const centerLatLng = [targetCoords.lat, targetCoords.lng];

    // Pulsing center pin
    const centerIcon = L.divIcon({
      className: 'center-pin-wrapper',
      html: '<div class="center-location-pin" title="Searched Center"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    centerMarker = L.marker(centerLatLng, { icon: centerIcon, zIndexOffset: 2000 }).addTo(mapInstance);

    // Radius circle
    radiusCircle = L.circle(centerLatLng, {
      radius: radiusKm * 1000, // in meters
      color: '#FF6B35',
      fillColor: '#FF6B35',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '6, 6',
    }).addTo(mapInstance);

    validBounds.push(centerLatLng);
  }

  // Plot property price pins
  properties.forEach((prop) => {
    const coords = prop.location?.coordinates?.coordinates;
    if (!coords || coords.length !== 2) return;

    const [lng, lat] = coords;
    if (isNaN(lat) || isNaN(lng)) return;

    const priceText = formatINR(prop.rent);
    const isSponsored = !!prop.isSponsored;

    const pinHtml = `
      <div class="custom-property-pin ${isSponsored ? 'pin-sponsored' : ''}" id="map-pin-${prop._id}">
        ${isSponsored ? '⭐ ' : ''}${priceText}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'rentora-div-icon',
      html: pinHtml,
      iconSize: [85, 30],
      iconAnchor: [42, 15],
    });

    const marker = L.marker([lat, lng], { icon: customIcon });

    // Popup card
    const popupContent = `
      <div class="rentora-popup">
        <div class="popup-media-wrap">
          <img src="${prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800'}" class="popup-img" alt="${prop.title}"/>
          ${isSponsored ? '<span class="popup-badge">Sponsored</span>' : ''}
        </div>
        <div class="popup-info">
          <div class="popup-price">${priceText} <span>/mo</span></div>
          <div class="popup-title">${prop.title}</div>
          <div class="popup-location">📍 ${prop.location?.locality}, ${prop.location?.city}</div>
          <button class="popup-view-btn" onclick="window.viewPropertyDetails('${prop._id}')">
            View Property
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 280, className: 'rentora-popup' });

    marker.on('click', () => {
      highlightPropertyCard(prop._id);
    });

    markersGroup.addLayer(marker);
    markerIdMap.set(prop._id.toString(), marker);
    validBounds.push([lat, lng]);
  });

  // Fit bounds to show all markers smoothly
  if (validBounds.length > 0) {
    if (radiusCircle) {
      mapInstance.fitBounds(radiusCircle.getBounds(), { padding: [30, 30], maxZoom: 14 });
    } else {
      mapInstance.fitBounds(validBounds, { padding: [40, 40], maxZoom: 15 });
    }
  }
}

export function highlightMapMarker(propertyId, select = true) {
  const marker = markerIdMap.get(propertyId.toString());
  if (!marker) return;

  const pinEl = document.getElementById(`map-pin-${propertyId}`);
  if (pinEl) {
    if (select) {
      pinEl.classList.add('pin-active');
    } else {
      pinEl.classList.remove('pin-active');
    }
  }
}

function highlightPropertyCard(propertyId) {
  const card = document.getElementById(`property-card-${propertyId}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    card.style.borderColor = 'var(--coral-500)';
    card.style.boxShadow = '0 0 0 3px rgba(255, 107, 53, 0.3)';
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    }, 2500);
  }
}
