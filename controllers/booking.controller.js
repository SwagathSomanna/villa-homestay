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

  //check if the whole villa is booked (need to checked invariably, written outside).
  //todo | return the available dates
  const isVillaBooked = await Booking.findOne({
    targetType: "villa",
    checkOut: { $lt: roomInfo.checkIn },
  });
  if (isVillaBooked) {
    res.status(400).json({
      message: "The villa is booked, please select a different date",
    });
    return 0;
  }

  //villa verifcation
  if (roomInfo.targetType === "villa") {
    const overLappingBookings = await Booking.find({
      checkIn: { $lt: roomInfo.checkOut },
      checkOut: { $gt: roomInfo.checkIn },
      $or: [
        { targetType: "floor", floorId: roomInfo.floorId },
        { targetType: "room", roomId: roomInfo.roomId },
      ],
    });

    if (overLappingBookings.length) {
      res.status(400).json({
        message:
          "Villa cant be booked for the selected dates. Please select a different date",
      });
      return 0;
    }
  }

  //floor verification
  //for f1 - check villa, f1, r1, r2
  //for f2 - check villa, f2, r3, r4
  else if (roomInfo.targetType === "floor") {
    const roomsInFloor =
      roomInfo.floorId === "F1"
        ? [{ roomId: "R1" }, { roomId: "R2" }]
        : [{ roomId: "R3" }, { roomId: "R4" }];

    //oh, apparently we cannot have two '$or' at the same level

    const roomIds = roomsInFloor.map((r) => r.roomId);

    const overLappingBookings = await Booking.find({
      checkIn: { $lt: roomInfo.checkOut },
      checkOut: { $gt: roomInfo.checkIn },
      $or: [
        { targetType: "floor", floorId: roomInfo.floorId },
        { targetType: "room", roomId: { $in: roomIds } },
      ],
    });

    if (overLappingBookings.length > 0) {
      res.status(400).json({
        message: "Floors/rooms are booked for the selected dates.",
      });
      return 0;
    }
  }

  //check for rooms
  if (roomInfo.targetType === "room") {
    roomInfo.roomId == "R1" || roomInfo.roomId == "R2"
      ? (curFloorId = "F1")
      : (curFloorId = "F2");
  }
  //check if that floor is booked on that particular room is booked
  const overLappingBookings = await Booking.find({
    checkIn: { $lt: roomInfo.checkOut },
    checkOut: { $gt: roomInfo.checkIn },
    $or: [
      { targetType: "floor", floorId: curFloorId },
      { targetType: "room", roomId: roomInfo.roomId },
    ],
  });

  if (overLappingBookings.length > 0) {
    res
      .status(400)
      .json({ message: "Rooms not avaibable for the selected Dates." });
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
    const roomInfo = {
      checkIn: checkIn,
      checkOut: checkOut,
      floorId: Number(req.body?.floorId),
      roomId: Number(req.body?.roomId),
    };

    return res.status(201).json({ message: "Booking successful" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const checkAvailability = async (req, res) => {};
