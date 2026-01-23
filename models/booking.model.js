import mongoose from "mongoose";

const { Schema } = mongoose;

const bookingSchema = new Schema({
  targetType: {
    type: String,
    enum: ["villa", "floor", "room"],
    required: true,
  },

  floorId: { type: String }, // only if targetType = "floor" or "room"
  roomId: { type: String }, // only if targetType = "room"

  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },

  status: {
    type: String,
    enum: ["pending", "paid", "cancelled", "blocked"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

export const Booking = mongoose.model("booking", bookingSchema);
