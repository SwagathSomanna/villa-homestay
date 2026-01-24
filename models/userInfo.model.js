//design flaw | redundant code, keepsake

import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfAdults: {
      type: Number,
    },
    numberOfChildren: {
      type: Number,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    bookingInfo: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model("User", userSchema);
