import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API);

// export const sendMailToGuest = async (userInfo) => {
//   try {
//     console.log(userInfo, "userinfo log at resend");
//     const name = userInfo.guest.name;
//     const email = userInfo.guest.email;
//     //need to change this later
//     const bookingUrl = `http://localhost:4000/api/booking/${userInfo.accessToken}`;
//     const checkIn = userInfo.checkIn;
//     const checkOut = userInfo.checkOut;
//     const adults = userInfo.guest.adults;
//     const children = userInfo.guest.children || 0;
//
//     const html = `
//       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
//         <h2>Booking Confirmed </h2>
//
//         <p>Hello, ${name}</p>
//
//         <p>
//           Your stay at <strong>Anudinakuteera Villa</strong> has been successfully confirmed.
//         </p>
//
//         <table style="border-collapse: collapse; margin-top: 10px;">
//           <tr>
//             <td><strong>Check-in:</strong></td>
//             <td>${checkIn}</td>
//           </tr>
//           <tr>
//             <td><strong>Check-out:</strong></td>
//             <td>${checkOut}</td>
//           </tr>
//           <tr>
//             <td><strong>Guests:</strong></td>
//             <td>Adults: ${adults}</td>
//             <td>Children: ${children}</td>
//           </tr>
//         </table>
//
//         <p style="margin-top: 20px;">
//           If you have any questions, feel free to reply to this email or contact our support team.
//           You can reach out to us using the following.
//           email: deenaprabha93@gmail.com
//           phone no: +91 9972253584
//         </p>
//
//         <p>
//           Regards,<br/>
//           Team Anudinakuteera<br/>
//           support@mail.anudinakuteera.com
//         </p>
//       </div>
//     `;
//
//     const data = await resend.emails.send({
//       from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
//       to: [email, "suryashreevathsa11@gmail.com"],
//       reply_to: "deenaprabha93@gmail.com",
//       subject: "Your booking is confirmed – Anudinakuteera",
//       html,
//     });
//
//     return data;
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };
//
// export const sendMailToAdmin = async (userinfo) => {
//   try {
//     const target = userinfo.targetType;
//
//     const html = `
//     boooking confirmed for ${target} for ${userinfo.checkIn} to ${userinfo.checkOut}.
//     Guest name : ${userinfo.guest.name}
//     Guest email : ${userinfo.guest.email}
//     Guest Phone : ${userinfo.guest.phone}
// `;
//     const data = await resend.emails.send({
//       from: "Anudina Kuteera Support <support@mail.anudinakuteera.com>",
//       to: "deenaprabha93@gmail.com",
//       subject: "Booking information",
//       html,
//     });
//
//     return data;
//   } catch (error) {
//     console.error(error);
//     throw new Error("Error sending mail to admin");
//   }
// };

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const sendMailToGuest = async (userInfo) => {
  try {
    // console.log(userInfo, "userinfo log at resend");
    const name = userInfo.guest.name;
    const email = userInfo.guest.email;
    //if needed use below
    // const bookingUrl = `http://localhost:4000/api/booking/${userInfo.accessToken}`;
    const checkIn = formatDate(userInfo.checkIn);
    const checkOut = formatDate(userInfo.checkOut);
    const adults = userInfo.guest.adults;
    const children = userInfo.guest.children || 0;

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
            font-size: 18px;
            color: #2d5a54;
            margin-bottom: 25px;
            font-weight: 500;
          }
          
          .greeting strong {
            color: #4a9f7f;
          }
          
          .confirmation-text {
            background: linear-gradient(135deg, rgba(74, 159, 127, 0.05), rgba(232, 243, 240, 0.5));
            padding: 20px;
            border-left: 4px solid #4a9f7f;
            border-radius: 8px;
            margin-bottom: 30px;
            color: #2d5a54;
            line-height: 1.7;
          }
          
          .confirmation-text strong {
            color: #2d7a62;
          }
          
          .details-section {
            margin-bottom: 35px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d7a62;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
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
          }
          
          .details-table td:first-child {
            font-weight: 600;
            color: #2d7a62;
            width: 40%;
          }
          
          .details-table td:last-child {
            text-align: right;
          }
          
          .guest-info {
            background: #f5f9f7;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          
          .guest-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            color: #2d5a54;
          }
          
          .guest-info-row:last-child {
            margin-bottom: 0;
          }
          
          .guest-info-label {
            font-weight: 600;
            color: #2d7a62;
          }
          
          .guest-info-value {
            color: #2d5a54;
          }
          
          .cta-section {
            margin-bottom: 30px;
            text-align: center;
          }
          
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4a9f7f 0%, #2d7a62 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            box-shadow: 0 4px 12px rgba(74, 159, 127, 0.3);
          }
          
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(74, 159, 127, 0.4);
          }
          
          .support-section {
            background: #f5f9f7;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #a8d4c7;
          }
          
          .support-title {
            font-weight: 600;
            color: #2d7a62;
            margin-bottom: 12px;
            font-size: 15px;
          }
          
          .support-content {
            font-size: 14px;
            color: #2d5a54;
            line-height: 1.8;
          }
          
          .contact-item {
            margin-bottom: 10px;
            display: flex;
            gap: 8px;
          }
          
          .contact-item:last-child {
            margin-bottom: 0;
          }
          
          .contact-label {
            font-weight: 500;
            color: #2d7a62;
            min-width: 60px;
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
          
          .footer-email {
            font-size: 12px;
            color: #4a9f7f;
            text-decoration: none;
          }
          
          .footer-email:hover {
            text-decoration: underline;
          }
          
          .peace-icon {
            font-size: 24px;
            margin-bottom: 10px;
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
            
            .guest-info-row {
              flex-direction: column;
              gap: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="peace-icon">🌿</div>
            <h1>Booking Confirmed!</h1>
            <p>Your serene getaway awaits</p>
          </div>
          
          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <div class="greeting">
              Welcome, <strong>${name}!</strong>
            </div>
            
            <!-- Confirmation Message -->
            <div class="confirmation-text">
              Your stay at <strong>Anudinakuteera Villa</strong> has been successfully confirmed. We're thrilled to welcome you to our peaceful sanctuary nestled in nature. Get ready for an unforgettable experience of tranquility and comfort.
            </div>
            
            <!-- Booking Details -->
            <div class="details-section">
              <div class="section-title">📅 Your Stay Details</div>
              <table class="details-table">
                <tr>
                  <td>Check-in</td>
                  <td>${checkIn}</td>
                </tr>
                <tr>
                  <td>Check-out</td>
                  <td>${checkOut}</td>
                </tr>
              </table>
            </div>
            
            <!-- Guest Information -->
            <div class="guest-info">
              <div class="section-title" style="margin-bottom: 15px;">👥 Guest Information</div>
              <div class="guest-info-row">
                <span class="guest-info-label">Adults</span>
                <span class="guest-info-value">${adults}</span>
              </div>
              <div class="guest-info-row">
                <span class="guest-info-label">Children</span>
                <span class="guest-info-value">${children === 0 ? "None" : children}</span>
              </div>
            </div>
            
            <!-- Support Section -->
            <div class="support-section">
              <div class="support-title">✨ Need Assistance?</div>
              <div class="support-content">
                We're here to make your stay extraordinary. If you have any questions or special requests, please don't hesitate to reach out.
                <div class="contact-item" style="margin-top: 12px;">
                  <span class="contact-label">Email:</span>
                  <span><a href="mailto:deenaprabha93@gmail.com" style="color: #4a9f7f; text-decoration: none;">deenaprabha93@gmail.com</a></span>
                </div>
                <div class="contact-item">
                  <span class="contact-label">Phone:</span>
                  <span><a href="tel:+919972253584" style="color: #4a9f7f; text-decoration: none;">+91 9972253584</a></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">Anudinakuteera</div>
            <div class="footer-text">Where Nature Meets Comfort</div>
            <a href="mailto:support@mail.anudinakuteera.com" class="footer-email">support@mail.anudinakuteera.com</a>
            <div class="footer-text" style="margin-top: 15px; font-size: 11px; color: #7a9f9a;">
              Thank you for choosing our villa. We look forward to hosting you!
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const data = await resend.emails.send({
      from: "Anudinakuteera Support <support@mail.anudinakuteera.com>",
      to: [email],
      reply_to: "deenaprabha93@gmail.com",
      subject: "✨ Your booking is confirmed – Anudinakuteera",
      html,
    });

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const sendMailToAdmin = async (userinfo) => {
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
