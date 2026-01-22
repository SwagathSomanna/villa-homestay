const express = require("express");
const router = express.Router();
const { verifyWebhookSignature } = require("../utils/cashfree");
const { v4: uuid } = require("uuid");
const fs = require("fs/promises");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "state.json");

// Middleware to capture raw body for signature verification
const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || "utf8");
  }
};

async function readState() {
  const data = await fs.readFile(DATA_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

// Cashfree webhook handler
router.post(
  "/cashfree",
  express.json({ verify: rawBodySaver }),
  async (req, res) => {
    try {
      const signature = req.headers["x-webhook-signature"];
      let payload;

      try {
        payload = JSON.parse(req.rawBody || req.body.toString());
      } catch (e) {
        payload = req.body;
      }

      // Verify webhook signature (use raw body for signature verification)
      const rawBody = req.rawBody || req.body.toString();
      if (!verifyWebhookSignature(rawBody, signature)) {
        console.error("[WEBHOOK] Invalid signature");
        return res.status(401).json({ message: "Invalid signature" });
      }

      const { type, data } = payload;
      const state = await readState();

      if (type === "PAYMENT_SUCCESS") {
        const { order_id, cf_payment_id, payment_amount, payment_time } = data;

        // Find booking by order ID
        const booking = state.bookings.find(
          (b) => b.cashfreeOrderId === order_id || b.cf_order_id === order_id,
        );
        if (!booking) {
          console.log(`[WEBHOOK] Booking not found for order ${order_id}`);
          return res.json({ success: true }); // Return success to avoid retries
        }

        // Convert paise to rupees (payment_amount is in paise from Cashfree)
        const amount_rupees = payment_amount / 100;

        // Update booking - ONLY webhook confirms payment and blocks rooms
        booking.status = "CONFIRMED";
        booking.cashfreePaymentId = cf_payment_id;
        booking.cf_payment_id = cf_payment_id; // Store Cashfree payment ID
        booking.cf_order_id = order_id; // Store Cashfree order ID
        booking.paidAmount = amount_rupees; // Store in rupees
        booking.updatedAt = new Date().toISOString();

        // BLOCK ROOMS ONLY AFTER WEBHOOK CONFIRMS PAYMENT_SUCCESS
        const targets =
          booking.selectionType === "room"
            ? [{ targetType: "room", targetId: booking.selectionId }]
            : booking.selectionType === "floor"
              ? [{ targetType: "floor", targetId: booking.selectionId }]
              : [{ targetType: "villa", targetId: "villa" }];

        targets.forEach((target) => {
          const existingBlock = state.blocks.find(
            (b) =>
              b.bookingId === booking.id &&
              b.targetType === target.targetType &&
              b.targetId === target.targetId,
          );

          if (!existingBlock) {
            state.blocks.push({
              id: uuid(),
              targetType: target.targetType,
              targetId: target.targetId,
              startDate: booking.checkInDate,
              endDate: booking.checkOutDate,
              source: "booking",
              bookingId: booking.id,
              label: `${booking.selectionType} ${booking.selectionId}`,
            });
          }
        });

        await writeState(state);

        console.log(`[WEBHOOK] PAYMENT_SUCCESS for booking ${booking.id}`);
        console.log(`Guest: ${booking.name}, Amount: ₹${amount_rupees}`);
        console.log(
          `[WEBHOOK] Room blocked for dates: ${booking.checkInDate} to ${booking.checkOutDate}`,
        );
      } else if (type === "PAYMENT_FAILED") {
        const { order_id, payment_message } = data;

        // Auto-cancel booking on payment failure
        const booking = state.bookings.find(
          (b) => b.cashfreeOrderId === order_id || b.cf_order_id === order_id,
        );
        if (booking) {
          booking.status = "CANCELLED";
          booking.updatedAt = new Date().toISOString();
          // Remove any pending blocks
          state.blocks = state.blocks.filter((b) => b.bookingId !== booking.id);
          await writeState(state);
          console.log(
            `[WEBHOOK] PAYMENT_FAILED - Auto-cancelled booking ${booking.id}: ${payment_message}`,
          );
        }
      } else if (type === "REFUND_SUCCESS") {
        const { cf_payment_id, refund_id, refund_amount, refund_time } = data;

        // Find booking by payment ID
        const booking = state.bookings.find(
          (b) => b.cashfreePaymentId === cf_payment_id,
        );
        if (!booking) {
          console.log(
            `[WEBHOOK] Booking not found for payment ${cf_payment_id}`,
          );
          return res.json({ success: true });
        }

        // Convert paise to rupees
        const refund_rupees = refund_amount / 100;

        // Update booking
        booking.status = "REFUNDED";
        booking.cashfreeRefundId = refund_id;
        booking.refundAmount = refund_rupees; // Store in rupees
        booking.updatedAt = new Date().toISOString();

        // Remove booking blocks
        state.blocks = state.blocks.filter((b) => b.bookingId !== booking.id);

        await writeState(state);

        console.log(`[WEBHOOK] REFUND_SUCCESS for booking ${booking.id}`);
        console.log(`Refund Amount: ₹${refund_rupees}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  },
);

module.exports = router;
