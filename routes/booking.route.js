import { Router } from "express";
import {
  getBookedDates,
  bookVilla,
  checkAvailability,
} from "../controllers/booking.controller.js";

const router = Router();

router.route("/checkout").post(bookVilla);
router.get("/booked-dates", getBookedDates);
router.post("/check-availability", checkAvailability);

export default router;
