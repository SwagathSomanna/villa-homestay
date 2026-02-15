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
    origin: "http://localhost:4000",
    credentials: true,
  }),
);

connectDB().then(() => {
  const port = process.env.PORT || PORT;
  app.listen(port, () => {
    console.log("Server running at port", port);
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
// import { Booking } from "./models/booking.model.js";
// import { rooms, floors } from "./constants.js";
// const test = async () => {
//   try {
//     const orderId = "order_SGGwPN6IMD9EHW";
//     const userInfo = await Booking.findOne({ razorpayOrderId: orderId });
//     console.log(userInfo);
//
//     const accommodation = userInfo.targetType || "Entire Villa";
//     const totalAmount = userInfo.pricing.paidAmount;
//     let targetName = null;
//
//     if (accommodation === "floor") {
//       targetName = floors[userInfo.floorId];
//     } else if (accommodation === "room") {
//       console.log(rooms);
//       console.log(rooms[userInfo.roomId]);
//       targetName = rooms[userInfo.roomId];
//     }
//
//     console.log(accommodation, totalAmount, targetName);
//   } catch (error) {
//     console.log(error);
//   }
// };
//
// test().then(() => {
//   console.log("testcalled");
// });
