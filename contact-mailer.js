const nodemailer = require("nodemailer");

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createPublicError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.publicMessage = message;
  return error;
}

function validateContactPayload(payload = {}) {
  const data = {
    name: clean(payload.name),
    email: clean(payload.email),
    subject: clean(payload.subject).replace(/[\r\n]+/g, " "),
    message: clean(payload.message),
  };

  if (!data.name) {
    throw createPublicError(400, "Name is required");
  }

  if (!data.email) {
    throw createPublicError(400, "Email is required");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw createPublicError(400, "Enter a valid email address");
  }

  if (!data.subject) {
    throw createPublicError(400, "Subject is required");
  }

  if (!data.message) {
    throw createPublicError(400, "Message is required");
  }

  return data;
}

function getMailerSettings(env = process.env) {
  const smtpHost = clean(env.SMTP_HOST);
  const smtpPort = Number(clean(env.SMTP_PORT) || 587);
  const smtpUser = clean(env.SMTP_USER || env.EMAIL);
  const smtpPass = clean(env.SMTP_PASS || env.PASSWORD);
  const emailTo = clean(env.EMAIL_TO || env.TO_EMAIL || env.EMAIL || smtpUser);
  const emailFrom = clean(env.EMAIL_FROM || smtpUser);

  if (!smtpUser || !smtpPass || !emailTo) {
    throw createPublicError(
      500,
      "Email service is not configured. Set EMAIL and PASSWORD, or SMTP_USER, SMTP_PASS, and EMAIL_TO.",
    );
  }

  if (smtpHost && (!Number.isInteger(smtpPort) || smtpPort <= 0)) {
    throw createPublicError(500, "Email service has an invalid SMTP_PORT.");
  }

  const transport = smtpHost
    ? {
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

  return {
    emailFrom,
    emailTo,
    transport,
  };
}

async function sendContactEmail(payload, env = process.env) {
  const data = validateContactPayload(payload);
  const settings = getMailerSettings(env);
  const transporter = nodemailer.createTransport(settings.transport);

  await transporter.sendMail({
    from: `"Aman Singh Portfolio" <${settings.emailFrom}>`,
    to: settings.emailTo,
    replyTo: {
      name: data.name,
      address: data.email,
    },
    subject: `Portfolio message: ${data.subject}`,
    text: [
      "You have received a new message from your portfolio website.",
      "",
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Subject: ${data.subject}`,
      "",
      "Message:",
      data.message,
    ].join("\n"),
  });

  return { ok: true, message: "Email sent successfully" };
}

module.exports = {
  sendContactEmail,
  validateContactPayload,
};
