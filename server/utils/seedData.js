import User from '../models/User.js';
import Property from '../models/Property.js';
import Enquiry from '../models/Enquiry.js';
import Visit from '../models/Visit.js';
import Payment from '../models/Payment.js';

export const seedDatabaseIfEmpty = async () => {
  try {
    const propertyCount = await Property.countDocuments();
    if (propertyCount > 0) {
      console.log(`[Rentora Seed] Database already contains ${propertyCount} properties. Skipping auto-seed.`);
      return;
    }

    console.log('[Rentora Seed] Empty database detected. Seeding sample users, properties, and enquiries...');
    await runFullSeed();
    console.log('[Rentora Seed] Database seeded successfully!');
  } catch (error) {
    console.error('[Rentora Seed] Error during auto-seeding:', error);
  }
};

export const runFullSeed = async () => {
  // Clear existing data
  await User.deleteMany({});
  await Property.deleteMany({});
  await Enquiry.deleteMany({});
  await Visit.deleteMany({});
  await Payment.deleteMany({});

  // 1. Create Users
  const admin = await User.create({
    name: 'Admin Rentora',
    email: 'admin@rentora.com',
    password: 'Admin@123',
    phone: '+91 99000 11223',
    role: 'admin',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    address: { street: 'Rentora HQ, Tech Park', city: 'Dehradun', state: 'Uttarakhand', pincode: '248001' },
  });

  const seller1 = await User.create({
    name: 'Rajesh Sharma',
    email: 'seller@rentora.com',
    password: 'Seller@123',
    phone: '+91 98765 43210',
    role: 'seller',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    address: { street: 'Station Road', city: 'Tanakpur', state: 'Uttarakhand', pincode: '262309' },
    subscription: {
      plan: 'pro',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      listingLimit: 10,
      sponsoredSlots: 2,
      sponsoredSlotsUsed: 2,
      razorpaySubscriptionId: 'pay_rzp_mock_pro_01',
    },
  });

  const seller2 = await User.create({
    name: 'Pooja Verma',
    email: 'landlord@rentora.com',
    password: 'Landlord@123',
    phone: '+91 98111 22334',
    role: 'seller',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
    address: { street: 'Rajpur Road', city: 'Dehradun', state: 'Uttarakhand', pincode: '248009' },
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      listingLimit: 999,
      sponsoredSlots: 6,
      sponsoredSlotsUsed: 3,
      razorpaySubscriptionId: 'pay_rzp_mock_prem_01',
    },
  });

  const customer1 = await User.create({
    name: 'Aarav Mehta',
    email: 'customer@rentora.com',
    password: 'Customer@123',
    phone: '+91 99887 76655',
    role: 'customer',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    address: { street: 'Civil Lines', city: 'Delhi', state: 'Delhi', pincode: '110054' },
  });

  const customer2 = await User.create({
    name: 'Simran Kaur',
    email: 'tenant@rentora.com',
    password: 'Tenant@123',
    phone: '+91 97766 55443',
    role: 'customer',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
  });

  // 2. Sample Properties
  const propertiesData = [
    // --- TANAKPUR & NEARBY REGION ---
    {
      title: 'Himalayan View 2 BHK Independent House with Garden',
      description:
        'Peaceful and airy independent 2 BHK house located near Sharda Barrage in Tanakpur. Features a private front garden, 2 spacious bedrooms with attached modern bathrooms, modular kitchen, large hall, and 24x7 pure natural mountain water supply. Very quiet residential neighborhood with easy access to main market and schools.',
      propertyType: 'House',
      bhk: '2 BHK',
      rent: 8500,
      securityDeposit: 15000,
      maintenance: 500,
      areaSqFt: 1100,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 1,
      parking: 'Car',
      floor: 'Ground Floor',
      facing: 'East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Security', 'Wi-Fi', 'Parking', 'Park', 'Power Backup'],
      images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'House #14, Sharda Barrage Road, Near River Viewpoint',
        locality: 'Sharda Barrage Road',
        city: 'Tanakpur',
        state: 'Uttarakhand',
        pincode: '262309',
        coordinates: { type: 'Point', coordinates: [80.1120, 29.0745] },
      },
      seller: seller1._id,
      isSponsored: true,
      sponsoredExpiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      viewsCount: 342,
      enquiriesCount: 9,
    },
    {
      title: 'Riverside 3 BHK Luxury Villa with Private Lawn',
      description:
        'Grand 3 BHK independent villa designed with modern Himalayan architecture in Gandhi Nagar, Tanakpur. Spacious living room with Italian tile flooring, 3 master bedrooms with en-suite baths, covered parking for 2 cars, high-speed fiber internet, and inverter power backup. Perfect for corporate managers or families seeking premium living in Tanakpur.',
      propertyType: 'Villa',
      bhk: '3 BHK',
      rent: 14000,
      securityDeposit: 25000,
      maintenance: 1000,
      areaSqFt: 1850,
      furnishing: 'Fully Furnished',
      bathrooms: 3,
      balconies: 2,
      parking: 'Covered',
      floor: 'Independent 2-Storey Villa',
      facing: 'North-East',
      preferredTenant: 'Anyone',
      availability: 'Immediate',
      amenities: ['Power Backup', 'Security', 'CCTV', 'Wi-Fi', 'Water Supply', 'Park', 'Children Play Area'],
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Bungalow 4, Gandhi Nagar Colony',
        locality: 'Gandhi Nagar',
        city: 'Tanakpur',
        state: 'Uttarakhand',
        pincode: '262309',
        coordinates: { type: 'Point', coordinates: [80.1055, 29.0680] },
      },
      seller: seller1._id,
      isSponsored: true,
      sponsoredExpiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      viewsCount: 512,
      enquiriesCount: 15,
    },
    {
      title: 'Affordable Cozy 1 BHK Flat near Tanakpur Bus Station',
      description:
        'Budget-friendly 1 BHK apartment situated on the 1st floor, just 300 meters from Tanakpur Bus Terminal and Railway Station. Ideal for working professionals, bank employees, or teachers. Includes a bedroom, hall, kitchen, clean bathroom, and front balcony. 24 hours water and bike parking included.',
      propertyType: 'Flat',
      bhk: '1 BHK',
      rent: 5500,
      securityDeposit: 10000,
      maintenance: 200,
      areaSqFt: 550,
      furnishing: 'Semi Furnished',
      bathrooms: 1,
      balconies: 1,
      parking: 'Bike',
      floor: '1st of 3 floors',
      facing: 'North',
      preferredTenant: 'Bachelor',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Security', 'Wi-Fi'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Station Road, Near Tanakpur Bus Stand',
        locality: 'Station Road',
        city: 'Tanakpur',
        state: 'Uttarakhand',
        pincode: '262309',
        coordinates: { type: 'Point', coordinates: [80.1080, 29.0710] },
      },
      seller: seller1._id,
      isSponsored: false,
      viewsCount: 189,
      enquiriesCount: 4,
    },
    {
      title: 'Modern 2 BHK Upper Floor Apartment with Wide Terrace',
      description:
        'Well-maintained 2 BHK apartment on Railway Colony Enclave, Tanakpur. Freshly painted with vitrified tile flooring, semi-modular kitchen, wide private terrace with scenic mountain view. Very peaceful residential area with ample street parking and polite neighbors.',
      propertyType: 'Apartment',
      bhk: '2 BHK',
      rent: 7800,
      securityDeposit: 14000,
      maintenance: 300,
      areaSqFt: 950,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 2,
      parking: 'Car',
      floor: '2nd Floor',
      facing: 'East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Power Backup', 'Security', 'Wi-Fi'],
      images: [
        'https://images.unsplash.com/photo-1502005229762-ee1b2b892837?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Block B, Railway Colony Road',
        locality: 'Railway Colony',
        city: 'Tanakpur',
        state: 'Uttarakhand',
        pincode: '262309',
        coordinates: { type: 'Point', coordinates: [80.1110, 29.0730] },
      },
      seller: seller1._id,
      isSponsored: false,
      viewsCount: 210,
      enquiriesCount: 6,
    },
    {
      title: '3 BHK Independent House with Orchard View - Banbasa',
      description:
        'Spacious 3 BHK home located in nearby Banbasa (8 km from Tanakpur). Surrounded by green litchi orchards. Large living area, 3 bedrooms, 2 bathrooms, wide verandah, and private parking. Peaceful suburban setting with highway connectivity.',
      propertyType: 'House',
      bhk: '3 BHK',
      rent: 9200,
      securityDeposit: 18000,
      maintenance: 0,
      areaSqFt: 1400,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 1,
      parking: 'Both',
      floor: 'Ground Floor',
      facing: 'North-East',
      preferredTenant: 'Anyone',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Parking', 'Power Backup', 'Park'],
      images: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Canal Road, Banbasa Town',
        locality: 'Canal Road',
        city: 'Banbasa',
        state: 'Uttarakhand',
        pincode: '262310',
        coordinates: { type: 'Point', coordinates: [80.0805, 28.9897] },
      },
      seller: seller1._id,
      isSponsored: false,
      viewsCount: 145,
      enquiriesCount: 3,
    },
    {
      title: '2 BHK Peaceful Residential Floor - Khatima Highway',
      description:
        'Clean 2 BHK builder floor in Khatima (16 km from Tanakpur). Close to markets and bypass road. Excellent ventilation, airy rooms, 2 bathrooms, 24x7 water supply, and motorcycle parking.',
      propertyType: 'Independent Floor',
      bhk: '2 BHK',
      rent: 7000,
      securityDeposit: 12000,
      maintenance: 0,
      areaSqFt: 1000,
      furnishing: 'Unfurnished',
      bathrooms: 2,
      balconies: 1,
      parking: 'Bike',
      floor: '1st Floor',
      facing: 'East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Security'],
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Near Melaghat Road, Khatima',
        locality: 'Melaghat Road',
        city: 'Khatima',
        state: 'Uttarakhand',
        pincode: '262308',
        coordinates: { type: 'Point', coordinates: [79.9667, 28.9167] },
      },
      seller: seller1._id,
      isSponsored: false,
      viewsCount: 98,
      enquiriesCount: 2,
    },

    // --- DEHRADUN & HALDWANI ---
    {
      title: 'Luxury 3 BHK Penthouse with Panoramic Mussoorie Hills View',
      description:
        'Spectacular 3 BHK high-end penthouse on Rajpur Road, Dehradun. Unobstructed view of Mussoorie mountain range from wide wrap-around balconies. Italian marble flooring, designer modular kitchen with chimney and dishwasher, centralized AC, heated master bathrooms, double private parking, and luxury clubhouse access.',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      rent: 32000,
      securityDeposit: 60000,
      maintenance: 2500,
      areaSqFt: 2200,
      furnishing: 'Fully Furnished',
      bathrooms: 3,
      balconies: 3,
      parking: 'Covered',
      floor: '8th of 8 floors (Penthouse)',
      facing: 'North',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Lift', 'Gym', 'Swimming Pool', 'Security', 'CCTV', 'Power Backup', 'Club House', 'Gas Pipeline', 'Wi-Fi'],
      images: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Valley View Heights, Rajpur Road, Hathibarkala',
        locality: 'Rajpur Road',
        city: 'Dehradun',
        state: 'Uttarakhand',
        pincode: '248001',
        coordinates: { type: 'Point', coordinates: [78.0650, 30.3420] },
      },
      seller: seller2._id,
      isSponsored: true,
      sponsoredExpiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      viewsCount: 780,
      enquiriesCount: 24,
    },
    {
      title: 'Modern 2 BHK Gated Society Apartment near IT Park',
      description:
        'Spacious, well-lit 2 BHK flat in a gated residential community on Sahastradhara Road, Dehradun. Features 2 bedrooms with fitted wooden wardrobes, 2 western washrooms, modular kitchen, power backup, lift, and 24x7 security guards.',
      propertyType: 'Flat',
      bhk: '2 BHK',
      rent: 18500,
      securityDeposit: 35000,
      maintenance: 1500,
      areaSqFt: 1250,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 2,
      parking: 'Car',
      floor: '3rd of 6 floors',
      facing: 'East',
      preferredTenant: 'Anyone',
      availability: 'Immediate',
      amenities: ['Lift', 'Security', 'Power Backup', 'CCTV', 'Water Supply', 'Park', 'Wi-Fi'],
      images: [
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Green Valley Greens, Sahastradhara Road',
        locality: 'Sahastradhara Road',
        city: 'Dehradun',
        state: 'Uttarakhand',
        pincode: '248013',
        coordinates: { type: 'Point', coordinates: [78.0820, 30.3550] },
      },
      seller: seller2._id,
      isSponsored: false,
      viewsCount: 420,
      enquiriesCount: 11,
    },
    {
      title: 'Spacious 3 BHK Independent House with Lawn - Haldwani',
      description:
        'Peaceful 3 BHK duplex home on Kaladhungi Road, Haldwani. 15 minutes drive to Nainital foothills. Features private lawn, covered car parking, marble floors, airy rooms, and dedicated study room.',
      propertyType: 'House',
      bhk: '3 BHK',
      rent: 16000,
      securityDeposit: 30000,
      maintenance: 500,
      areaSqFt: 1600,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 2,
      parking: 'Covered',
      floor: '2 Floors Independent',
      facing: 'North-East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Water Supply', 'Parking', 'Power Backup', 'Park', 'Security'],
      images: [
        'https://images.unsplash.com/photo-1598228723793-52759bba239c?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Lane 5, Kaladhungi Road, Kusumkhera',
        locality: 'Kaladhungi Road',
        city: 'Haldwani',
        state: 'Uttarakhand',
        pincode: '263139',
        coordinates: { type: 'Point', coordinates: [79.5130, 29.2183] },
      },
      seller: seller2._id,
      isSponsored: false,
      viewsCount: 310,
      enquiriesCount: 8,
    },

    // --- DELHI NCR ---
    {
      title: 'Premium 3 BHK High-Rise Flat with Club Amenities - Sector 62',
      description:
        'Stunning 3 BHK apartment in an upscale high-rise residential complex in Sector 62, Noida. Stone throw from Metro Station and IT tech hubs. Amenities include swimming pool, Olympic-grade gym, indoor badminton court, 100% DG power backup, 3-tier biometric security, and dedicated basement car parking.',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      rent: 28000,
      securityDeposit: 50000,
      maintenance: 3000,
      areaSqFt: 1650,
      furnishing: 'Fully Furnished',
      bathrooms: 3,
      balconies: 3,
      parking: 'Covered',
      floor: '14th of 22 floors',
      facing: 'North-East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Lift', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'CCTV', 'Club House', 'Wi-Fi', 'Gas Pipeline'],
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Tower C, Stellar Park, Sector 62',
        locality: 'Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        coordinates: { type: 'Point', coordinates: [77.3620, 28.6250] },
      },
      seller: seller2._id,
      isSponsored: true,
      sponsoredExpiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
      viewsCount: 915,
      enquiriesCount: 32,
    },
    {
      title: 'Designer 2 BHK Builder Floor with Stilt Parking',
      description:
        'Prime South Delhi residential 2 BHK builder floor located in Defence Colony / South Extension. Top notch wooden interiors, Italian bathroom fittings, modular chimney kitchen, wide front balcony, elevator with stilt parking.',
      propertyType: 'Independent Floor',
      bhk: '2 BHK',
      rent: 35000,
      securityDeposit: 70000,
      maintenance: 2000,
      areaSqFt: 1300,
      furnishing: 'Fully Furnished',
      bathrooms: 2,
      balconies: 2,
      parking: 'Covered',
      floor: '2nd of 4 floors',
      facing: 'East',
      preferredTenant: 'Anyone',
      availability: 'Immediate',
      amenities: ['Lift', 'Security', 'Power Backup', 'CCTV', 'Wi-Fi', 'Water Supply'],
      images: [
        'https://images.unsplash.com/photo-1502005229762-ee1b2b892837?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'C-Block, Defence Colony Enclave',
        locality: 'Defence Colony',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110024',
        coordinates: { type: 'Point', coordinates: [77.2300, 28.5720] },
      },
      seller: seller2._id,
      isSponsored: false,
      viewsCount: 560,
      enquiriesCount: 18,
    },
    {
      title: 'Smart 1 BHK Studio Flat near Cyber City & Golf Course Ext',
      description:
        'Convenient 1 BHK studio flat in Sector 48, Gurgaon. 10 mins drive to Cyber City and Sohna Road tech parks. High speed fiber internet, smart TV, power backup, and gated entrance.',
      propertyType: 'Flat',
      bhk: '1 BHK',
      rent: 15000,
      securityDeposit: 25000,
      maintenance: 1000,
      areaSqFt: 650,
      furnishing: 'Fully Furnished',
      bathrooms: 1,
      balconies: 1,
      parking: 'Car',
      floor: '4th of 10 floors',
      facing: 'North',
      preferredTenant: 'Bachelor',
      availability: 'Immediate',
      amenities: ['Lift', 'Power Backup', 'Security', 'Wi-Fi', 'CCTV'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Tower 2, Central Park II, Sector 48',
        locality: 'Sector 48',
        city: 'Gurgaon',
        state: 'Haryana',
        pincode: '122018',
        coordinates: { type: 'Point', coordinates: [77.0390, 28.4180] },
      },
      seller: seller2._id,
      isSponsored: false,
      viewsCount: 380,
      enquiriesCount: 14,
    },

    // --- BANGALORE & PUNE ---
    {
      title: 'Ultra-Modern 3 BHK Luxury Flat in 100ft Road Indiranagar',
      description:
        'Prime tech-hub living! Luxurious 3 BHK apartment on 100ft Road, Indiranagar, Bangalore. Walking distance to elite cafes, metro, and restaurants. Italian marble, Bosch appliances, dedicated EV car charging slot, rooftop pool, and concierge desk.',
      propertyType: 'Apartment',
      bhk: '3 BHK',
      rent: 48000,
      securityDeposit: 150000,
      maintenance: 4000,
      areaSqFt: 1850,
      furnishing: 'Fully Furnished',
      bathrooms: 3,
      balconies: 2,
      parking: 'Covered',
      floor: '5th of 12 floors',
      facing: 'East',
      preferredTenant: 'Family',
      availability: 'Immediate',
      amenities: ['Lift', 'Gym', 'Swimming Pool', 'Security', 'Power Backup', 'CCTV', 'Club House', 'Wi-Fi', 'Gas Pipeline'],
      images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Prestige Boulevard, 100ft Road, Indiranagar',
        locality: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        coordinates: { type: 'Point', coordinates: [77.6408, 12.9784] },
      },
      seller: seller2._id,
      isSponsored: true,
      sponsoredExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      viewsCount: 1250,
      enquiriesCount: 45,
    },
    {
      title: 'Sunlit 2 BHK Flat near Tech Park - Bellandur Outer Ring Road',
      description:
        'Spacious 2 BHK home in Bellandur, Bengaluru. Ideal for tech professionals working in Ecospace, Prestige Tech Park, or Embassy Tech Village. Gated society with clubhouse, badminton court, lift, 24x7 security, and power backup.',
      propertyType: 'Flat',
      bhk: '2 BHK',
      rent: 26000,
      securityDeposit: 80000,
      maintenance: 2500,
      areaSqFt: 1200,
      furnishing: 'Semi Furnished',
      bathrooms: 2,
      balconies: 2,
      parking: 'Car',
      floor: '4th of 8 floors',
      facing: 'North-East',
      preferredTenant: 'Anyone',
      availability: 'Immediate',
      amenities: ['Lift', 'Security', 'Power Backup', 'CCTV', 'Gym', 'Park', 'Water Supply'],
      images: [
        'https://images.unsplash.com/photo-1502005229762-ee1b2b892837?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
      ],
      location: {
        address: 'Green Glen Layout, Bellandur',
        locality: 'Bellandur',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560103',
        coordinates: { type: 'Point', coordinates: [77.6750, 12.9304] },
      },
      seller: seller2._id,
      isSponsored: false,
      viewsCount: 640,
      enquiriesCount: 19,
    },
  ];

  const createdProperties = await Property.insertMany(propertiesData);

  // 3. Add sample favourites to customer
  customer1.favorites = [createdProperties[0]._id, createdProperties[1]._id];
  await customer1.save();

  // 4. Create sample enquiries
  await Enquiry.create({
    property: createdProperties[0]._id,
    customer: customer1._id,
    seller: seller1._id,
    fullName: 'Aarav Mehta',
    email: 'customer@rentora.com',
    phone: '+91 99887 76655',
    moveInDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    tenantType: 'Family',
    occupantsCount: 3,
    message:
      'Hello Rajesh Ji, I am relocating to Tanakpur for a government educational project. We are a family of 3. Is the house available from next Monday? Can we schedule a visit?',
    status: 'accepted',
    sellerResponse: 'Namaste Aarav Ji! Yes, the house is ready to move in. You are welcome to visit anytime between 10 AM to 5 PM.',
  });

  await Enquiry.create({
    property: createdProperties[1]._id,
    customer: customer2._id,
    seller: seller1._id,
    fullName: 'Simran Kaur',
    email: 'tenant@rentora.com',
    phone: '+91 97766 55443',
    moveInDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    tenantType: 'Working Professional',
    occupantsCount: 2,
    message: 'Hi, is this riverside villa pet-friendly? We have a small trained golden retriever.',
    status: 'pending',
  });

  // 5. Create sample visit request
  await Visit.create({
    property: createdProperties[0]._id,
    customer: customer1._id,
    seller: seller1._id,
    visitType: 'In-Person',
    preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    timeSlot: '10:00 AM - 12:00 PM',
    customerNotes: 'Looking forward to inspecting the garden and parking space.',
    status: 'confirmed',
    sellerNotes: 'Confirmed. I will meet you at the property gate at 10:30 AM.',
  });

  // 6. Create sample subscription payments
  await Payment.create({
    user: seller1._id,
    plan: 'pro',
    billingCycle: 'monthly',
    amount: 999,
    currency: 'INR',
    razorpayOrderId: 'order_rzp_mock_001',
    razorpayPaymentId: 'pay_rzp_mock_001',
    razorpaySignature: 'sig_mock_verified',
    status: 'captured',
    method: 'UPI (Google Pay)',
    invoiceNumber: 'INV-RENTORA-PRO-9821',
  });

  await Payment.create({
    user: seller2._id,
    plan: 'premium',
    billingCycle: 'yearly',
    amount: 24999,
    currency: 'INR',
    razorpayOrderId: 'order_rzp_mock_002',
    razorpayPaymentId: 'pay_rzp_mock_002',
    razorpaySignature: 'sig_mock_verified',
    status: 'captured',
    method: 'HDFC NetBanking',
    invoiceNumber: 'INV-RENTORA-PREM-5532',
  });

  console.log(`[Rentora Seed] Seeded ${createdProperties.length} rental properties across Tanakpur, Dehradun, Delhi, Bangalore!`);
};
