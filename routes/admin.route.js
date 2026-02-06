import { Router } from "express";
import { verifyJWT } from "../middleware/admin.midddleware.js";
import {
  login,
  getBooking,
  updateBooking,
  deleteBooking,
  createBlockedDates,
  createPricingRule,
  getAllPricingRules,
  updatePricingRule,
  deletePricingRule,
} from "../controllers/admin.controller.js";

const router = Router();

router.post("/login", login);

router.get("/bookings", verifyJWT, getBooking); // Get all bookings
router.patch("/bookings/:bookingId", verifyJWT, updateBooking); // Update booking
router.delete("/bookings/:bookingId", verifyJWT, deleteBooking); // Cancel/delete booking
router.post("/blocked-dates", verifyJWT, createBlockedDates); // Block dates

// --- Pricing Rules Management ---
router.post("/pricing-rules", verifyJWT, createPricingRule); // Create pricing rule
router.get("/pricing-rules", verifyJWT, getAllPricingRules); // Get all pricing rules
router.patch("/pricing-rules/:ruleId", verifyJWT, updatePricingRule); // Update pricing rule
router.delete("/pricing-rules/:ruleId", verifyJWT, deletePricingRule); // Delete/deactivate rule

export default router;
