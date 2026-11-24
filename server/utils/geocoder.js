// Known coordinate dictionary for instant offline resolution
export const CITY_COORDINATES = {
  // Uttarakhand / Tanakpur Region
  'tanakpur': { lat: 29.0718, lng: 80.1084, name: 'Tanakpur, Champawat, Uttarakhand' },
  'banbasa': { lat: 28.9897, lng: 80.0805, name: 'Banbasa, Champawat, Uttarakhand' },
  'khatima': { lat: 28.9167, lng: 79.9667, name: 'Khatima, Udham Singh Nagar, Uttarakhand' },
  'haldwani': { lat: 29.2183, lng: 79.5130, name: 'Haldwani, Nainital, Uttarakhand' },
  'dehradun': { lat: 30.3165, lng: 78.0322, name: 'Dehradun, Uttarakhand' },
  'haridwar': { lat: 29.9457, lng: 78.1642, name: 'Haridwar, Uttarakhand' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, name: 'Rishikesh, Uttarakhand' },
  'rudrapur': { lat: 28.9800, lng: 79.4000, name: 'Rudrapur, Uttarakhand' },

  // Metro Cities & Hubs
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi, Delhi' },
  'connaught place': { lat: 28.6315, lng: 77.2167, name: 'Connaught Place, New Delhi' },
  'noida': { lat: 28.5355, lng: 77.3910, name: 'Noida, Uttar Pradesh' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurugram (Gurgaon), Haryana' },
  'gurugram': { lat: 28.4595, lng: 77.0266, name: 'Gurugram, Haryana' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
  'indiranagar': { lat: 12.9784, lng: 77.6408, name: 'Indiranagar, Bengaluru' },
  'koramangala': { lat: 12.9352, lng: 77.6245, name: 'Koramangala, Bengaluru' },
  'whitefield': { lat: 12.9698, lng: 77.7500, name: 'Whitefield, Bengaluru' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
  'bandra': { lat: 19.0596, lng: 72.8295, name: 'Bandra, Mumbai' },
  'andheri': { lat: 19.1136, lng: 72.8697, name: 'Andheri, Mumbai' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad, Telangana' },
  'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur, Rajasthan' },
  'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow, Uttar Pradesh' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
};

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place
}

// Simple in-memory geocoding cache
const geocodeCache = new Map();

// Geocode location string into [lng, lat]
export async function geocodeLocation(query) {
  if (!query) return null;
  const clean = query.trim().toLowerCase();

  // Check known dictionary
  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return {
        lat: val.lat,
        lng: val.lng,
        displayName: val.name,
      };
    }
  }

  // Check in-memory cache
  if (geocodeCache.has(clean)) {
    return geocodeCache.get(clean);
  }

  // Try Nominatim API with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ', India'
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RentoraPropertyMarketplace/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
        geocodeCache.set(clean, result);
        return result;
      }
    }
  } catch (err) {
    // If network fails or timeout, fall back to null
  }

  return null;
}
