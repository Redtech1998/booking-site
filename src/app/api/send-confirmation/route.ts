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
      contactPerson,
      phone,
      city,
      country,
      slotDate,
      deliveryDate,
      clientDays,
      packageName,
      region,
      pricing,
      deliveryMethod,
      courierName,
      docketNumber,
      rawLink,
      cameraProfile,
      songPreference,
      notes,
      courierDetails,
    } = body;

    if (!clientEmail) {
      return NextResponse.json({ success: false, error: "Recipient email is required" }, { status: 400 });
    }

    const senderEmail = process.env.ZOHO_EMAIL || "Hello@rse-edit.com";
    const adminAlertRecipients =
      process.env.ADMIN_ALERT_EMAIL || "Hello@rse-edit.com, keyur@rse-edit.com, redofficegnr@gmail.com";

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

    // 3. DISPATCH INSTANT ADMIN ALERT EMAIL TO RSE STUDIO TEAM
    try {
      const cleanPhone = phone ? String(phone).replace(/\D/g, "") : "";
      const waLink = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
            studioName || clientName
          )},%20we%20have%20received%20your%20editing%20slot%20booking%20${bookingCode}%20for%20${encodeURIComponent(
            clientName
          )}%20at%20RSE%20Post%20Production%20House!`
        : "";

      const adminSubject = `🔔 [NEW BOOKING] ${bookingCode} • ${studioName || clientName} (${packageName})`;

      const adminTextBody = `
🚨 NEW BOOKING NOTIFICATION 🚨
Booking Code: ${bookingCode}

CLIENT & STUDIO DETAILS:
Studio / Brand: ${studioName || "-"}
Contact Person: ${contactPerson || studioName || "-"}
Couple / Project: ${clientName || "-"}
Phone / WhatsApp: ${phone || "-"}
Email: ${clientEmail}
Location: ${city ? `${city}, ` : ""}${country || "India"}

PRODUCTION TIMELINE:
Selected Deliverables: ${packageName}
Combined Turnaround: ${clientDays || "-"} Working Days
Production Slot Begins: ${slotDate}
Guaranteed Master Delivery: ${deliveryDate}
Data Ingest Method: ${deliveryMethodLabel}
${courierName || docketNumber ? `Courier Details: ${courierName || "Courier"} (Docket #${docketNumber || "Dispatched"})` : ""}
${rawLink ? `Cloud Drive Link: ${rawLink}` : ""}

CREATIVE NOTES:
Camera Profile / LUT: ${cameraProfile || "Standard / Unspecified"}
Music Direction: ${songPreference || "Not specified"}
Special Instructions: ${notes || "None"}

DIRECT WHATSAPP LINK:
${waLink || "Phone not provided"}
      `.trim();

      const adminHtmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Booking Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b;">
  <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    
    <!-- Admin Header -->
    <div style="background-color: #6b2e4c; padding: 24px 32px; text-align: left; border-bottom: 4px solid #a83d5b;">
      <div style="margin-bottom: 10px;">
        <span style="background-color: #f5e6cc; color: #6b2e4c; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          🔔 New Booking Alert
        </span>
        <span style="color: #f5e6cc; font-family: monospace; font-size: 15px; font-weight: bold; float: right;">
          ${bookingCode}
        </span>
      </div>
      <h2 style="color: #ffffff; margin: 0 0 4px; font-size: 20px;">${studioName || clientName}</h2>
      <p style="color: #f5e6cc; opacity: 0.85; margin: 0; font-size: 13px;">${packageName}</p>
    </div>

    <div style="padding: 28px 32px;">
      <!-- Quick Action: WhatsApp Client -->
      ${
        waLink
          ? `
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
        <p style="margin: 0 0 10px; font-size: 13px; color: #065f46; font-weight: 600;">
          📲 Connect with filmmaker on WhatsApp:
        </p>
        <a href="${waLink}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 10px 22px; border-radius: 10px; font-weight: bold; font-size: 13px; text-decoration: none; box-shadow: 0 2px 8px rgba(34,197,94,0.3);">
          Open WhatsApp Chat (${phone}) ↗
        </a>
      </div>
      `
          : ""
      }

      <!-- Client Details Table -->
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b2e4c; margin: 0 0 10px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">
        1. Client & Studio Profile
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a; width: 38%;">Studio Name</td>
            <td style="padding: 8px 0; font-weight: bold; color: #09090b;">${studioName || "-"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Contact Person</td>
            <td style="padding: 8px 0; font-weight: 600; color: #09090b;">${contactPerson || studioName || "-"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Couple / Event</td>
            <td style="padding: 8px 0; font-weight: 600; color: #09090b;">${clientName || "-"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">WhatsApp Phone</td>
            <td style="padding: 8px 0; font-weight: bold; color: #09090b; font-family: monospace;">${phone || "-"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Email Address</td>
            <td style="padding: 8px 0; color: #09090b;"><a href="mailto:${clientEmail}" style="color: #6b2e4c;">${clientEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #71717a;">Location</td>
            <td style="padding: 8px 0; color: #09090b;">${city ? `${city}, ` : ""}${country || "India"}</td>
          </tr>
        </tbody>
      </table>

      <!-- Production Timeline Table -->
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b2e4c; margin: 0 0 10px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">
        2. Production Schedule & Deliverables
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <tbody>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a; width: 38%;">Selected Deliverables</td>
            <td style="padding: 8px 0; font-weight: bold; color: #6b2e4c;">${packageName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Combined Turnaround</td>
            <td style="padding: 8px 0; font-weight: bold; color: #09090b;">${clientDays || "-"} Working Days (Summed)</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Slot Begins (Start Edit)</td>
            <td style="padding: 8px 0; font-weight: bold; color: #09090b; font-family: monospace;">${slotDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Guaranteed Delivery Due</td>
            <td style="padding: 8px 0; font-weight: bold; color: #16a34a; font-family: monospace;">${deliveryDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Data Ingest Method</td>
            <td style="padding: 8px 0; font-weight: 600; color: #09090b;">${deliveryMethodLabel}</td>
          </tr>
          ${
            courierName || docketNumber
              ? `
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Courier / Tracking</td>
            <td style="padding: 8px 0; color: #09090b;">${courierName || "Courier"}: <strong>${docketNumber || "Dispatched"}</strong></td>
          </tr>
          `
              : ""
          }
          ${
            rawLink
              ? `
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 8px 0; color: #71717a;">Raw Footage Link</td>
            <td style="padding: 8px 0; color: #09090b; word-break: break-all;">${rawLink}</td>
          </tr>
          `
              : ""
          }
        </tbody>
      </table>

      ${
        notes || cameraProfile || songPreference
          ? `
      <!-- Creative Notes Table -->
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b2e4c; margin: 0 0 10px; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">
        3. Creative Direction & Notes
      </h3>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 14px; font-size: 12px; line-height: 1.6; color: #3f3f46; margin-bottom: 20px;">
        ${cameraProfile ? `<div><strong>Camera Profile:</strong> ${cameraProfile}</div>` : ""}
        ${songPreference ? `<div><strong>Music Preference:</strong> ${songPreference}</div>` : ""}
        ${notes ? `<div style="margin-top: 6px;"><strong>Creative Notes:</strong> ${notes}</div>` : ""}
      </div>
      `
          : ""
      }
    </div>

    <!-- Admin Footer -->
    <div style="background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 14px 32px; font-size: 11px; color: #a1a1aa; text-align: center;">
      RSE Post Production House • Live Production Alert System<br>
      Logged to internal production database via book.rsegnr.in
    </div>

  </div>
</body>
</html>
      `.trim();

      await sendZohoEmail({
        to: adminAlertRecipients,
        subject: adminSubject,
        text: adminTextBody,
        html: adminHtmlBody,
      });
      console.log("Admin New Booking Notification dispatched to:", adminAlertRecipients);
    } catch (adminErr) {
      console.warn("Failed to dispatch admin booking notification:", adminErr);
    }

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
