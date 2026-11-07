import { NextResponse } from "next/server";
import { sendZohoEmail } from "@/lib/zohoMail";
import { createWhatsAppChatUrl } from "@/lib/phone";

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

    // 1. LABH PANCHAM FESTIVE MUHURAT CONFIRMATION (WITH DIWALI & NEW YEAR GREETINGS)
    if (type === "labh_pancham_confirmation") {
      const subject = `🪔 [મુહૂર્ત બુકિંગ રસીદ] ${bookingCode} • શુભ દીપાવલી & નૂતન વર્ષાભિનંદન • RSE Post Production House`;

      const textBody = `
🪔 શુભ દીપાવલી & નૂતન વર્ષાભિનંદન! (Happy Diwali & Happy New Year 2026) 🪔
RSE પોસ્ટ પ્રોડક્શન પરિવાર તરફથી તમને અને તમારા સમગ્ર પરિવાર તથા સ્ટુડિયો ટીમને દિવાળી અને નવા વર્ષની હાર્દિક શુભકામનાઓ!

નમસ્તે ${studioName || clientName},

RSE "લાભ પાંચમ મુહૂર્ત બુકિંગ ઑફર '26" હેઠળ તમારા વેડિંગ પ્રોજેક્ટ માટે સ્લોટ બુકિંગ રિક્વેસ્ટ સફળતાપૂર્વક નોંધાઈ ગઈ છે.

──────────────────────────────────────────────
મુહૂર્ત બુકિંગ વિગતો (RESERVATION DETAILS)
──────────────────────────────────────────────
બુકિંગ કોડ: ${bookingCode}
સ્ટુડિયો / કંપની: ${studioName}
પ્રોજેક્ટ (કપલ): ${clientName}
સંપર્ક નંબર: ${phone}
ઈમેઇલ: ${clientEmail}
એડિટિંગ સ્લોટ તારીખ: ${slotDate}
અંદાજિત 4K માસ્ટર ડિલિવરી તારીખ: ${deliveryDate}
પસંદ કરેલ સર્વિસ: ${packageName}
૧૫% મુહૂર્ત ફાઇનલ કિંમત: ₹${(pricing?.totalAmount || 0).toLocaleString("en-IN")}
સ્લોટ લોક ટોકન એડવાન્સ: ₹1,000 (ચકાસણી પ્રક્રિયામાં / Pending WhatsApp Screenshot)
──────────────────────────────────────────────

🚨 અગત્યની સૂચના:
સ્લોટ ત્યારે જ સત્તાવાર કન્ફર્મ ગણાશે જ્યારે તમારા ₹૧,૦૦૦ ટોકન પેમેન્ટનો સ્ક્રીનશૉટ WhatsApp પર વેરિફાય થશે.
જો તમે સ્ક્રીનશૉટ હજી ન મોકલ્યો હોય, તો કૃપા કરીને નીચેના WhatsApp નંબર પર મોકલી આપો:
WhatsApp: +91 8866323567

આગામી પગલાં:
૧. સ્લોટ તારીખના ૩ થી ૫ દિવસ પહેલાં રૉ ફૂટેજ પહોંચાડવી.
૨. વોટરમાર્કડ પ્રિવ્યુ Frame.io પર શેર કરવામાં આવશે.
૩. પ્રિવ્યુ મંજૂર થયા બાદ ફાઇનલ 4K માસ્ટર ડિલિવરી વખતે ૧૫% ડિસ્કાઉન્ટ બાદ બાકી રકમ ચૂકવવાની રહેશે.

શુભેચ્છાઓ સાથે,
RSE Post Production House
7th Floor, Radhe Infinity, Gandhinagar, Gujarat
ફોન / WhatsApp: +91 8866323567 / +91 9313553726
ઈમેઇલ: Hello@rse-edit.com • વેબસાઇટ: https://book.rsegnr.in
      `.trim();

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>શુભ દીપાવલી & મુહૂર્ત બુકિંગ રસીદ</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #1C1C1E;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 2px solid #F59E0B; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06);">
    
    <!-- Festive Header Banner -->
    <div style="background: linear-gradient(135deg, #6B2E4C 0%, #8B3A62 50%, #45142E 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #FDE68A; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
        ✨ દિવાળી & લાભ પાંચમ મુહૂર્ત ઑફર '26 ✨
      </div>
      <h1 style="color: #FFF8E7; margin: 0; font-size: 24px; font-family: Georgia, serif; font-weight: 800;">
        🪔 શુભ દીપાવલી & નૂતન વર્ષાભિનંદન 🪔
      </h1>
      <p style="color: #FDE68A; margin: 8px 0 0; font-size: 13px; line-height: 1.5;">
        RSE પોસ્ટ પ્રોડક્શન પરિવાર તરફથી તમને અને તમારા સમગ્ર પરિવાર તથા સ્ટુડિયો ટીમને દિવાળી અને નવા વર્ષની હાર્દિક શુભકામનાઓ! નવું વર્ષ તમારા માટે સુખ, શાંતિ, સમૃદ્ધિ અને અનેક શાનદાર વેડિંગ પ્રોજેક્ટ્સ લઈને આવે એવી પ્રભુ ચરણોમાં પ્રાર્થના.
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 24px;">
      <div style="text-align: center; margin-bottom: 20px; padding: 12px; background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px;">
        <span style="font-size: 12px; font-weight: bold; color: #92400E; display: block;">
          મુહૂર્ત સ્લોટ બુકિંગ રિક્વેસ્ટ નોંધાઈ ગઈ છે
        </span>
        <div style="font-size: 18px; font-weight: 800; color: #6B2E4C; margin-top: 2px; font-family: monospace;">
          કોડ: ${bookingCode}
        </div>
      </div>

      <p style="font-size: 14px; line-height: 1.6; margin: 0 0 14px;">
        નમસ્તે <strong>${studioName || clientName}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #4A4A4C; margin: 0 0 16px;">
        લાભ પાંચમના શુભ મુહૂર્તમાં તમારા વેડિંગ પ્રોજેક્ટ માટે સ્લોટ બુકિંગ રિક્વેસ્ટ અમને મળી ગઈ છે. નીચે તમારી બુકિંગ વિગતો છે:
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; background-color: #FAF8F5; border-radius: 12px; overflow: hidden; border: 1px solid #E5E5EA;">
        <tbody>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93; width: 40%;">સ્ટુડિયો / ક્લાયન્ટ</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #1C1C1E;">${studioName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93;">પ્રોજેક્ટ (કપલ)</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #1C1C1E;">${clientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93;">પસંદ કરેલ સર્વિસ</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #6B2E4C;">${packageName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93;">એડિટિંગ સ્લોટ તારીખ</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #1C1C1E; font-family: monospace;">${slotDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93;">અંદાજિત માસ્ટર ડિલિવરી</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #16A34A; font-family: monospace;">${deliveryDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E5E5EA;">
            <td style="padding: 10px 14px; color: #8E8E93;">૧૫% મુહૂર્ત ફાઇનલ ભાવ</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #92400E; font-family: monospace;">₹${(pricing?.totalAmount || 0).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #8E8E93;">ટોકન એડવાન્સ</td>
            <td style="padding: 10px 14px; font-weight: bold; color: #B45309; font-family: monospace;">₹1,000 (ચકાસણી પ્રક્રિયામાં)</td>
          </tr>
        </tbody>
      </table>

      <!-- Strict Payment Verification Notice -->
      <div style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #991B1B; line-height: 1.5;">
        <strong>⚠️ પેમેન્ટ વેરિફિકેશન સૂચના:</strong><br>
        જ્યાં સુધી તમારા ₹૧,૦૦૦ ટોકન પેમેન્ટનો સ્ક્રીનશૉટ અમારા સત્તાવાર WhatsApp પર વેરિફાય નહીં થાય ત્યાં સુધી સ્લોટ બુક થયેલો ગણાશે નહીં. જો તમે હજી સ્ક્રીનશૉટ ન મોકલ્યો હોય, તો કૃપા કરીને નીચેના બટન પર ક્લિક કરીને મોકલી આપો:
      </div>

      <!-- WhatsApp Button in Email -->
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://wa.me/918866323567?text=${encodeURIComponent(`નમસ્તે RSE સ્ટુડિયો,\n\nમેં 'લાભ પાંચમ મુહૂર્ત ઓફર '26' હેઠળ સ્લોટ બુકિંગ #${bookingCode} (${clientName}) માટે ₹1,000 ટોકન એડવાન્સ પેમેન્ટ કર્યું છે. પેમેન્ટનો સ્ક્રીનશૉટ આ સાથે જોડ્યો છે.`)}" style="display: inline-block; background-color: #16A34A; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
          📲 WhatsApp પર પેમેન્ટ સ્ક્રીનશૉટ મોકલો (+91 8866323567)
        </a>
      </div>

      <p style="font-size: 12px; color: #8E8E93; line-height: 1.5; margin: 0; text-align: center;">
        કોઈપણ પ્રશ્ન હોય તો તમે સીધા આ ઈમેઇલનો જવાબ આપી શકો છો અથવા +91 8866323567 પર સંપર્ક કરી શકો છો.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #FAF8F5; border-top: 1px solid #E5E5EA; padding: 16px 24px; text-align: center; font-size: 11px; color: #8E8E93;">
      <strong>RSE Post Production House</strong> • ગાંધીનગર, ગુજરાત<br>
      ઈમેઇલ: ${senderEmail} • વેબસાઇટ: <a href="https://book.rsegnr.in" style="color: #6B2E4C; text-decoration: none; font-weight: bold;">book.rsegnr.in</a>
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

      // Also alert studio admins
      sendZohoEmail({
        to: adminAlertRecipients,
        subject: `[🪔 મુહૂર્ત બુકિંગ રિક્વેસ્ટ] ${bookingCode} - ${studioName} (${clientName})`,
        text: `નવું લાભ પાંચમ મુહૂર્ત બુકિંગ આવ્યું છે:\nકોડ: ${bookingCode}\nસ્ટુડિયો: ${studioName}\nકપલ: ${clientName}\nફોન: ${phone}\nઈમેઇલ: ${clientEmail}\nસ્લોટ તારીખ: ${slotDate}\nરકમ: ₹${pricing?.totalAmount}\nટોકન: ₹1,000\nWhatsApp: +91 8866323567`,
      }).catch((e) => console.error("Admin alert error:", e));

      return NextResponse.json({ success: result.success, message: result.message });
    }

    // 2. FOOTAGE DELAY REMINDER EMAIL
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
        2. <strong>Music Direction & Color:</strong> Narrative edit synced, graded in cinematic 4K color & master sound.<br>
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
      const {
        cleanDigits,
        formattedDisplay,
        url: waLink,
      } = createWhatsAppChatUrl(phone, {
        country,
        region,
        city,
        message: `Hi ${studioName || clientName}, we have received your editing slot booking ${bookingCode} for ${clientName} at RSE Post Production House!`,
      });

      const adminSubject = `🔔 [NEW BOOKING] ${bookingCode} • ${studioName || clientName} (${packageName})`;

      const adminTextBody = `
🚨 NEW BOOKING NOTIFICATION 🚨
Booking Code: ${bookingCode}

CLIENT & STUDIO DETAILS:
Studio / Brand: ${studioName || "-"}
Contact Person: ${contactPerson || studioName || "-"}
Couple / Project: ${clientName || "-"}
Phone / WhatsApp: ${formattedDisplay || phone || "-"}
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
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 10px 22px; border-radius: 10px; font-weight: bold; font-size: 13px; text-decoration: none; box-shadow: 0 2px 8px rgba(34,197,94,0.3);">
          Open WhatsApp Chat (${formattedDisplay || cleanDigits || phone}) ↗
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
            <td style="padding: 8px 0; font-weight: bold; color: #09090b; font-family: monospace;">${formattedDisplay || phone || "-"}</td>
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
