import { Router } from "express";
import { verifyJWT } from "../middleware/admin.midddleware.js";
import { login, getBooking } from "../controllers/admin.controller.js";

const router = Router();

router.post("/login", login);
router.get("/get-bookings", verifyJWT, getBooking);

export default router;
