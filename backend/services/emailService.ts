import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

class emailService {
  static transporter = nodemailer.createTransport({
    // host: "smtp.example.com",
    // port: 587,
    // secure: false,
    host: process.env.SMTP_HOST, // e.g. "smtp.gmail.com"
    port: process.env.SMTP_PORT,
    // service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // ❗ ใช้ app password
    },
  } as nodemailer.TransportOptions);

  // 🔥 verify connection
  static verifyConnection() {
    // console.log("SMTP_HOST:", process.env.SMTP_HOST);
    // console.log("SMTP_PORT:", process.env.SMTP_PORT);
    // console.log("SMTP_USER:", process.env.SMTP_USER);
    // console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***" : "missing");

    this.transporter.verify((error, success) => {
      if (error) {
        console.error("SMTP error:", error);
      } else {
        console.log("SMTP ready 🚀");
      }
    });
  }

  static sendOtpEmail = async (to: string, otp: string) => {
    try {
      const info = await this.transporter.sendMail({
        from: '"Example Team" <team@example.com>', // ✅ ต้องตรง Gmail
        to: to || "alice@example.com, bob@example.com", // list of recipients
        subject: "Your OTP Code",
        html: `
        <div style="font-family:sans-serif">
        <h2>OTP Verification</h2>
        <p>Your OTP code is:</p>
        <h1>${otp}</h1>
        <p>Expires in 5 minutes</p>
        </div>
        `,
      });
      if (info.rejected.length > 0) {
        console.warn("Some recipients were rejected:", info.rejected);
      }
      console.log("Message sent: %s", info.messageId);
      // Preview URL is only available when using an Ethereal test account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err: any) {
      switch (err.code) {
        case "ECONNECTION":
        case "ETIMEDOUT":
          console.error("Network error - retry later:", err.message);
          break;
        case "EAUTH":
          console.error("Authentication failed:", err.message);
          break;
        case "EENVELOPE":
          console.error("Invalid recipients:", err.rejected);
          break;
        default:
          console.error("Send failed:", err.message);
      }
    }
  };
}
export default emailService;
