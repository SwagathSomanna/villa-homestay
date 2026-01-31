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
    status: { $in: ["paid", "blocked"] },
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
      status: { $in: ["paid", "blocked"] },
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
      status: { $in: ["paid", "blocked"] },
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
      status: { $in: ["paid", "blocked"] },
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

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const getBookedDates = async (req, res) => {
  try {
    const { targetType, roomId, floorId, startDate, endDate } = req.query;

    // Validate parameters
    if (!targetType || !TARGET_TYPE.includes(targetType)) {
      return res.status(400).json({
        message: "Invalid target type",
        bookedRanges: [],
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Start date and end date are required",
        bookedRanges: [],
      });
    }

    // Parse dates
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);

    // Build query based on target type
    let query = {
      status: "confirmed", // ← CRITICAL: Only show confirmed bookings
      $or: [
        // Bookings that overlap with the requested range
        {
          checkIn: { $lt: end },
          checkOut: { $gt: start },
        },
      ],
    };

    // Add target-specific filters
    if (targetType === "villa") {
      // For villa: show ALL confirmed bookings (room, floor, or villa)
      // Already covered by status: confirmed
    } else if (targetType === "floor") {
      if (!floorId) {
        return res.status(400).json({
          message: "Floor ID required for floor bookings",
          bookedRanges: [],
        });
      }

      const roomsInFloor = floorId === "F1" ? ["R1", "R2"] : ["R3", "R4"];

      // Show bookings that block this floor:
      // 1. Villa bookings
      // 2. This specific floor bookings
      // 3. Any room in this floor bookings
      query.$and = [
        {
          $or: [
            { targetType: "villa" },
            { targetType: "floor", floorId: floorId },
            { targetType: "room", roomId: { $in: roomsInFloor } },
          ],
        },
      ];
    } else if (targetType === "room") {
      if (!roomId) {
        return res.status(400).json({
          message: "Room ID required for room bookings",
          bookedRanges: [],
        });
      }

      const curFloorId = roomId === "R1" || roomId === "R2" ? "F1" : "F2";

      // Show bookings that block this room:
      // 1. Villa bookings
      // 2. The floor this room is in
      // 3. This specific room bookings
      query.$and = [
        {
          $or: [
            { targetType: "villa" },
            { targetType: "floor", floorId: curFloorId },
            { targetType: "room", roomId: roomId },
          ],
        },
      ];
    }

    // Fetch bookings
    const bookings = await Booking.find(query)
      .select("checkIn checkOut targetType roomId floorId")
      .sort({ checkIn: 1 });

    // Format response
    const bookedRanges = bookings.map((booking) => ({
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      targetType: booking.targetType,
      ...(booking.roomId && { roomId: booking.roomId }),
      ...(booking.floorId && { floorId: booking.floorId }),
    }));

    return res.status(200).json({
      bookedRanges,
    });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    return res.status(500).json({
      message: "Error fetching booked dates",
      bookedRanges: [],
    });
  }
};

/**
 * POST /api/booking/check-availability
 * Check if selected dates and target are available
 *
 * This endpoint uses your existing verifyRoomStatus function
 */
export const checkAvailability = async (req, res) => {
  try {
    const { targetType, roomId, floorId, checkIn, checkOut } = req.body;

    // Parse dates
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));

    // Basic date validations (before calling verifyRoomStatus)
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        available: false,
        message: "Check-in must be before check-out",
      });
    }

    if (checkInDate <= today) {
      return res.status(400).json({
        available: false,
        message: "Check-in must be in the future",
      });
    }

    // Prepare room info for your existing verification function
    const roomInfo = {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      targetType,
      roomId,
      floorId,
    };

    // Call your existing verifyRoomStatus function
    // It returns 1 if available, 0 if not (and sends response)
    const isAvailable = await verifyRoomStatus(roomInfo, res);

    // If verifyRoomStatus returned 0, it already sent the error response
    // So we only need to handle the success case (returns 1)
    if (isAvailable === 1) {
      return res.status(200).json({
        available: true,
        message: "Selected dates are available",
      });
    }

    // If we reach here, verifyRoomStatus already sent a response
    // Do nothing (response already sent)
  } catch (error) {
    console.error("Error checking availability:", error);

    // Only send response if one wasn't already sent
    if (!res.headersSent) {
      return res.status(500).json({
        available: false,
        message: "Error checking availability",
      });
    }
  }
};
