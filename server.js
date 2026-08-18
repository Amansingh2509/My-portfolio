const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "portfolio-email-api" });
});

function validateEmailInput(payload = {}) {
  const { name, email, subject, message } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    return { valid: false, error: "Name is required" };
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return { valid: false, error: "Subject is required" };
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return { valid: false, error: "Message is required" };
  }

  return { valid: true };
}

app.post("/send", async (req, res) => {
  try {
    const check = validateEmailInput(req.body);
    if (!check.valid) {
      return res.status(400).json({ ok: false, error: check.error });
    }

    const { name, email, subject, message } = req.body;

    // Configure transporter using environment variables
    // Required:
    //   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO } =
      process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
      return res.status(500).json({
        ok: false,
        error:
          "Missing SMTP configuration. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_TO in .env",
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const mailOptions = {
      from: SMTP_USER,
      to: EMAIL_TO,
      subject: subject,
      text: [
        `You have received a new message from your portfolio website.`,
        `\nName: ${name}`,
        `Email: ${email}`,
        `\nMessage:\n${message}`,
      ].join("\n"),
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("POST /send error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, () => {
  console.log(`Portfolio email API running on http://localhost:${PORT}`);
});
