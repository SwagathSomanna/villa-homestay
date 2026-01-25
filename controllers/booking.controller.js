import { Booking } from "../models/booking.model.js";
import crypto from "crypto";
import { VILLA_NAME, TARGET_TYPE } from "../constants.js";

//this is done so that all checks are done only on date basis
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
    res.status(400).json({ message: "Please select a valid entry " });
    return 0;
  }

  if (roomInfo.targetType === "floor") {
    const floorSelection = await Booking.findOne({
      targetType: "floor",
      floodId: roomInfo?.floorId,
    });

    if (!floorSelection) {
      res.status(400).json({ message: "Please select a valid floor" });
      return 0;
    }
  }

  if (roomInfo.targetType === "room") {
    const roomSelection = await Booking.findOne({
      targetType: "room",
      floorId: roomInfo?.roomId,
    });

    if (!roomSelection) {
      res.status(400).json({ message: "Please select a valid room" });
      return 0;
    }
  }

  if (roomInfo.targetType === "villa") {
    //check if two bookings overlap
    const curMaxCheckout = Booking.find({
      checkOut: { $gt: roomInfo.checkOut },
    });
    const curMinCheckout = Booking.find({
      checkIn: { $lt: roomInfo.checkIn },
    });

    //cos model.find invariably returns an array. yea yea i could've used findone
    if (!curMaxCheckout.length || !curMinCheckout.length) {
      res
        .status(400)
        .json({ message: "Villa is not available for the selected dates" });
      return 0;
    }
  }

  //for f1 - check f1, r1, r2
  else if (roomInfo.targetType === "floor") {
    const roomsInFloor =
      roomInfo.floorId === "F1"
        ? [{ roomId: "R1" }, { roomId: "R2" }]
        : [{ roomId: "R3" }, { roomId: "R4" }];

    const curMaxCheckoutFloor = Booking.find({
      targetType: floor,
      floorId: roomInfo.floorId,
      $or: [...roomsInFloor],
      checkOut: { $gt: roomInfo.checkOut },
    });
  }
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
