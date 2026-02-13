import { PricingRule } from "../models/pricingRule.model.js";

/**
 * Calculate dynamic price per night for a booking
 * Returns price breakdown for each individual night
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

  // Calculate price for EACH individual night
  const nightPrices = [];
  const allAppliedRules = new Set(); // Track unique rules applied

  let currentDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  // Loop through each night
  while (currentDate < endDate) {
    let nightPrice = basePrice;
    const appliedRulesToday = [];

    // Check each rule to see if it applies to THIS specific date
    for (const rule of applicableRules) {
      const ruleStart = new Date(rule.startDate);
      const ruleEnd = new Date(rule.endDate);

      // Check if current date is within rule's date range
      if (currentDate < ruleStart || currentDate >= ruleEnd) {
        continue; // Rule doesn't apply to this date
      }

      // Check if rule applies to this day of week (if specified)
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayOfWeek = currentDate.getDay();
        if (!rule.daysOfWeek.includes(dayOfWeek)) {
          continue; // Rule doesn't apply to this day of week
        }
      }

      // Apply the modifier for this night
      if (rule.modifierType === "percentage") {
        nightPrice += (basePrice * rule.modifierValue) / 100;
      } else if (rule.modifierType === "fixed") {
        nightPrice += rule.modifierValue;
      }

      appliedRulesToday.push({
        name: rule.name,
        modifier: rule.modifierValue,
        type: rule.modifierType,
      });

      allAppliedRules.add(
        JSON.stringify({
          name: rule.name,
          modifier: rule.modifierValue,
          type: rule.modifierType,
        }),
      );
    }

    nightPrices.push({
      date: new Date(currentDate),
      price: Math.round(nightPrice),
      appliedRules: appliedRulesToday,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate totals
  const totalPrice = nightPrices.reduce((sum, night) => sum + night.price, 0);
  const averagePrice = Math.round(totalPrice / nightPrices.length);
  const totalModifier = totalPrice - basePrice * nightPrices.length;

  // Convert Set back to array of unique rules
  const appliedRules = Array.from(allAppliedRules).map((str) =>
    JSON.parse(str),
  );

  return {
    basePrice,
    finalPrice: averagePrice, // Average price per night (for compatibility)
    totalPrice, // Total for entire stay
    totalModifier,
    appliedRules,
    nightPrices, // Detailed breakdown per night
  };
}

function getTargetFilter(targetType, targetId) {
  if (targetType === "floor") {
    return { targetFloorId: targetId };
  } else if (targetType === "room") {
    return { targetRoomId: targetId };
  }
  return {};
}
