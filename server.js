import express from "express";
import cors from "cors";
import path from "path";
import "dotenv/config";
import cookieParser from "cookie-parser";

//specific to esm
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { PORT } from "./constants.js";
import connectDB from "./db.js";

const app = express();

app.use(express.json({ limit: "128kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

connectDB().then(() => {
  app.listen(process.env.PORT || PORT, () => {
    console.log("server is running at port", process.env.PORT || PORT);
  });
});

//run the seed script | not using env variable.
import addInitialPrices from "./utils/seed.js";
addInitialPrices();

//routes
import bookingRouter from "./routes/booking.route.js";
import villaRouter from "./routes/villa.routes.js";
import razorpayRouter from "./routes/razorpay.route.js";
import adminRouter from "./routes/admin.route.js";
import adminLoginRouter from "./routes/admin.auth.route.js";

app.use("/api/booking", bookingRouter);
app.use("/api/villa", villaRouter);
app.use("/api/payment", razorpayRouter);
//need to set to raw for webhooks to work
app.use(
  "/api/payment/razorpay-webhook",
  express.raw({ type: "application/json" }),
);

/// admin routes
app.use("/api/admin", adminLoginRouter);
app.use("/api/admin", adminRouter);

/////////////test ///////
// import { sendPaymentFailedEmail } from "./utils/resend.util.js";
// const mockBooking = {
//   _id: "6985dd5a63e8bfd8dbf49489",
//
//   guest: {
//     name: "Rahul Sharma",
//     email: "sathwikthanmay4@gmail.com",
//     adults: 2,
//     children: 1,
//   },
//
//   checkIn: new Date("2026-02-11"),
//   checkOut: new Date("2026-02-12"),
//
//   pricing: {
//     totalPrice: 4500,
//   },
// };
//
// sendPaymentFailedEmail(mockBooking).then(() => {
//   console.log("mail set");
// });
