import axios from "axios";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_ENV = process.env.CASHFREE_ENV || "test";

const BASE_URL =
  CASHFREE_ENV === "test"
    ? "https://sandbox.cashfree.com/pg"
    : "https://api.cashfree.com/pg";

// Create Cashfree order
async function createOrder(orderData) {
  try {
    const { orderId, amount, customerDetails, orderMeta } = orderData;

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerDetails.customerId,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone,
      },
      order_meta: {
        return_url: orderMeta.returnUrl,
        notify_url: orderMeta.notifyUrl,
      },
    };

    const response = await axios.post(`${BASE_URL}/orders`, payload, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderToken: response.data.order_token,
    };
  } catch (error) {
    console.error(
      "Cashfree order creation error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to create Cashfree order",
    );
  }
}

// Verify payment status
async function verifyPayment(orderId) {
  try {
    const response = await axios.get(`${BASE_URL}/orders/${orderId}/payments`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
      },
    });

    const payments = response.data;
    if (!payments || payments.length === 0) {
      return { success: false, message: "No payment found for this order" };
    }

    // Get the latest payment
    const latestPayment = payments[0];
    const paymentStatus = latestPayment.payment_status;

    return {
      success: paymentStatus === "SUCCESS",
      paymentStatus,
      paymentId: latestPayment.cf_payment_id,
      paymentMessage: latestPayment.payment_message,
      paymentMethod: latestPayment.payment_method,
      paymentAmount: latestPayment.payment_amount,
      paymentTime: latestPayment.payment_time,
    };
  } catch (error) {
    console.error(
      "Cashfree payment verification error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to verify payment",
    );
  }
}

// Create refund
async function createRefund(paymentId, refundAmountPaise, refundNote) {
  try {
    const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const payload = {
      refund_id: refundId,
      refund_amount: refundAmountPaise,
      refund_note: refundNote || "Booking cancellation refund",
      refund_type: "STANDARD",
      cf_payment_id: paymentId,
    };

    const response = await axios.post(`${BASE_URL}/orders/refund`, payload, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      refundId: response.data.refund_id || refundId,
      refundStatus: response.data.refund_status,
      refundAmount: response.data.refund_amount,
    };
  } catch (error) {
    console.error(
      "Cashfree refund error:",
      error.response?.data || error.message,
    );
    throw new Error(error.response?.data?.message || "Failed to create refund");
  }
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!signature) return false;
  const crypto = require("crypto");
  // Cashfree webhook signature is computed from the raw request body as string
  const payloadString =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  const computedSignature = crypto
    .createHmac("sha256", CASHFREE_SECRET_KEY)
    .update(payloadString)
    .digest("hex");
  return computedSignature === signature;
}

export { createOrder, verifyPayment, createRefund, verifyWebhookSignature };
