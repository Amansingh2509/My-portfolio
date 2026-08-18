const { sendContactEmail } = require("../contact-mailer");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const result = await sendContactEmail(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/send error:", error);
    return res.status(error.status || 500).json({
      ok: false,
      error: error.publicMessage || "Failed to send email",
    });
  }
};
