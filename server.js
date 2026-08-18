const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { sendContactEmail } = require("./contact-mailer");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "portfolio-email-api" });
});

async function handleContactSend(req, res) {
  try {
    const result = await sendContactEmail(req.body);
    return res.json(result);
  } catch (error) {
    console.error("POST contact send error:", error);
    return res.status(error.status || 500).json({
      ok: false,
      error: error.publicMessage || "Failed to send email",
    });
  }
}

app.post("/api/send", handleContactSend);
app.post("/send", handleContactSend);

app.use("/img", express.static(path.join(__dirname, "img")));

app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Portfolio running on http://localhost:${PORT}`);
  console.log(`Contact API ready at http://localhost:${PORT}/api/send`);
});
