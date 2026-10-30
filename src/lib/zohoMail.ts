import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email via Zoho Mail SMTP using Nodemailer
 * Strictly reads credentials from environment variables.
 */
export async function sendZohoEmail(options: SendMailOptions): Promise<{ success: boolean; message: string }> {
  const user = process.env.ZOHO_EMAIL || "Hello@rse-edit.com";
  const pass = process.env.ZOHO_PASSWORD;
  const host = process.env.ZOHO_HOST || "smtppro.zoho.in";
  const port = parseInt(process.env.ZOHO_PORT || "465", 10);
  const fromName = process.env.ZOHO_FROM_NAME || "RSE Post Production House";

  if (!pass) {
    console.warn("⚠️ ZOHO_PASSWORD not set in .env.local. Email dispatch simulated.");
    return {
      success: true,
      message: "Zoho email simulated (Credentials not provided)",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: options.to,
      replyTo: `"${fromName}" <${user}>`,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Zoho Email Dispatched Successfully! MessageId:", info.messageId);
    return {
      success: true,
      message: `Email dispatched successfully (ID: ${info.messageId})`,
    };
  } catch (error: any) {
    console.error("Zoho SMTP Send Error:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Failed to dispatch email",
    };
  }
}
