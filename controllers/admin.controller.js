import { Booking } from "../models/booking.model.js";
import { PricingRule } from "../models/pricingRule.model.js";

function parseDateOnly(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const getBooking = async (req, res) => {
  try {
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));
    const existingBookings = await Booking.find({
      checkOut: { $gte: today },
      status: { $in: ["paid", "blocked"] },
    });

    // console.log(existingBookings);
    return res.status(200).json(existingBookings);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went Wrong" });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { checkIn, checkOut, status, targetType, floorId, roomId } = req.body;

    // Find existing booking
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Parse dates if provided
    let newCheckIn = checkIn ? parseDateOnly(checkIn) : existingBooking.checkIn;
    let newCheckOut = checkOut
      ? parseDateOnly(checkOut)
      : existingBooking.checkOut;
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));

    // Date validations
    if (newCheckIn >= newCheckOut) {
      return res.status(400).json({
        message: "Check-in cannot be later than or equal to check-out",
      });
    }

    if (newCheckIn <= today && existingBooking.checkIn > today) {
      return res.status(400).json({
        message: "Cannot move future booking to a past date",
      });
    }

    // If dates or booking target changed, verify availability
    const hasDateChange = checkIn || checkOut;
    const hasTargetChange = targetType || floorId || roomId;

    if (hasDateChange || hasTargetChange) {
      const newTargetType = targetType || existingBooking.targetType;
      const newFloorId = floorId || existingBooking.floorId;
      const newRoomId = roomId || existingBooking.roomId;

      // Check conflicts, excluding current booking
      const conflictingBookings = await Booking.find({
        _id: { $ne: bookingId },
        checkIn: { $lt: newCheckOut },
        checkOut: { $gt: newCheckIn },
        status: { $in: ["paid", "pending", "blocked"] },
      });

      let hasConflict = false;

      if (newTargetType === "villa") {
        hasConflict = conflictingBookings.some(
          (b) => b.targetType === "floor" || b.targetType === "room",
        );
      } else if (newTargetType === "floor") {
        const roomsInFloor = newFloorId === "F1" ? ["R1", "R2"] : ["R3", "R4"];
        hasConflict = conflictingBookings.some(
          (b) =>
            b.targetType === "villa" ||
            (b.targetType === "floor" && b.floorId === newFloorId) ||
            (b.targetType === "room" && roomsInFloor.includes(b.roomId)),
        );
      } else if (newTargetType === "room") {
        const curFloorId = ["R1", "R2"].includes(newRoomId) ? "F1" : "F2";
        hasConflict = conflictingBookings.some(
          (b) =>
            b.targetType === "villa" ||
            (b.targetType === "floor" && b.floorId === curFloorId) ||
            (b.targetType === "room" && b.roomId === newRoomId),
        );
      }

      if (hasConflict) {
        return res.status(400).json({
          message: "Cannot update - conflicts with existing bookings",
        });
      }
    }

    // Validate status change
    if (status) {
      const validStatuses = ["pending", "paid", "cancelled", "blocked"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      if (existingBooking.status === "paid" && status === "pending") {
        return res.status(400).json({
          message:
            "Cannot change paid booking to pending. Consider cancellation instead.",
        });
      }
    }

    // Build update object
    const updateData = {};
    if (checkIn) updateData.checkIn = newCheckIn;
    if (checkOut) updateData.checkOut = newCheckOut;
    if (status) updateData.status = status;
    if (targetType) updateData.targetType = targetType;
    if (floorId !== undefined) updateData.floorId = floorId;
    if (roomId !== undefined) updateData.roomId = roomId;

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { permanent } = req.query;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (permanent === "true") {
      await Booking.findByIdAndDelete(bookingId);
      return res.status(200).json({
        message: "Booking permanently deleted",
      });
    } else {
      booking.status = "cancelled";
      await booking.save();

      return res.status(200).json({
        message: "Booking cancelled successfully",
        data: booking,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createBlockedDates = async (req, res) => {
  try {
    const { checkIn, checkOut, targetType, floorId, roomId, reason } = req.body;

    const parsedCheckIn = parseDateOnly(checkIn);
    const parsedCheckOut = parseDateOnly(checkOut);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));

    if (parsedCheckIn >= parsedCheckOut) {
      return res
        .status(400)
        .json({ message: "Check-in must be before check-out" });
    }

    if (parsedCheckIn <= today) {
      return res.status(400).json({ message: "Please select a future date" });
    }

    // Check conflicts
    const conflictingBookings = await Booking.find({
      checkIn: { $lt: parsedCheckOut },
      checkOut: { $gt: parsedCheckIn },
      status: { $in: ["paid", "pending", "blocked"] },
    });

    let hasConflict = false;

    if (targetType === "villa") {
      hasConflict = conflictingBookings.length > 0;
    } else if (targetType === "floor") {
      const roomsInFloor = floorId === "F1" ? ["R1", "R2"] : ["R3", "R4"];
      hasConflict = conflictingBookings.some(
        (b) =>
          b.targetType === "villa" ||
          (b.targetType === "floor" && b.floorId === floorId) ||
          (b.targetType === "room" && roomsInFloor.includes(b.roomId)),
      );
    } else if (targetType === "room") {
      const curFloorId = ["R1", "R2"].includes(roomId) ? "F1" : "F2";
      hasConflict = conflictingBookings.some(
        (b) =>
          b.targetType === "villa" ||
          (b.targetType === "floor" && b.floorId === curFloorId) ||
          (b.targetType === "room" && b.roomId === roomId),
      );
    }

    if (hasConflict) {
      return res.status(400).json({
        message: "Cannot block - conflicts with existing bookings",
      });
    }

    // Create blocked booking
    const blockedBooking = await Booking.create({
      guest: {
        name: "BLOCKED",
        email: "admin@villa.com",
        phone: "0000000000",
        adults: 0,
        children: 0,
      },
      accessToken: "BLOCKED",
      targetType,
      floorId,
      roomId,
      checkIn: parsedCheckIn,
      checkOut: parsedCheckOut,
      status: "blocked",
      paymentId: reason || "Admin blocked dates",
    });

    return res.status(201).json({
      message: "Dates blocked successfully",
      data: blockedBooking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// PRICING RULES MANAGEMENT

export const createPricingRule = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      appliesTo,
      targetFloorId,
      targetRoomId,
      modifierType,
      modifierValue,
      daysOfWeek,
      priority,
    } = req.body;

    // Validation
    if (
      !name ||
      !startDate ||
      !endDate ||
      !appliesTo ||
      !modifierType ||
      modifierValue === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res
        .status(400)
        .json({ message: "Start date must be before end date" });
    }

    // Create rule
    const pricingRule = await PricingRule.create({
      name,
      description,
      startDate: start,
      endDate: end,
      appliesTo,
      targetFloorId,
      targetRoomId,
      modifierType,
      modifierValue,
      daysOfWeek: daysOfWeek || [],
      priority: priority || 0,
      isActive: true,
    });

    return res.status(201).json({
      message: "Pricing rule created successfully",
      data: pricingRule,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAllPricingRules = async (req, res) => {
  try {
    const { active } = req.query;

    const filter = {};
    if (active === "true") {
      filter.isActive = true;
    }

    const rules = await PricingRule.find(filter).sort({
      priority: -1,
      startDate: 1,
    });

    return res.status(200).json(rules);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updatePricingRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await PricingRule.findByIdAndUpdate(
      ruleId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!rule) {
      return res.status(404).json({ message: "Pricing rule not found" });
    }

    return res.status(200).json({
      message: "Pricing rule updated successfully",
      data: rule,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletePricingRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { permanent } = req.query;

    if (permanent === "true") {
      await PricingRule.findByIdAndDelete(ruleId);
      return res
        .status(200)
        .json({ message: "Pricing rule deleted permanently" });
    } else {
      const rule = await PricingRule.findByIdAndUpdate(
        ruleId,
        { isActive: false },
        { new: true },
      );
      return res.status(200).json({
        message: "Pricing rule deactivated",
        data: rule,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const filterBookings = async (req, res) => {
  try {
    const ALLOWED_STATUS = ["paid", "pending", "blocked", "cancelled"];
    let { status, page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (status && !ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({
        message: "Invalid status filter",
      });
    }

    const query = {};
    if (status) query.status = status;

    //pagination
    const skip = (page - 1) * limit;

    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    return res.status(200).json({
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something Went wrong" });
  }
};
