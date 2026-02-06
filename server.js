import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
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
const DATA_PATH = path.join(__dirname, "data", "state.json");

app.use(express.json({ limit: "128kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN_NGROK || "http://localhost:4000",
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

app.use("/api/booking", bookingRouter);
app.use("/api/villa", villaRouter);
app.use("/api/payment", razorpayRouter);
//need to set to raw for webhooks to work
app.use(
  "/api/payment/razorpay-webhook",
  express.raw({ type: "application/json" }),
);

/// admin routes
app.use("/api/admin", adminRouter);

/////////////test ///////
// import { sendMail } from "./utils/resend.util.js";
// sendMail().then(() => {
//   console.log("mail set");
// });

//////////////////////////////////////////////////
