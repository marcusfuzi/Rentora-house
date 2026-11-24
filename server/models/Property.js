import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
      maxlength: 3000,
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: ['House', 'Flat', 'Apartment', 'Villa', 'Independent Floor'],
    },
    bhk: {
      type: String,
      required: [true, 'BHK configuration is required'],
      enum: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'],
    },
    rent: {
      type: Number,
      required: [true, 'Monthly rental amount is required'],
      min: [500, 'Rent must be at least ₹500/month'],
    },
    securityDeposit: {
      type: Number,
      required: [true, 'Security deposit is required'],
      default: function () {
        return this.rent ? this.rent * 2 : 10000;
      },
    },
    maintenance: {
      type: Number,
      default: 0,
    },
    areaSqFt: {
      type: Number,
      required: [true, 'Property area in sq ft is required'],
      min: [50, 'Area must be at least 50 sq ft'],
    },
    furnishing: {
      type: String,
      required: [true, 'Furnishing status is required'],
      enum: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
    },
    bathrooms: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 10,
    },
    balconies: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    parking: {
      type: String,
      enum: ['Car', 'Bike', 'Both', 'Covered', 'None'],
      default: 'None',
    },
    floor: {
      type: String,
      default: 'Ground Floor',
    },
    facing: {
      type: String,
      default: 'North-East',
    },
    preferredTenant: {
      type: String,
      enum: ['Family', 'Bachelor', 'Students', 'Anyone'],
      default: 'Anyone',
    },
    availability: {
      type: String,
      enum: ['Immediate', 'Available Soon', 'Within 15 Days', 'Within 30 Days'],
      default: 'Immediate',
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one property image is required',
      },
    },
    location: {
      address: {
        type: String,
        required: [true, 'Full address is required'],
        trim: true,
      },
      locality: {
        type: String,
        required: [true, 'Locality/Area name is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City name is required'],
        trim: true,
      },
      state: {
        type: String,
        default: '',
        trim: true,
      },
      pincode: {
        type: String,
        default: '',
        trim: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        // GeoJSON standard: [longitude, latitude]
        coordinates: {
          type: [Number],
          required: true,
          default: [79.2064, 29.0718], // Default to Tanakpur [lng, lat]
        },
      },
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isSponsored: {
      type: Boolean,
      default: false,
    },
    sponsoredExpiresAt: {
      type: Date,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'rented', 'inactive', 'pending_approval', 'suspended'],
      default: 'active',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    enquiriesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for distance queries
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Compound and text indexes for search performance
propertySchema.index({
  title: 'text',
  description: 'text',
  'location.locality': 'text',
  'location.city': 'text',
  'location.pincode': 'text',
});

propertySchema.index({ status: 1, isSponsored: -1, rent: 1 });
propertySchema.index({ 'location.city': 1, status: 1 });

export const Property = mongoose.model('Property', propertySchema);
export default Property;
