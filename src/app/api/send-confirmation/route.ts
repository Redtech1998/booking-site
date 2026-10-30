import { NextResponse } from "next/server";
import { sendZohoEmail } from "@/lib/zohoMail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = "confirmation",
      bookingCode,
      clientEmail,
      clientName,
      studioName,
      slotDate,
      deliveryDate,
      packageName,
      region,
      deliveryMethod,
      courierDetails,
    } = body;

    if (!clientEmail) {
      return NextResponse.json({ success: false, error: "Recipient email is required" }, { status: 400 });
    }

    const senderEmail = process.env.ZOHO_EMAIL || "Hello@rse-edit.com";

    // 1. FOOTAGE DELAY REMINDER EMAIL
    if (type === "footage_reminder") {
      const subject = `⚠️ [Urgent Action Required] Footage Deadline Reminder for Slot ${bookingCode} • RSE Post Production House`;
      
      const textBody = `
Dear ${studioName || clientName || "Studio Partner"},

This is an important reminder regarding your upcoming editing slot with RSE Post Production House.

Project Code: ${bookingCode}
Production Slot Date: ${slotDate}
Guaranteed Master Delivery: ${deliveryDate}

We have not yet received your project footage or cloud upload link.
To ensure your production slot begins on time without schedule delays, please ensure your footage reaches our Gandhinagar studio or is uploaded before ${slotDate}.

Studio Contact: +91 93135 53726 / +91 88663 23567
Website: https://rsegnr.in

Warm regards,
Media Ingest Department
RSE Post Production House
      `.trim();

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Footage Deadline Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f8f8; margin: 0; padding: 24px; color: #222;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5e5; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background-color: #6b2e4c; padding: 24px 32px; text-align: center;">
      <h1 style="color: #f5e6cc; margin: 0; font-size: 24px; letter-spacing: 1px;">RSE | Post Production House</h1>
      <p style="color: #ffffff; opacity: 0.9; margin: 4px 0 0; font-size: 13px;">Media Ingest Department • Gandhinagar, Gujarat</p>
    </div>
    
    <div style="padding: 32px;">
      <div style="background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: bold; margin-bottom: 20px;">
        ⚠️ Action Required: Project Raw Footage Pending
      </div>

      <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
        Dear <strong>${studioName || clientName || "Studio Partner"}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        Your editing production slot for <strong>${clientName || "Wedding Project"}</strong> (Booking Code: <code>${bookingCode}</code>) is scheduled to begin on <strong>${slotDate}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 1.6;">
        We have not yet received your hard drive or cloud download link. To guarantee master delivery by <strong>${deliveryDate}</strong>, please dispatch your footage immediately.
      </p>

      <div style="background-color: #faf5f0; border-left: 4px solid #6b2e4c; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 13px;">
        <strong>Gandhinagar Ingest Address (For Courier / Porter):</strong><br>
        <strong>RSE Post Production House</strong><br>
        7th Floor, Radhe Infinity, 726, Raksha Shakti Cir,<br>
        nr. Swaminarayan Dham, Urjanagar, Randesan,<br>
        Gandhinagar, Gujarat – 382421, India<br>
        Contact for Delivery / Porter: +91 93135 53726 / +91 88663 23567<br>
        <a href="https://maps.google.com/?cid=17962468400633901627" style="color: #6b2e4c; font-weight: bold; text-decoration: underline;">Open in Google Maps ↗</a>
      </div>

      <p style="font-size: 13px; color: #666; line-height: 1.6;">
        If you have already dispatched your drive or shared the upload link in your studio WhatsApp group, please disregard this notice.
      </p>
    </div>

    <div style="background-color: #fafafa; border-top: 1px solid #eaeaea; padding: 16px 32px; text-align: center; font-size: 12px; color: #888;">
      RSE Post Production House • <a href="https://rsegnr.in" style="color: #6b2e4c; text-decoration: none;">rsegnr.in</a><br>
      Direct Support: <a href="mailto:${senderEmail}" style="color: #6b2e4c;">${senderEmail}</a>
    </div>
  </div>
</body>
</html>
      `.trim();

      const result = await sendZohoEmail({
        to: clientEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      return NextResponse.json({ success: result.success, message: result.message });
    }

    // 2. STANDARD BOOKING CONFIRMATION EMAIL
    const subject = `[Confirmed] Editing Slot ${bookingCode} Reserved • RSE Post Production House`;
    const deliveryMethodLabel = deliveryMethod === "courier" ? "Physical Hard Drive / SSD" : "High-Speed Online Cloud Transfer";

    const textBody = `
Dear ${studioName || clientName},

Thank you for choosing RSE Post Production House.
Your production editing slot has been successfully registered.

──────────────────────────────────────────────
RESERVATION DETAILS
──────────────────────────────────────────────
Booking Code: ${bookingCode}
Studio / Client: ${studioName}
Couple / Project: ${clientName}
Service: ${packageName}
Production Slot Date: ${slotDate}
Guaranteed Master Delivery: ${deliveryDate}
Data Ingest Method: ${deliveryMethodLabel}
Region: ${region === "foreign" ? "International Client" : "Indian Studio Partner"}
──────────────────────────────────────────────

Important Next Steps:
1. Ensure raw footage reaches our studio or cloud link on or before your slot date (${slotDate}).
2. Our team will connect in your studio WhatsApp group for music curation and narrative references.
3. Once the edit is polished, previews will be shared via Frame.io for timestamped revisions (7-day window).

Studio Location:
RSE Post Production House
7th Floor, Radhe Infinity, 726, Raksha Shakti Cir, nr. Swaminarayan Dham, Urjanagar, Randesan, Gandhinagar, Gujarat – 382421, India
Phone: +91 93135 53726 / +91 88663 23567
Google Maps: https://maps.google.com/?cid=17962468400633901627

Warm regards,
RSE Post Production House
${senderEmail} • https://rsegnr.in
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Editing Slot Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f8f8; margin: 0; padding: 24px; color: #222;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e5e5; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    
    <!-- Header -->
    <div style="background-color: #6b2e4c; padding: 28px 32px; text-align: center;">
      <h1 style="color: #f5e6cc; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800;">RSE | Post Production House</h1>
      <p style="color: #ffffff; opacity: 0.9; margin: 6px 0 0; font-size: 13px;">Bespoke Wedding Film Editing • Color Grading • Sound Mastering</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #22c55e1a; border: 1px solid #22c55e4d; color: #166534; font-size: 12px; font-weight: bold; padding: 6px 14px; rounded-full; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
          ✓ Slot Reservation Confirmed
        </span>
        <h2 style="font-size: 20px; margin: 12px 0 4px; color: #0f0f10;">Your Editing Slot is Locked</h2>
        <p style="font-size: 13px; color: #666; margin: 0;">Booking Code: <strong style="color: #6b2e4c; font-family: monospace; font-size: 15px;">${bookingCode}</strong></p>
      </div>

      <p style="font-size: 14px; line-height: 1.6;">
        Dear <strong>${studioName || clientName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #444;">
        Thank you for reserving your wedding post-production slot with RSE. Your editing schedule and colorist timeline have been locked into our master production calendar.
      </p>

      <!-- Summary Table -->
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; background-color: #fafafa; border-radius: 10px; overflow: hidden; border: 1px solid #eaeaea;">
        <tbody>
          <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 16px; color: #777; width: 40%;">Studio / Brand</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #111;">${studioName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 16px; color: #777;">Couple / Project</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #111;">${clientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 16px; color: #777;">Selected Deliverables</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #6b2e4c;">${packageName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 16px; color: #777;">Production Slot Begins</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #111; font-family: monospace;">${slotDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eaeaea;">
            <td style="padding: 10px 16px; color: #777;">Guaranteed Delivery Due</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #16a34a; font-family: monospace;">${deliveryDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; color: #777;">Data Ingest Method</td>
            <td style="padding: 10px 16px; font-weight: bold; color: #111;">${deliveryMethodLabel}</td>
          </tr>
        </tbody>
      </table>

      ${
        deliveryMethod === "courier"
          ? `
      <div style="background-color: #f5e6cc40; border: 1px solid #f5e6cc; border-radius: 12px; padding: 18px; margin: 24px 0; font-size: 13px;">
        <strong style="color: #6b2e4c; font-size: 14px; display: block; margin-bottom: 6px;">📍 Gandhinagar Studio Ingest Address (For Courier & Porter):</strong>
        <p style="margin: 0 0 6px; line-height: 1.5; color: #222;">
          <strong>RSE Post Production House</strong><br>
          7th Floor, Radhe Infinity, 726, Raksha Shakti Cir,<br>
          nr. Swaminarayan Dham, Urjanagar, Randesan,<br>
          Gandhinagar, Gujarat – 382421, India<br>
          <span style="color: #555;">Contact for Receiving: +91 93135 53726 / +91 88663 23567</span>
        </p>
        <a href="https://maps.google.com/?cid=17962468400633901627" style="display: inline-block; background-color: #6b2e4c; color: #f5e6cc; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 12px; font-weight: bold; margin-top: 6px;">
          Open in Google Maps (For Driver Navigation) ↗
        </a>
      </div>
      `
          : `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin: 24px 0; font-size: 13px;">
        <strong style="color: #1e40af; font-size: 14px; display: block; margin-bottom: 6px;">☁️ High-Speed Cloud Ingest:</strong>
        <p style="margin: 0; line-height: 1.5; color: #1e3a8a;">
          Please ensure all RAW camera cards and audio tracks are completely uploaded 1 day prior to your slot date (by 11:59 PM). If you requested an RSE dedicated folder, our team will share the Google Drive link on WhatsApp.
        </p>
      </div>
      `
      }

      <div style="margin: 24px 0; font-size: 13px; line-height: 1.7; color: #444;">
        <strong style="color: #0f0f10; display: block; margin-bottom: 6px;">Next Production Milestones:</strong>
        1. <strong>Footage Ingest:</strong> Data reaches studio / cloud link by 6:00 PM before your slot date (Ingested to Adobe Premiere Pro / FCP X master stations).<br>
        2. <strong>Music Direction & Color:</strong> Narrative edit synced, graded in DaVinci Resolve Studio.<br>
        3. <strong>Master Review:</strong> High-bitrate 4K preview delivered on Frame.io (7-day revision window).
      </div>

      <p style="font-size: 13px; color: #666; line-height: 1.5; margin-top: 24px;">
        For any questions, simply reply directly to this email at <a href="mailto:${senderEmail}" style="color: #6b2e4c;">${senderEmail}</a> or reach us on WhatsApp.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #fafafa; border-top: 1px solid #eaeaea; padding: 18px 32px; text-align: center; font-size: 12px; color: #888;">
      RSE Post Production House • Gandhinagar, Gujarat • <a href="https://rsegnr.in" style="color: #6b2e4c; text-decoration: none; font-weight: bold;">rsegnr.in</a><br>
      Confidentiality & Non-Disclosure Agreement (NDA) Protected.
    </div>

  </div>
</body>
</html>
    `.trim();

    const emailResult = await sendZohoEmail({
      to: clientEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log("─── ZOHO MAIL DISPATCH RESULT ───");
    console.log("Sender:", senderEmail);
    console.log("Recipient:", clientEmail);
    console.log("Result:", emailResult);

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.message,
      bookingCode,
      sender: senderEmail,
      recipient: clientEmail,
    });
  } catch (error: any) {
    console.error("Zoho email route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process email" },
      { status: 500 }
    );
  }
}
