import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    guest: {
      name: String,
      email: String,
      phone: String,
      adults: Number,
      children: Number,
    },

    accessToken: { type: String, required: true },

    targetType: { type: String, enum: ["villa", "floor", "room"] },
    floorId: String,
    roomId: String,

    checkIn: Date,
    checkOut: Date,

    status: { type: String, enum: ["pending", "paid", "cancelled", "blocked"] },

    paymentId: String,
  },
  { timestamps: true },
);

export const Booking = mongoose.model("booking", bookingSchema);
