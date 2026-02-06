// pricing.helper.js

import { PricingRule } from "../models/pricingRule.model.js";

/**
 * Calculate final price with all applicable pricing rules
 */
export async function calculateDynamicPrice(params) {
  const { basePrice, targetType, targetId, checkIn, checkOut } = params;

  // Find all active pricing rules that overlap with booking dates
  const applicableRules = await PricingRule.find({
    isActive: true,
    startDate: { $lte: checkOut },
    endDate: { $gte: checkIn },
    $or: [
      { appliesTo: "all" },
      {
        appliesTo: targetType,
        ...(targetId && getTargetFilter(targetType, targetId)),
      },
    ],
  }).sort({ priority: -1 }); // Higher priority first

  let totalModifier = 0;
  let appliedRules = [];

  for (const rule of applicableRules) {
    // Check if rule applies to any day in the booking range
    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const hasMatchingDay = dateRangeHasDayOfWeek(
        checkIn,
        checkOut,
        rule.daysOfWeek,
      );
      if (!hasMatchingDay) continue;
    }

    // Apply modifier
    if (rule.modifierType === "percentage") {
      totalModifier += (basePrice * rule.modifierValue) / 100;
    } else if (rule.modifierType === "fixed") {
      totalModifier += rule.modifierValue;
    }

    appliedRules.push({
      name: rule.name,
      modifier: rule.modifierValue,
      type: rule.modifierType,
    });
  }

  const finalPrice = Math.round(basePrice + totalModifier);

  return {
    basePrice,
    finalPrice,
    totalModifier,
    appliedRules,
  };
}

/**
 * Helper: Check if date range includes any of the specified days of week
 */
function dateRangeHasDayOfWeek(startDate, endDate, daysOfWeek) {
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    if (daysOfWeek.includes(currentDate.getDay())) {
      return true;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return false;
}

/**
 * Helper: Build target filter for specific floor/room
 */
function getTargetFilter(targetType, targetId) {
  if (targetType === "floor") {
    return { targetFloorId: targetId };
  } else if (targetType === "room") {
    return { targetRoomId: targetId };
  }
  return {};
}
