import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    guest: {
      name: {
        type: String,
        required: true,
      },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      adults: { type: Number, min: 1 },
      children: Number,
    },

    accessToken: { type: String, required: true },

    targetType: { type: String, enum: ["villa", "floor", "room"] },
    floorId: String,
    roomId: String,

    checkIn: Date,
    checkOut: Date,

    status: { type: String, enum: ["pending", "paid", "cancelled", "blocked"] },

    razorpayOrderId: String,
    paymentId: String,
  },
  { timestamps: true },
);

export const Booking = mongoose.model("booking", bookingSchema);
