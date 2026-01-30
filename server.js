import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

//specific to esm
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { PORT } from "./constants.js";
import connectDB from "./db.js";

const app = express();
const DATA_PATH = path.join(__dirname, "data", "state.json");

dotenv.config();
app.use(express.json({ limit: "128kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:4000",
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

app.use("/api/booking", bookingRouter);
app.use("/api/villa", villaRouter);

//////////////////////////////////////////////////

//session
// app.use(
//   session({
//     name: "admin.sid",
//     secret: "villa-admin-secret",
//     resave: false,
//     saveUninitialized: false,
//     rolling: true,
//     cookie: {
//       httpOnly: true,
//       secure: false,
//       sameSite: "lax",
//       maxAge: 30 * 60 * 1000,
//     },
//   }),
// );

/* ---------------- HELPERS ---------------- */
async function readState() {
  const data = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(data);
}
async function writeState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

/* ---------------- ADMIN LOGIN ---------------- */
const ADMIN_PIN = "7845";
const ADMIN_HASH = crypto.createHash("sha256").update(ADMIN_PIN).digest("hex");

function verifyPin(pin) {
  const hash = crypto.createHash("sha256").update(pin).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(ADMIN_HASH, "hex"),
  );
}

app.post("/api/admin/login", (req, res) => {
  if (!verifyPin(req.body.pin)) {
    return res.status(401).json({ message: "Invalid PIN" });
  }
  req.session.admin = true;
  res.json({ success: true });
});

/* ---------------- PUBLIC STATE (PRICES) ---------------- */
app.get("/api/state", async (req, res) => {
  const state = await readState();
  res.json({
    prices: state.prices,
    floorPrices: state.floorPrices,
    blocks: state.blocks,
  });
});

/* ---------------- CREATE BOOKING ---------------- */
app.post("/api/bookings", async (req, res) => {
  const state = await readState();

  const booking = {
    id: crypto.randomUUID(),
    ...req.body,
    status: "PENDING_PAYMENT",
    createdAt: new Date().toISOString(),
  };

  state.bookings.push(booking);
  await writeState(state);

  res.json({ booking });
});

/* ---------------- PAYMENTS ---------------- */
// app.use("/api/payments", paymentRoutes);
//
// /* ---------------- API SAFETY ---------------- */
// app.use("/api", (req, res) => {
//   res.status(404).json({ error: "API_NOT_FOUND" });
// });
