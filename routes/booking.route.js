import { Router } from "express";
import {
  getBookedDates,
  bookVilla,
  checkAvailability,
  getPriceQuote,
} from "../controllers/booking.controller.js";

const router = Router();

router.route("/checkout").post(bookVilla);
router.get("/booked-dates", getBookedDates);
router.post("/check-availability", checkAvailability);
router.post("/price-quote", getPriceQuote);

export default router;
