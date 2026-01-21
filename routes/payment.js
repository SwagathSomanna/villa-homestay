const express = require('express');
const router = express.Router();
const fs = require('fs/promises');
const path = require('path');
const { v4: uuid } = require('uuid');
const { createOrder } = require('../cashfree');

const DATA_PATH = path.join(__dirname, '..', 'data', 'state.json');

async function readState() {
  const data = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(data);
}
async function writeState(state) {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2));
}

router.post('/create-order', async (req, res) => {
  try {
    const { bookingId, amountRs } = req.body;
    if (!bookingId || !amountRs) {
      return res.status(400).json({ message: 'bookingId and amountRs required' });
    }

    const state = await readState();
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 🔥 ALWAYS allow retry
    delete booking.cashfreeOrderId;

    const orderId = `ORDER_${Date.now()}_${uuid().slice(0, 6)}`;

    const orderData = {
      orderId,
      amount: amountRs,
      customerDetails: {
        customerId: booking.email.replace(/[^a-zA-Z0-9]/g, '_'),
        name: booking.name,
        email: booking.email,
        phone: booking.phone || '9999999999'
      },
      orderMeta: {
        returnUrl: `http://localhost:4000/checkout.html`
      }
    };

    const result = await createOrder(orderData);

    booking.cashfreeOrderId = orderId;
    booking.updatedAt = new Date().toISOString();
    await writeState(state);

    res.json({ payment_session_id: result.paymentSessionId });
  } catch (err) {
    console.error('[PAYMENT]', err);
    res.status(500).json({ message: 'Payment initiation failed' });
  }
});

module.exports = router;
