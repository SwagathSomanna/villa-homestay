import mongoose from "mongoose";
const { Schema } = mongoose;

//cant use isbooked here, cos automatically, it doesnt become false.

const roomSchema = new Schema({
  roomId: { type: String, required: true }, // e.g. "R1", "R2"
  name: String,
  price: Number,
});

const floorSchema = new Schema({
  floorId: { type: String, required: true }, // e.g. "F1", "F2"
  name: String,
  price: Number,
  rooms: [roomSchema],
});

const villaSchema = new Schema({
  name: { type: String, required: true },
  price: Number, // whole-villa price
  floors: [floorSchema],
  isActive: { type: Boolean, default: true },
});

export const Villa = mongoose.model("villa", villaSchema);
