import { Resend } from "resend";

const resend = new Resend("re_PgqkR8o2_MUUa4QfS9BnwvGdSGpjd4A6j");

export const sendMail = async (res) => {
  try {
    resend.emails.send({
      from: "onboarding@resend.dev",
      to: "suryashreevathsa11@gmail.com",
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });
  } catch (error) {
    console.log("error sending mail", error.message);
  }
};
