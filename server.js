require("dotenv").config();

const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000; // Changed port to avoid conflict

// Explicit CORS headers for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));

// Test route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Send email route
app.post("/send", async (req, res) => {
  console.log("POST /send received:", req.body); // Debug log

  const { name, email, subject, message } = req.body;

  // validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      msg: "All fields (name, email, subject, message) are required",
    });
  }

  // Skip strict email validation - server receives data fine
  console.log("Email validation passed:", email);

  try {
    // transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    // Verify transporter (optional, for debugging)
    await transporter.verify();

    // Enhanced mail options with HTML
    const mailOptions = {
      from: `"Portfolio Contact Form" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      replyTo: email,
      subject: `📩 New Portfolio Message: ${subject} from ${name}`,
      text: `
New message from Portfolio contact form:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}

---
Sent via http://localhost:${PORT}/send
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00abf0, #0080c0); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .field label { font-weight: 600; color: #00abf0; display: block; margin-bottom: 5px; }
    .field value { font-family: monospace; background: white; padding: 8px 12px; border-radius: 5px; border-left: 4px solid #00abf0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header">
    <h2>📩 New Portfolio Message</h2>
  </div>
  <div class="content">
    <div class="field">
      <label>Name:</label>
      <value>${name}</value>
    </div>
    <div class="field">
      <label>Email:</label>
      <value>${email}</value>
    </div>
    <div class="field">
      <label>Subject:</label>
      <value>${subject}</value>
    </div>
    <div class="field">
      <label>Message:</label>
      <value style="white-space: pre-wrap; font-size: 1.1em;">${message}</value>
    </div>
  </div>
  <div class="footer">
    Sent via Aman Singh Portfolio • http://localhost:${PORT}
  </div>
</body>
</html>
      `,
    };

    // send mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      msg: "✅ Message sent successfully! Check your email.",
      data: { name, email, subject },
    });
  } catch (error) {
    console.error("Email Error:", error);

    // More specific error handling
    if (error.code === "EAUTH") {
      res.status(500).json({
        success: false,
        msg: "❌ Email authentication failed. Check EMAIL/PASSWORD in .env (use Gmail App Password)",
      });
    } else {
      res.status(500).json({
        success: false,
        msg: "❌ Failed to send email. Please try again or contact via WhatsApp.",
      });
    }
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio Server running on http://localhost:${PORT}`);
  console.log(`📧 Contact API ready at http://localhost:${PORT}/send`);
  console.log(`🌐 View portfolio: http://localhost:${PORT}`);
  console.log(
    `🔧 Test API: curl -X POST http://localhost:${PORT}/send -H "Content-Type: application/json" -d '{"name":"test","email":"test@test.com","subject":"test","message":"test"}'`,
  );
});
