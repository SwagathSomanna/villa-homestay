import { Booking } from "../models/booking.model.js";
import { Villa } from "../models/villa.model.js";
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

async function verifyRoomStatus(roomInfo, res) {
  if (!roomInfo.targetType || !TARGET_TYPE.includes(roomInfo.targetType)) {
    res.status(400).json({ message: "Please select a valid entry " });
    return 0;
  }

  if (roomInfo.targetType === "floor") {
    if (!roomInfo.floorId) {
      return res.status(400).json({ message: "please select a valid floor" });
    }
    const floorSelection = await Villa.findOne({
      "floors.floorId": roomInfo?.floorId,
    });

    if (!floorSelection) {
      res.status(400).json({ message: "Please select a valid floor" });
      return 0;
    }
  }

  if (roomInfo.targetType === "room") {
    if (!roomInfo.roomId) {
      res.status(400).json({ message: "please select a valid room" });
      return 0;
    }
    const roomSelection = await Villa.findOne({
      "floors.rooms.roomId": roomInfo?.roomId,
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
    checkOut: { $gt: roomInfo.checkIn },
    checkIn: { $lt: roomInfo.checkOut },
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
      targetType: { $in: ["floor", "room"] },
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
      roomInfo.floorId === "F1" ? ["R1", "R2"] : ["R3", "R4"];

    //oh, apparently we cannot have two '$or' at the same level

    const overLappingBookings = await Booking.find({
      checkIn: { $lt: roomInfo.checkOut },
      checkOut: { $gt: roomInfo.checkIn },
      $or: [
        { targetType: "floor", floorId: roomInfo.floorId },
        { targetType: "room", roomId: { $in: roomsInFloor } },
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
    const curFloorId =
      roomInfo.roomId == "R1" || roomInfo.roomId == "R2" ? "F1" : "F2";
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
      return 0;
    }
  }
  return 1;
}

const getPrice = async (roomInfo) => {
  const villaInfo = await Villa.findOne({ name: VILLA_NAME });

  if (!villaInfo) {
    throw new Error("Villa configuration not found");
  }

  if (roomInfo.targetType === "villa") {
    return villaInfo.price * 100; //return in paisa
  }

  if (roomInfo.targetType === "floor") {
    const floor = villaInfo.floors.find((f) => f.floorId === roomInfo.floorId);

    if (!floor) {
      throw new Error("Invalid floor selected");
    }

    return floor.price * 100;
  }

  if (roomInfo.targetType === "room") {
    for (const floor of villaInfo.floors) {
      const room = floor.rooms.find((r) => r.roomId === roomInfo.roomId);

      if (room) {
        return room.price * 100;
      }
    }

    throw new Error("Invalid room selected");
  }

  throw new Error("Invalid target type");
};

//razorpay imports
import Razorpay from "razorpay";

export const bookVilla = async (req, res) => {
  try {
    const accessToken = crypto.randomBytes(32).toString("hex");

    const checkIn = parseDateOnly(req.body.checkIn);
    const checkOut = parseDateOnly(req.body.checkOut);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));

    if (checkIn >= checkOut) {
      // validations
      return res
        .status(400)
        .json({ message: "CheckIn cannot be earlier than checkout" });
    }

    if (checkIn <= today) {
      return res.status(400).json({ message: "Please select a future date" });
    }

    //verification of adults and children yet to be done
    const guestInfo = req.body.guest;
    if (!guestInfo?.name || !guestInfo?.email || !guestInfo?.phone) {
      return res
        .status(500)
        .json({ message: "Please fill all the required fields" });
    }

    if (Number.isNaN(guestInfo.adults) || Number.isNaN(guestInfo.children)) {
      return res.status(400).json({ message: "Invalid guest count" });
    }

    //room availability validations
    const roomInfo = {
      checkIn: checkIn,
      checkOut: checkOut,
      floorId: req.body?.floorId,
      roomId: req.body?.roomId,
      targetType: req.body?.targetType,
    };

    const isBookingAvailable = await verifyRoomStatus(roomInfo, res);
    if (!isBookingAvailable) {
      return null;
    }

    //fetching the price of the selected entries from the database
    const bookingPrice = await getPrice(roomInfo);
    //the order API will generate a unique razorpay toDateString();
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: bookingPrice,
      currency: "INR",
    });

    console.log(order);

    const createBooking = await Booking.create({
      guest: {
        ...guestInfo,
      },
      accessToken: accessToken,
      targetType: req.body.targetType,
      floorId: req.body?.floorId,
      roomId: req.body?.roomId,

      checkIn: checkIn,
      checkOut: checkOut,
      status: "pending",
      order: order,
    });

    const createdBooking = await Booking.findById(createBooking._id);
    if (!createdBooking) {
      return res
        .status(500)
        .json({ message: "Something went wrong while boooking" });
    }

    return res.status(201).json({
      message: "Booking successful",
      data: {
        name: createdBooking.guest?.name,
        email: createdBooking.guest?.email,
        phone: createdBooking.guest?.phone,
        checkIn: createdBooking.checkIn,
        checkOut: createdBooking.checkOut,
        accessToken: createdBooking.accessToken,
        bookingType: createdBooking.targetType,
        floorId: createdBooking?.floorId,
        roomId: createdBooking?.roomId,
        status: createdBooking?.status,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
