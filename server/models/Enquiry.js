import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Tenant email is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Tenant phone number is required'],
      trim: true,
    },
    moveInDate: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    tenantType: {
      type: String,
      enum: ['Family', 'Working Professional', 'Bachelor', 'Student', 'Corporate'],
      default: 'Family',
    },
    occupantsCount: {
      type: Number,
      default: 1,
    },
    message: {
      type: String,
      required: [true, 'Enquiry message is required'],
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'accepted', 'rejected'],
      default: 'pending',
    },
    sellerResponse: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

enquirySchema.index({ seller: 1, createdAt: -1 });
enquirySchema.index({ customer: 1, createdAt: -1 });

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
export default Enquiry;
