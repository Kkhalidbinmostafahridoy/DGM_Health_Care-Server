import nodemailer from "nodemailer";
import config from "../../../../config";

export const emailSender = async (
  email: string,
  subject: string,
  html: string,
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const info = await transporter.sendMail({
    from: `"DGM Care" <${config.email.user}>`,
    to: email,
    subject: "Reset Password Link - DGM Care",
    html: html,
  });
  console.log("Email sent: %s", info.messageId);
  return info;
};
