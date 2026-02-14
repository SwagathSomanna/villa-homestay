import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    guest: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      adults: {
        type: Number,
        min: 1,
        required: true,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    accessToken: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ["villa", "floor", "room"],
      required: true,
    },
    floorId: String,
    roomId: String,
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled", "blocked"],
      default: "pending",
    },

    // Razorpay payment fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    // Pricing information
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      }, // Base price per night (without modifiers)

      finalPrice: {
        type: Number,
        required: true,
      }, // Average price per night (with modifiers)

      totalPrice: {
        type: Number,
        required: true,
      }, // Total for entire stay

      paidAmount: {
        type: Number,
        default: 0,
      }, // Amount actually paid

      remainingAmount: {
        type: Number,
        required: true,
      }, // Amount still owed

      appliedRules: [
        {
          name: String,
          modifier: Number,
          type: {
            type: String,
            enum: ["percentage", "fixed"],
          },
        },
      ], // Summary of pricing rules applied

      nightBreakdown: [
        {
          date: Date,
          price: Number,
          appliedRules: [
            {
              name: String,
              modifier: Number,
              type: {
                type: String,
                enum: ["percentage", "fixed"],
              },
            },
          ],
        },
      ], // Detailed price per night
    },
  },
  { timestamps: true },
);

//every booking auto deletes after 45 days
bookingSchema.index({ checkOut: 1 }, { expireAfterSeconds: 3888000 }); // 45*24*60*60

export const Booking = mongoose.model("Booking", bookingSchema);
