import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const sendConfirmationMailToGuest = async (userInfo) => {
  try {
    // console.log(userInfo, "userinfo log at resend");
    const name = userInfo.guest.name;
    const email = userInfo.guest.email;
    const phone = userInfo.guest.phone || "N/A";
    const checkIn = formatDate(userInfo.checkIn);
    const checkOut = formatDate(userInfo.checkOut);
    const adults = userInfo.guest.adults;
    const children = userInfo.guest.children || 0;
    const totalGuests = adults + children;
    const accessToken = userInfo.accessToken;
    const bookingId =
      userInfo.bookingId || accessToken.substring(0, 8).toUpperCase();
    const accommodation = userInfo.targetType || "Entire Villa";
    const totalAmount = userInfo.pricing.paidAmount || "As per booking";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f9f7 0%, #e8f3f0 100%);
            color: #2d5a54;
            line-height: 1.6;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(45, 90, 84, 0.12);
          }
          
          .header {
            background: linear-gradient(135deg, #4a9f7f 0%, #2d7a62 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .header::before {
            content: '🌿';
            position: absolute;
            font-size: 100px;
            opacity: 0.15;
            top: -20px;
            right: -20px;
          }
          
          .header::after {
            content: '🍃';
            position: absolute;
            font-size: 80px;
            opacity: 0.15;
            bottom: -10px;
            left: -10px;
          }
          
          .header h1 {
            color: white;
            font-size: 28px;
            margin-bottom: 5px;
            position: relative;
            z-index: 1;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            position: relative;
            z-index: 1;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .greeting {
            font-size: 16px;
            color: #2d5a54;
            margin-bottom: 20px;
            line-height: 1.7;
          }
          
          .intro-text {
            font-size: 15px;
            color: #2d5a54;
            margin-bottom: 30px;
            line-height: 1.7;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 17px;
            font-weight: 700;
            color: #2d7a62;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0ebe8;
          }
          
          .details-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .details-table tr {
            border-bottom: 1px solid #e0ebe8;
          }
          
          .details-table tr:last-child {
            border-bottom: none;
          }
          
          .details-table td {
            padding: 12px 0;
            color: #2d5a54;
            font-size: 14px;
          }
          
          .details-table td:first-child {
            font-weight: 600;
            color: #2d7a62;
            width: 50%;
          }
          
          .details-table td:last-child {
            text-align: right;
          }
          
          .info-box {
            background: #fff9e6;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #f5c842;
            margin-bottom: 30px;
          }
          
          .info-box-title {
            font-weight: 700;
            color: #9a7b2e;
            margin-bottom: 10px;
            font-size: 15px;
          }
          
          .info-box-content {
            font-size: 14px;
            color: #5a5a5a;
            line-height: 1.7;
          }
          
          .policy-box {
            background: #f5f9f7;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #a8d4c7;
            margin-bottom: 30px;
          }
          
          .policy-title {
            font-weight: 700;
            color: #2d7a62;
            margin-bottom: 10px;
            font-size: 15px;
          }
          
          .policy-content {
            font-size: 14px;
            color: #2d5a54;
            line-height: 1.8;
          }
          
          .policy-item {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
          }
          
          .policy-item:before {
            content: '•';
            position: absolute;
            left: 5px;
            color: #4a9f7f;
            font-weight: bold;
          }
          
          .contact-box {
            background: linear-gradient(135deg, rgba(74, 159, 127, 0.05), rgba(232, 243, 240, 0.5));
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #4a9f7f;
            margin-bottom: 30px;
          }
          
          .contact-title {
            font-weight: 700;
            color: #2d7a62;
            margin-bottom: 12px;
            font-size: 15px;
          }
          
          .contact-item {
            margin-bottom: 8px;
            font-size: 14px;
            color: #2d5a54;
          }
          
          .contact-label {
            font-weight: 600;
            color: #2d7a62;
            display: inline-block;
            min-width: 140px;
          }
          
          .closing-text {
            font-size: 14px;
            color: #2d5a54;
            line-height: 1.7;
            margin-bottom: 20px;
          }
          
          .signature {
            margin-top: 30px;
            font-size: 14px;
            color: #2d5a54;
            line-height: 1.8;
          }
          
          .signature-name {
            font-weight: 600;
            color: #2d7a62;
          }
          
          .footer {
            background: linear-gradient(135deg, #e8f3f0 0%, #f5f9f7 100%);
            padding: 30px;
            text-align: center;
            border-top: 1px solid #d4e8e3;
          }
          
          .footer-logo {
            font-size: 18px;
            font-weight: 700;
            color: #2d7a62;
            margin-bottom: 10px;
            letter-spacing: 1px;
          }
          
          .footer-text {
            font-size: 13px;
            color: #5a7f7a;
            margin-bottom: 8px;
          }
          
          .footer-link {
            font-size: 12px;
            color: #4a9f7f;
            text-decoration: none;
          }
          
          .footer-link:hover {
            text-decoration: underline;
          }
          
          @media (max-width: 600px) {
            .container {
              border-radius: 0;
            }
            
            .content {
              padding: 25px 20px;
            }
            
            .header {
              padding: 30px 20px;
            }
            
            .details-table td:last-child {
              text-align: left;
            }
            
            .details-table td:first-child {
              width: auto;
            }
            
            .contact-label {
              display: block;
              min-width: auto;
              margin-bottom: 2px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Booking Confirmed</h1>
            <p>We look forward to hosting you</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <div class="greeting">
              Dear <strong>${name}</strong>,
            </div>
            
            <!-- Introduction -->
            <div class="intro-text">
              Thank you for choosing Anudina Kuteera. Your booking has been successfully confirmed and we look forward to hosting you.
            </div>
            
            <!-- Booking Details -->
            <div class="section">
              <div class="section-title">Booking Details</div>
              <table class="details-table">
                <tr>
                  <td>Booking Reference</td>
                  <td>${bookingId}</td>
                </tr>
                <tr>
                  <td>Property</td>
                  <td>Anudina Kuteera, Coorg</td>
                </tr>
                <tr>
                  <td>Check-in Date</td>
                  <td>${checkIn}</td>
                </tr>
                <tr>
                  <td>Check-out Date</td>
                  <td>${checkOut}</td>
                </tr>
                <tr>
                  <td>Check-in Time</td>
                  <td>2:00 PM</td>
                </tr>
                <tr>
                  <td>Check-out Time</td>
                  <td>11:00 AM</td>
                </tr>
                <tr>
                  <td>Number of Guests</td>
                  <td>${totalGuests} (${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? ", " + children + " Child" + (children > 1 ? "ren" : "") : ""})</td>
                </tr>
                <tr>
                  <td>Accommodation Booked</td>
                  <td>${accommodation}</td>
                </tr>
                <tr>
                  <td>Total Amount Paid</td>
                  <td>${totalAmount}</td>
                </tr>
              </table>
            </div>
            
            <!-- Guest Information -->
            <div class="section">
              <div class="section-title">Guest Information</div>
              <table class="details-table">
                <tr>
                  <td>Primary Contact Name</td>
                  <td>${name}</td>
                </tr>
                <tr>
                  <td>Phone Number</td>
                  <td>${phone}</td>
                </tr>
                <tr>
                  <td>Email</td>
                  <td>${email}</td>
                </tr>
                <tr>
                  <td>Booking Access Token</td>
                  <td style="font-family: 'Courier New', monospace; font-size: 12px; word-break: break-all;">${accessToken}</td>
                </tr>
              </table>
            </div>
            
            <!-- Important Information -->
            <div class="info-box">
              <div class="info-box-title">Important Information</div>
              <div class="info-box-content">
                Please carry a valid government-issued photo identification for all guests at the time of check-in.
              </div>
            </div>
            
            <!-- Cancellation Policy -->
            <div class="policy-box">
              <div class="policy-title">Cancellation Policy</div>
              <div class="policy-content">
                To cancel a booking, please contact the property administration directly using the details below.
                <div style="margin-top: 12px;">
                  <div class="policy-item">Cancellations made 15 days or more prior to the check-in date are eligible for a 100% refund.</div>
                  <div class="policy-item">Cancellations made within 15 days of the check-in date are not eligible for a refund.</div>
                </div>
              </div>
            </div>
            
            <!-- Contact Information -->
            <div class="contact-box">
              <div class="contact-title">For Cancellations or Assistance</div>
              <div class="contact-item">
                <span class="contact-label">Admin Contact Name:</span>
                <span>Anudina Kuteera Admin</span>
              </div>
              <div class="contact-item">
                <span class="contact-label">Phone:</span>
                <span><a href="tel:+919972253584" style="color: #4a9f7f; text-decoration: none;">+91 9972253584</a></span>
              </div>
              <div class="contact-item">
                <span class="contact-label">Email:</span>
                <span><a href="mailto:anudinakuteera23@gmail.com" style="color: #4a9f7f; text-decoration: none;">anudinakuteera23@gmail.com</a></span>
              </div>
            </div>
            
            <!-- Closing Text -->
            <div class="closing-text">
              If you have any special requests or updates regarding your arrival time, please inform us in advance.
            </div>
            
            <div class="closing-text">
              We look forward to welcoming you to Anudina Kuteera.
            </div>
            
            <!-- Signature -->
            <div class="signature">
              <div style="margin-bottom: 5px;">Warm regards,</div>
              <div class="signature-name">Anudina Kuteera Team</div>
              <div style="margin-top: 8px;">Anudina Kuteera</div>
              <div><a href="tel:+919972253584" style="color: #4a9f7f; text-decoration: none;">+91 9972253584</a></div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">Anudina Kuteera</div>
            <div class="footer-text">Where Nature Meets Comfort</div>
            <a href="mailto:support@mail.anudinakuteera.com" class="footer-link">support@mail.anudinakuteera.com</a>
            <div class="footer-text" style="margin-top: 15px; font-size: 11px; color: #7a9f9a;">
              Thank you for choosing our villa
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
      to: [email],
      reply_to: "anudinakuteera23@gmail.com",
      subject: "Booking Confirmed - Anudina Kuteera, Coorg",
      html,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const sendConfirmationMailToAdmin = async (userinfo) => {
  try {
    const target = userinfo.targetType;
    const checkIn = formatDate(userinfo.checkIn);
    const checkOut = formatDate(userinfo.checkOut);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f9f7 0%, #e8f3f0 100%);
            color: #2d5a54;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(45, 90, 84, 0.12);
          }
          
          .header {
            background: linear-gradient(135deg, #4a9f7f 0%, #2d7a62 100%);
            padding: 30px;
            text-align: center;
            color: white;
          }
          
          .header h1 {
            font-size: 22px;
            margin-bottom: 5px;
            font-weight: 600;
          }
          
          .content {
            padding: 30px;
          }
          
          .alert-box {
            background: linear-gradient(135deg, rgba(74, 159, 127, 0.05), rgba(232, 243, 240, 0.5));
            padding: 20px;
            border-left: 4px solid #4a9f7f;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          
          .details {
            background: #f5f9f7;
            padding: 20px;
            border-radius: 8px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #d4e8e3;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-weight: 600;
            color: #2d7a62;
          }
          
          .detail-value {
            color: #2d5a54;
          }
          
          .footer {
            background: #f5f9f7;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #d4e8e3;
            font-size: 12px;
            color: #5a7f7a;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 New Booking Notification</h1>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <strong>Property Type:</strong> ${target}
            </div>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">Guest Name:</span>
                <span class="detail-value">${userinfo.guest.name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Guest Email:</span>
                <span class="detail-value">${userinfo.guest.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Guest Phone:</span>
                <span class="detail-value">${userinfo.guest.phone || "N/A"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Check-in:</span>
                <span class="detail-value">${checkIn}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Check-out:</span>
                <span class="detail-value">${checkOut}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Adults:</span>
                <span class="detail-value">${userinfo.guest.adults}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Children:</span>
                <span class="detail-value">${userinfo.guest.children || 0}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            Action required: Review and prepare for guest arrival
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
      to: process.env.ADMIN_EMAIL,
      subject: "📬 New Booking Information",
      html,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Error sending mail to admin");
  }
};

export const sendPaymentFailedEmail = async (booking) => {
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const name = booking.guest.name;
  const email = booking.guest.email;
  const checkIn = formatDate(booking.checkIn);
  const checkOut = formatDate(booking.checkOut);
  const adults = booking.guest.adults;
  const children = booking.guest.children || 0;

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="font-family:'Segoe UI', sans-serif; background:#f5f9f7; padding:20px;">

    <div style="max-width:600px;margin:auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.1);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#f39c12,#e67e22);padding:40px;text-align:center;color:white;">
        <h1 style="margin:0;">Payment Not Completed</h1>
        <p style="margin-top:6px;">Your booking is still reserved</p>
      </div>

      <!-- Content -->
      <div style="padding:35px;">

        <p style="font-size:18px;">Hi <strong>${name}</strong>,</p>

        <div style="background:#fff7e6;padding:18px;border-left:4px solid #f39c12;border-radius:6px;margin:20px 0;">
          We couldn’t complete your payment for your stay at
          <strong>Anudinakuteera Villa</strong>.
          Don’t worry — your booking is still saved.
        </div>

        <!-- Stay details -->
        <h3 style="color:#2d7a62;">📅 Stay Details</h3>
        <table width="100%" style="border-collapse:collapse;">
          <tr><td style="padding:8px 0;font-weight:600;">Check-in</td><td align="right">${checkIn}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Check-out</td><td align="right">${checkOut}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Guests</td><td align="right">${adults} Adults, ${children} Children</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Booking ID</td><td align="right">${booking._id}</td></tr>
        </table>

        <p style="margin-top:25px;">
          Please return to our website anytime to complete the payment.
          If you need help, simply reply to this email.
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#e8f3f0;padding:25px;text-align:center;color:#2d7a62;">
        <strong>Anudinakuteera</strong><br/>
        support@mail.anudinakuteera.com
      </div>

    </div>

  </body>
  </html>
  `;

  await resend.emails.send({
    from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
    to: [email],
    reply_to: "anudinakuteera23@gmail.com",
    subject: "Payment incomplete – Your booking is still reserved",
    html,
  });
};

export const sendAdminOTPEmail = async (email, otp) => {
  const html = `
  <html>
  <body style="font-family:Arial;background:#f6f8fa;padding:30px;">
    <div style="max-width:600px;margin:auto;background:white;border-radius:8px;overflow:hidden">

      <div style="padding:40px;text-align:center">
        <h2 style="margin:0">Admin Login Verification</h2>
        <p style="color:#666">Use this OTP to complete your login</p>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          margin:25px 0;
          color:#2d7a62;">
          ${otp}
        </div>

        <p style="color:#999;font-size:14px">
          Valid for 5 minutes. Do not share this code.
        </p>
      </div>

      <div style="background:#e8f3f0;padding:25px;text-align:center;color:#2d7a62;">
        <strong>Anudinakuteera</strong><br/>
        support@mail.anudinakuteera.com
      </div>

    </div>
  </body>
  </html>
  `;

  const { data, error } = await resend.emails.send({
    from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
    to: [email],
    reply_to: "anudinakuteera23@gmail.com",
    subject: "Your Admin Login OTP",
    html,
  });

  if (error) {
    throw new Error(error.message || "Failed to send OTP email");
  }
};
