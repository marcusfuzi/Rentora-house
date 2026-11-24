import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
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
    visitType: {
      type: String,
      enum: ['In-Person', 'Virtual Video Tour'],
      default: 'In-Person',
    },
    preferredDate: {
      type: Date,
      required: [true, 'Visit date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: [
        '10:00 AM - 12:00 PM',
        '12:00 PM - 02:00 PM',
        '02:00 PM - 04:00 PM',
        '04:00 PM - 06:00 PM',
        '06:00 PM - 08:00 PM',
      ],
      default: '10:00 AM - 12:00 PM',
    },
    customerNotes: {
      type: String,
      trim: true,
      default: '',
    },
    sellerNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'completed', 'rescheduled', 'cancelled'],
      default: 'requested',
    },
  },
  {
    timestamps: true,
  }
);

visitSchema.index({ seller: 1, preferredDate: 1 });
visitSchema.index({ customer: 1, createdAt: -1 });

export const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
