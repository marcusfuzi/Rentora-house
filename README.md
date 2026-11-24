# RENTORA – Smart Property Rental Marketplace

> **A complete, modern, premium-looking, full-stack rental marketplace connecting property owners (Landlords) with tenants seeking houses, flats, apartments, and residential villas with zero brokerage hassle.**

---

## 🌟 Key Features

### 1. 🧭 Smart Location-Based Property Search & Map Discovery
- **Location Geocoding:** Search by city, locality, area, PIN code, or place name (e.g., *Tanakpur*, *Banbasa*, *Dehradun*, *Delhi NCR*, *Bangalore*, *Haldwani*).
- **Geospatial Radius Selector:** Discover properties within **2 km**, **5 km**, **10 km**, **20 km**, and **50 km** using Haversine calculation and MongoDB GeoJSON coordinates.
- **Interactive Leaflet Map:**
  - Modern OpenStreetMap / CartoDB tiles with zero API key dependencies.
  - Custom real-estate price markers (e.g. `₹8,500/mo`, `⭐ ₹14,000/mo`).
  - Pulsing center marker and dynamic radius boundary circle around the searched location.
  - Two-way card & pin hover synchronization.
  - Interactive popups with thumbnail, rent, BHK, and direct details link.

### 2. 🎛️ Advanced Multi-Faceted Property Filters
- **Property Type:** Independent House, Flat, Apartment, Luxury Villa, Independent Builder Floor.
- **BHK Configurations:** 1 BHK, 2 BHK, 3 BHK, 4 BHK, 5+ BHK.
- **Monthly Rent Budget:** Interactive range slider (₹5,000 to ₹1,00,000+).
- **Furnishing Status:** Fully Furnished, Semi Furnished, Unfurnished.
- **Bathrooms & Balconies:** Filter by number of baths and balconies.
- **Parking Availability:** Car, Bike, Both, Covered Basement, None.
- **Preferred Tenant:** Family, Bachelor, Students, Anyone.
- **Move-In Availability:** Immediate, Available Soon, Within 15 Days.
- **Key Amenities:** 24x7 Water Supply, Power Backup, Elevator/Lift, Security Guards, CCTV, High-Speed Wi-Fi, Gym, Swimming Pool.

### 3. ⭐ Intelligent Property Ranking System
- **Strict Compliance Hierarchy:**
  1. **Sponsored Listings:** Subscribed sellers' promoted properties appear with an unmistakable amber `⭐ Sponsored` badge at the top of relevant search results.
  2. **Organic Listings (Lowest Price Default):** As requested, organic results following sponsored listings are automatically sorted by **Lowest Rental Price First** for maximum tenant affordability.
  3. **User Sorting Options:** Price: Low to High, Price: High to Low, Nearest First (based on distance from searched location), Newest First.

### 4. 👥 Separate User Accounts & Dashboards
- **A. Customer (Tenant) Account:**
  - Search and filter properties.
  - View comprehensive specs, high-res photo gallery, and landlord profile.
  - Save / unsave favorite properties synced to database.
  - Submit rental enquiries with desired move-in date and tenant profile.
  - Schedule in-person or live video tour visits.
  - Direct WhatsApp and phone contact buttons.
  - **Customer Dashboard:** Manage profile, saved favourites, sent enquiries with landlord reply notes, scheduled visits, and notification alerts.

- **B. Seller (Landlord) Account:**
  - Create property listings with specs, amenities, location, and photos.
  - Manage listings: Edit, delete, toggle active / rented status.
  - **Sponsored Property Advertising:** Use plan-included sponsored slots to promote listings to top search rank.
  - **Incoming Enquiries Inbox:** Review tenant messages, move-in dates, phone numbers, and respond with custom notes.
  - **Visit Appointment Manager:** Confirm, reschedule, or complete property tours.
  - **Seller Dashboard Metrics:** Total listings, active listings, total views, and inquiries.

- **C. Super Admin Dashboard:**
  - Platform-wide statistics: total users, active properties, total revenue, pending fraud reports.
  - Moderation console: approve, reject, suspend, delete listings, and toggle sponsored status.
  - User management: toggle `Verified Landlord` badge.
  - Transaction logs: inspect subscription invoices and payments.
  - Fraud & reported listings resolution center.

### 5. 💳 Seller Subscription & Monetization Model
- **Free Starter (₹0/mo):** 2 active listings, standard visibility, enquiries inbox.
- **Pro Landlord (₹999/mo):** 10 active listings, 2 Sponsored Ad slots included, Verified Landlord badge, 3x search boost, detailed view analytics.
- **Premium Enterprise (₹2,499/mo):** Unlimited active listings, 6 Sponsored Ad slots included, Gold Partner badge, top placement in searches, instant tenant alerts.
- **Razorpay Integration:** Full order creation and signature verification with instant test mode checkout simulation.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Pure HTML5, Modern CSS3 (Grid, Flexbox, Glassmorphism), Vanilla ES6 JavaScript Modules |
| **Backend** | Node.js (v24 LTS) + Express.js |
| **Database** | MongoDB (Mongoose ODM, 2dsphere Geospatial Indexes, Text Search) |
| **Authentication** | JWT (JSON Web Tokens) + `bcryptjs` secure password hashing |
| **Maps** | Leaflet.js + OpenStreetMap CartoDB tiles + Nominatim geocoding |
| **Payments** | Razorpay Node.js SDK (Order Creation, Verification, Test Mode) |

---

## ⚡ Instant 1-Click Evaluation Credentials

The application features a sticky top banner with **1-Click Test Logins** for instantaneous role testing:

| Role | Email | Password | Details |
|---|---|---|---|
| **Customer (Tenant)** | `customer@rentora.com` | `Customer@123` | Aarav Mehta (Active saved favorites, enquiry, visit) |
| **Seller (Pro)** | `seller@rentora.com` | `Seller@123` | Rajesh Sharma (Tanakpur Landlord, Pro Plan, 2 Sponsored slots) |
| **Landlord (Premium)** | `landlord@rentora.com` | `Landlord@123` | Pooja Verma (Dehradun/Delhi/Bangalore, Premium Plan, 6 Sponsored slots) |
| **Super Admin** | `admin@rentora.com` | `Admin@123` | Full administrative command center |

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Running on `mongodb://127.0.0.1:27017`)

### 2. Installation
```bash
cd rentora
npm install
```

### 3. Seed Database
Pre-populates sample rental properties across Tanakpur, Banbasa, Dehradun, Haldwani, Delhi NCR, and Bangalore:
```bash
npm run seed
```

### 4. Start the Application
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

---

## 📁 Project Structure

```
rentora/
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role-based guards
│   │   └── upload.js             # Multer photo upload handling
│   ├── models/
│   │   ├── User.js               # Customers, Sellers, Admins, Subscriptions
│   │   ├── Property.js           # Rental listings, 2dsphere geospatial index
│   │   ├── Enquiry.js            # Tenant inquiries & landlord responses
│   │   ├── Visit.js              # Tour schedules (In-person & video)
│   │   ├── Payment.js            # Razorpay subscription transactions
│   │   ├── Report.js             # Flagged listings moderation
│   │   └── Notification.js       # User notifications
│   ├── routes/
│   │   ├── auth.routes.js        # Register, login, profile
│   │   ├── property.routes.js    # Search, distance radius, CRUD, sponsor
│   │   ├── enquiry.routes.js     # Tenant inquiries
│   │   ├── visit.routes.js       # Property tour booking
│   │   ├── favourite.routes.js   # Save / unsave favorites
│   │   ├── subscription.routes.js# Plans & active entitlements
│   │   ├── payment.routes.js     # Razorpay orders & verification
│   │   ├── admin.routes.js       # Platform analytics & moderation
│   │   └── upload.routes.js      # Photo upload endpoint
│   ├── utils/
│   │   ├── geocoder.js           # Coordinates lookup & Haversine distance
│   │   └── seedData.js           # Realistic seed dataset
│   ├── server.js                 # Express application entrypoint
│   └── seed.js                   # Standalone seed runner
├── public/
│   ├── index.html                # Single-page HTML5 marketplace
│   ├── css/
│   │   ├── main.css              # Typography, layout, variables, buttons
│   │   ├── components.css        # Cards, modals, filters, toasts
│   │   ├── dashboards.css        # Customer, Seller, and Admin tabs
│   │   └── map.css               # Leaflet custom pins & radius
│   └── js/
│       ├── api.js                # Central API client & state
│       ├── auth.js               # Authentication & demo account switcher
│       ├── map.js                # Leaflet map manager
│       ├── properties.js         # Property card & modal logic
│       ├── filters.js            # Advanced multi-filter controller
│       ├── customer-dashboard.js # Tenant activity center
│       ├── seller-dashboard.js   # Landlord listing & subscription manager
│       ├── admin-dashboard.js    # Admin command center
│       └── app.js                # Master initializer & SPA router
├── package.json
└── README.md
```
