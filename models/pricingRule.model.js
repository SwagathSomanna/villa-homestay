import mongoose from "mongoose";
const { Schema } = mongoose;

const pricingRuleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      // e.g., "Weekend Premium", "Christmas Holiday", "Summer Season"
    },

    description: String,

    // Date range for this pricing rule
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // What does this rule apply to?
    appliesTo: {
      type: String,
      enum: ["villa", "floor", "room", "all"],
      required: true,
    },

    // Specific targets (optional - if appliesTo is not "all")
    targetFloorId: String, // "F1", "F2" - only if appliesTo is "floor"
    targetRoomId: String, // "R1", "R2", etc. - only if appliesTo is "room"

    // Pricing modifier
    modifierType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    modifierValue: {
      type: Number,
      required: true,
      // If percentage: 20 means +20%
      // If fixed: 5000 means +₹5000
    },

    // Days of week (for recurring rules like weekends)
    daysOfWeek: [
      {
        type: Number,
        min: 0,
        max: 6,
        // 0=Sunday, 1=Monday, ..., 6=Saturday
      },
    ],

    // Priority (higher number = higher priority if rules overlap)
    priority: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdBy: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true },
);

export const PricingRule = mongoose.model("PricingRule", pricingRuleSchema);
