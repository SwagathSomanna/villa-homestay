import { Booking } from "../models/booking.model.js";
import crypto from "crypto";
import { VILLA_NAME, TARGET_TYPE } from "../constants.js";

function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d); // local midnight
}

//verify if the room is already booked
// 1. The current target checkin date must be more than any existing checkout date.
// 2. The current target checkout date must be less than any other existing checkIn dates
// 3. If anything gets booked, villa(whole) cant be booked.
// 4. If any of the rooms in a particular floor are booked, complete floor cant be booked(the other room can)

async function verifyRoomStatus(roomInfo) {
  if (!roomInfo.targetType || !TARGET_TYPE.includes(roomInfo.targetType)) {
    return res.status(400).json({ message: "Please select a valid entry " });
  }
  const existingCheckin = model.find();
}

export const bookVilla = async (req, res) => {
  try {
    const accessToken = crypto.randomBytes(32).toString("hex");

    const checkIn = parseDateOnly(req.body.checkIn);
    const checkOut = parseDateOnly(req.body.checkOut);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));

    const targetType = req.body.targetType;
    if (checkIn >= checkOut) {
      // validations
      return res
        .status(400)
        .json({ message: "CheckIn cannot be earlier than checkout" });
    }

    if (checkIn <= today) {
      return res.status(400).json({ message: "Please select a future date" });
    }

    //room availability validations

    return res.status(201).json({ message: "Booking successful" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const checkAvailability = async (req, res) => {};
