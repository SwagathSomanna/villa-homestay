import { Router } from "express";
import { bookVilla } from "../controllers/booking.controller.js";

const router = Router();

router.route("/checkout").post(bookVilla);

export default router;
