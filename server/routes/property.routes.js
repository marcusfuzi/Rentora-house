import express from 'express';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { geocodeLocation, calculateDistanceKm } from '../utils/geocoder.js';

const router = express.Router();

// @route   GET /api/properties/sponsored/featured
// @desc    Get top sponsored / featured properties for showcase
// @access  Public
router.get('/sponsored/featured', async (req, res) => {
  try {
    const sponsored = await Property.find({
      status: 'active',
      isSponsored: true,
    })
      .populate('seller', 'name phone isVerified subscription')
      .sort({ updatedAt: -1 })
      .limit(6);

    // If less than 6 sponsored, fill with top viewed active properties marked as featured
    let featured = [...sponsored];
    if (featured.length < 6) {
      const extra = await Property.find({
        status: 'active',
        _id: { $nin: sponsored.map((p) => p._id) },
      })
        .populate('seller', 'name phone isVerified subscription')
        .sort({ viewsCount: -1, rent: 1 })
        .limit(6 - featured.length);

      featured = [...featured, ...extra];
    }

    res.json({
      success: true,
      count: featured.length,
      data: featured,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured properties',
    });
  }
});

// @route   GET /api/properties/seller/my-listings
// @desc    Get all listings belonging to current seller
// @access  Private (Seller/Admin)
router.get('/seller/my-listings', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const properties = await Property.find({ seller: req.user._id }).sort({ createdAt: -1 });

    const totalListings = properties.length;
    const activeListings = properties.filter((p) => p.status === 'active').length;
    const rentedListings = properties.filter((p) => p.status === 'rented').length;
    const sponsoredListings = properties.filter((p) => p.isSponsored).length;
    const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalEnquiries = properties.reduce((acc, p) => acc + (p.enquiriesCount || 0), 0);

    res.json({
      success: true,
      stats: {
        totalListings,
        activeListings,
        rentedListings,
        sponsoredListings,
        totalViews,
        totalEnquiries,
      },
      data: properties,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller listings',
    });
  }
});

// @route   GET /api/properties
// @desc    Search and filter properties with smart ranking & distance
// @access  Public (supports optionalAuth to mark favorites)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      location,
      lat,
      lng,
      radius = 20, // default 20km
      propertyType,
      bhk,
      minRent,
      maxRent,
      furnishing,
      bathrooms,
      parking,
      balconies,
      minArea,
      maxArea,
      preferredTenant,
      availability,
      amenities,
      sort = 'smart', // 'smart', 'price_asc', 'price_desc', 'nearest', 'newest'
    } = req.query;

    const query = { status: 'active' };

    // 1. Text Search across Title, Description, Locality, City
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { 'location.locality': { $regex: term, $options: 'i' } },
        { 'location.city': { $regex: term, $options: 'i' } },
        { 'location.pincode': { $regex: term, $options: 'i' } },
      ];
    }

    // 2. Location Geocoding & Radius Filtering
    let targetLat = lat ? parseFloat(lat) : null;
    let targetLng = lng ? parseFloat(lng) : null;
    let resolvedLocationName = null;

    if (location && location.trim()) {
      const geoResult = await geocodeLocation(location.trim());
      if (geoResult) {
        targetLat = geoResult.lat;
        targetLng = geoResult.lng;
        resolvedLocationName = geoResult.displayName;
      } else {
        // Fallback: simple text match on city or locality
        query.$or = query.$or || [];
        query.$or.push(
          { 'location.city': { $regex: location.trim(), $options: 'i' } },
          { 'location.locality': { $regex: location.trim(), $options: 'i' } }
        );
      }
    }

    // 3. Property Type Filter
    if (propertyType) {
      const types = Array.isArray(propertyType)
        ? propertyType
        : propertyType.split(',').map((t) => t.trim());
      query.propertyType = { $in: types };
    }

    // 4. BHK Filter
    if (bhk) {
      const bhkList = Array.isArray(bhk) ? bhk : bhk.split(',').map((b) => b.trim());
      query.bhk = { $in: bhkList };
    }

    // 5. Rent Range
    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = Number(minRent);
      if (maxRent) query.rent.$lte = Number(maxRent);
    }

    // 6. Furnishing
    if (furnishing) {
      const furnList = Array.isArray(furnishing)
        ? furnishing
        : furnishing.split(',').map((f) => f.trim());
      query.furnishing = { $in: furnList };
    }

    // 7. Bathrooms
    if (bathrooms) {
      const numBaths = parseInt(bathrooms, 10);
      if (!isNaN(numBaths)) {
        if (numBaths >= 4) {
          query.bathrooms = { $gte: 4 };
        } else {
          query.bathrooms = { $gte: numBaths };
        }
      }
    }

    // 8. Parking
    if (parking && parking !== 'All') {
      const parkList = Array.isArray(parking) ? parking : parking.split(',').map((p) => p.trim());
      query.parking = { $in: parkList };
    }

    // 9. Balconies
    if (balconies) {
      query.balconies = { $gte: Number(balconies) };
    }

    // 10. Area (Sq Ft)
    if (minArea || maxArea) {
      query.areaSqFt = {};
      if (minArea) query.areaSqFt.$gte = Number(minArea);
      if (maxArea) query.areaSqFt.$lte = Number(maxArea);
    }

    // 11. Preferred Tenant
    if (preferredTenant && preferredTenant !== 'Anyone') {
      query.preferredTenant = { $in: [preferredTenant, 'Anyone'] };
    }

    // 12. Availability
    if (availability) {
      query.availability = availability;
    }

    // 13. Amenities (must include all selected amenities)
    if (amenities) {
      const amenList = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim());
      query.amenities = { $all: amenList };
    }

    // Execute query
    let properties = await Property.find(query)
      .populate('seller', 'name phone isVerified subscription')
      .lean();

    // Calculate distance for each property if target coordinates exist
    const radiusKm = parseFloat(radius) || 50;
    if (targetLat !== null && targetLng !== null) {
      properties = properties.map((prop) => {
        const [propLng, propLat] = prop.location.coordinates.coordinates || [0, 0];
        const dist = calculateDistanceKm(targetLat, targetLng, propLat, propLng);
        return {
          ...prop,
          distanceKm: dist,
        };
      });

      // If user filtered by location or radius, keep properties within radius
      // But if results are few (< 2), include nearby properties so user gets good recommendations
      if (location || (lat && lng)) {
        const inRadius = properties.filter(
          (p) => p.distanceKm !== null && p.distanceKm <= radiusKm
        );
        if (inRadius.length > 0) {
          properties = inRadius;
        }
      }
    }

    // Attach isFavorited if logged in
    let favoriteIds = new Set();
    if (req.user && req.user.favorites) {
      favoriteIds = new Set(req.user.favorites.map((f) => f.toString()));
    }

    properties = properties.map((p) => ({
      ...p,
      isFavorited: favoriteIds.has(p._id.toString()),
    }));

    // --- SMART RANKING SYSTEM ---
    // Rule:
    // 1. Sponsored properties ALWAYS come first (clearly marked as sponsored).
    // 2. Following sponsored properties, organic results sorted according to user selection:
    //    - Default ('smart'): Lowest price first
    //    - 'price_asc': Lowest price first
    //    - 'price_desc': Highest price first
    //    - 'nearest': Closest distance first
    //    - 'newest': Recently added first
    //    - 'relevance': Views / match

    const sponsoredProps = properties.filter((p) => p.isSponsored);
    const organicProps = properties.filter((p) => !p.isSponsored);

    const sortFn = (a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.rent - b.rent;
        case 'price_desc':
          return b.rent - a.rent;
        case 'nearest':
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return (a.distanceKm || 9999) - (b.distanceKm || 9999);
          }
          return a.rent - b.rent;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'smart':
        default:
          // Lowest price first as requested:
          // "After sponsored listings, show organic results sorted by lowest price by default."
          return a.rent - b.rent;
      }
    };

    sponsoredProps.sort(sortFn);
    organicProps.sort(sortFn);

    const finalProperties = [...sponsoredProps, ...organicProps];

    res.json({
      success: true,
      count: finalProperties.length,
      sponsoredCount: sponsoredProps.length,
      targetCoordinates: targetLat && targetLng ? { lat: targetLat, lng: targetLng } : null,
      resolvedLocation: resolvedLocationName,
      data: finalProperties,
    });
  } catch (error) {
    console.error('Property search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching properties',
    });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property details and increment view count
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'seller',
      'name phone email avatar isVerified subscription createdAt'
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    // Increment views
    property.viewsCount = (property.viewsCount || 0) + 1;
    await property.save();

    let isFavorited = false;
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user && user.favorites) {
        isFavorited = user.favorites.some((f) => f.toString() === property._id.toString());
      }
    }

    res.json({
      success: true,
      data: {
        ...property.toObject(),
        isFavorited,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve property details',
    });
  }
});

// @route   POST /api/properties
// @desc    Create a new property listing
// @access  Private (Seller/Admin)
router.post('/', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);

    // Check listing limits based on subscription plan
    const currentListingCount = await Property.countDocuments({
      seller: req.user._id,
      status: { $ne: 'suspended' },
    });

    const listingLimit = seller.subscription?.listingLimit || 2;
    if (currentListingCount >= listingLimit) {
      return res.status(403).json({
        success: false,
        message: `You have reached your limit of ${listingLimit} listings on the ${
          seller.subscription?.plan || 'Free'
        } plan. Please upgrade to Pro or Premium to list more properties.`,
        limitReached: true,
      });
    }

    const {
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
      balconies,
      parking,
      floor,
      facing,
      preferredTenant,
      availability,
      availableFrom,
      amenities,
      images,
      location,
    } = req.body;

    if (!title || !description || !propertyType || !bhk || !rent || !areaSqFt || !furnishing) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory property details',
      });
    }

    if (!location || !location.address || !location.city || !location.locality) {
      return res.status(400).json({
        success: false,
        message: 'Complete address, city, and locality are required',
      });
    }

    // Resolve coordinates if not supplied
    let coordinates = location.coordinates?.coordinates;
    if (!coordinates || coordinates.length !== 2) {
      const geo = await geocodeLocation(`${location.locality}, ${location.city}`);
      if (geo) {
        coordinates = [geo.lng, geo.lat];
      } else {
        coordinates = [80.1084, 29.0718]; // Default Tanakpur coordinates
      }
    }

    const property = await Property.create({
      title: title.trim(),
      description: description.trim(),
      propertyType,
      bhk,
      rent: Number(rent),
      securityDeposit: securityDeposit ? Number(securityDeposit) : Number(rent) * 2,
      maintenance: maintenance ? Number(maintenance) : 0,
      areaSqFt: Number(areaSqFt),
      furnishing,
      bathrooms: Number(bathrooms) || 1,
      balconies: Number(balconies) || 1,
      parking: parking || 'None',
      floor: floor || '1st Floor',
      facing: facing || 'East',
      preferredTenant: preferredTenant || 'Anyone',
      availability: availability || 'Immediate',
      availableFrom: availableFrom || Date.now(),
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop'
      ],
      location: {
        address: location.address.trim(),
        locality: location.locality.trim(),
        city: location.city.trim(),
        state: location.state || '',
        pincode: location.pincode || '',
        coordinates: {
          type: 'Point',
          coordinates,
        },
      },
      seller: req.user._id,
      status: 'active',
      isSponsored: false,
    });

    res.status(201).json({
      success: true,
      message: 'Property listing created successfully!',
      data: property,
    });
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create property listing',
    });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property listing
// @access  Private (Owner Seller / Admin)
router.put('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
    }

    const updates = { ...req.body };
    // Keep seller immutable
    delete updates.seller;

    // If address changed, re-geocode
    if (updates.location && (!updates.location.coordinates || !updates.location.coordinates.coordinates)) {
      const geo = await geocodeLocation(`${updates.location.locality}, ${updates.location.city}`);
      if (geo) {
        updates.location.coordinates = {
          type: 'Point',
          coordinates: [geo.lng, geo.lat],
        };
      }
    }

    property = await Property.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update property',
    });
  }
});

// @route   PATCH /api/properties/:id/status
// @desc    Change property status (active, rented, inactive)
// @access  Private (Owner Seller / Admin)
router.patch('/:id/status', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'rented', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    property.status = status;
    await property.save();

    res.json({
      success: true,
      message: `Property marked as ${status}`,
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// @route   POST /api/properties/:id/sponsor
// @desc    Toggle sponsored listing status using seller subscription slots
// @access  Private (Seller)
router.post('/:id/sponsor', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const seller = await User.findById(req.user._id);

    // If currently sponsored, allow unsponsoring
    if (property.isSponsored) {
      property.isSponsored = false;
      property.sponsoredExpiresAt = null;
      await property.save();

      // Free a slot
      if (seller.subscription.sponsoredSlotsUsed > 0) {
        seller.subscription.sponsoredSlotsUsed -= 1;
        await seller.save();
      }

      return res.json({
        success: true,
        message: 'Property is no longer sponsored.',
        isSponsored: false,
      });
    }

    // Sponsoring: check seller subscription
    const maxSlots = seller.subscription?.sponsoredSlots || 0;
    const usedSlots = seller.subscription?.sponsoredSlotsUsed || 0;

    if (usedSlots >= maxSlots && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `You have used all ${maxSlots} sponsored slots included in your ${
          seller.subscription?.plan?.toUpperCase() || 'FREE'
        } plan. Please upgrade to Pro or Premium to sponsor more listings.`,
        needsUpgrade: true,
      });
    }

    property.isSponsored = true;
    property.sponsoredExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await property.save();

    seller.subscription.sponsoredSlotsUsed = usedSlots + 1;
    await seller.save();

    res.json({
      success: true,
      message: 'Listing successfully promoted to Sponsored! It will now appear at the top of search results.',
      isSponsored: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to sponsor listing' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Owner Seller / Admin)
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Property removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
});

export default router;
