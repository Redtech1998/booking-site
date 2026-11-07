// ─── RSE Post Production House: Official Pricing & Duration Calculator ───

export interface ParsedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalMinutes: number;
  formatted: string;
}

export interface PricingResult {
  totalAmount: number;
  advanceAmount: number;
  finalAmount: number;
  breakdownText: string;
  isProRataApplied?: boolean;
  isMinFloorApplied?: boolean;
}

/**
 * Parses user-entered durations according to context:
 * For Traditional Film (hourly rate): "1:25" means 1 hr 25 min, "0:35" means 35 min.
 * For Highlight (minute rate): "5:40" means 5 min 40 sec.
 */
export function parseDuration(input: string, isHourlyContext: boolean = false): ParsedDuration {
  const clean = (input || "").trim().replace(/[^\d:.]/g, "");
  if (!clean) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, totalMinutes: 0, formatted: "00:00" };
  }

  const parts = clean.split(":").map((p) => Number(p) || 0);

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 3) {
    // HH:MM:SS
    hours = parts[0];
    minutes = parts[1];
    seconds = parts[2];
  } else if (parts.length === 2) {
    if (isHourlyContext) {
      // In Hourly context (Traditional films), "1:25" is 1 Hour 25 Minutes
      hours = parts[0];
      minutes = parts[1];
      seconds = 0;
    } else {
      // In Minute context (Highlights, trailers), "5:40" is 5 Minutes 40 Seconds
      minutes = parts[0];
      seconds = parts[1];
    }
  } else if (parts.length === 1) {
    const val = Number(clean);
    if (!isNaN(val)) {
      if (clean.includes(".")) {
        // Decimal hours, e.g. 1.5 -> 1h 30m
        hours = Math.floor(val);
        minutes = Math.round((val - hours) * 60);
      } else {
        // Whole minutes, e.g. 75 -> 75m (1h 15m)
        minutes = val;
      }
    }
  }

  // Normalize
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
  }
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
  }

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalMinutes = totalSeconds / 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted =
    hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, totalSeconds, totalMinutes, formatted };
}

/**
 * Calculates RSE standard project price based on official studio business rules:
 * 1. Wedding Highlight: ₹1,251 / minute pro-rata (₹20.85 per second)
 * 2. Traditional Single-Cam: ₹1,550 / hour (0 to 60 min minimum ₹1,550 floor, pro-rata above 60 min)
 * 3. Traditional Multi-Cam: ₹1,850 / hour (0 to 60 min minimum ₹1,850 floor, pro-rata above 60 min)
 * 4. Wedding Short Film (30-40 min): Fixed ₹16,500
 * 5. Wedding Reel (Vertical 9:16): ₹951 per reel
 * 6. Wedding Insta Cut: ₹1,851 per cut
 * 7. Wedding Teaser / Trailer (60-90s): ₹3,500 base
 * 8. Corporate, Education & Foreign: Custom quote / negotiated
 */
export function calculateRsePrice(
  serviceId: string,
  durationInput: string,
  quantity: number = 1
): PricingResult {
  const isHourly = serviceId.includes("trad") || serviceId.includes("hourly");
  const dur = parseDuration(durationInput, isHourly);
  const qty = Math.max(1, quantity || 1);

  // 1. Wedding Highlight (3 to 5 min) @ ₹1,251 / minute (pro-rata exact per second)
  if (serviceId === "in_wedding_highlight" || serviceId.includes("highlight")) {
    const ratePerMin = 1251;
    const ratePerSec = ratePerMin / 60; // 20.85
    const totalSecs = dur.totalSeconds > 0 ? dur.totalSeconds : 4 * 60; // Default 4 min if empty
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    const totalAmount = Math.round(mins * ratePerMin + secs * ratePerSec);
    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;

    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText: `${mins}m ${secs}s @ ₹${ratePerMin.toLocaleString("en-IN")}/મિનિટ (₹૨૦.૮૫/સે.) = ₹${totalAmount.toLocaleString("en-IN")}`,
      isProRataApplied: true,
    };
  }

  // 2. Traditional Wedding Film (Single-Cam) @ ₹1,550 / hour
  if (serviceId === "in_trad_single_cam") {
    const hourlyRate = 1550;
    const totalMinutes = dur.totalMinutes > 0 ? dur.totalMinutes : 60;

    let totalAmount = hourlyRate;
    let breakdownText = "";
    let isMinFloorApplied = false;

    if (totalMinutes <= 60) {
      totalAmount = hourlyRate;
      isMinFloorApplied = true;
      breakdownText = `${Math.round(totalMinutes)} મિનિટ (૦ થી ૬૦ મિનિટ ન્યૂનતમ ૧ કલાક સ્લેબ) = ₹${hourlyRate.toLocaleString("en-IN")}`;
    } else {
      const extraMinutes = totalMinutes - 60;
      const extraCost = Math.round(extraMinutes * (hourlyRate / 60));
      totalAmount = hourlyRate + extraCost;
      const h = Math.floor(totalMinutes / 60);
      const m = Math.round(totalMinutes % 60);
      breakdownText = `${h} કલાક ${m} મિનિટ [૧ કલાક ₹${hourlyRate.toLocaleString("en-IN")} + ${m} મિનિટ ₹${extraCost.toLocaleString("en-IN")}] = ₹${totalAmount.toLocaleString("en-IN")}`;
    }

    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;

    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText,
      isMinFloorApplied,
      isProRataApplied: !isMinFloorApplied,
    };
  }

  // 3. Traditional Wedding Film (Multi-Cam) @ ₹1,850 / hour
  if (serviceId === "in_trad_multi_cam") {
    const hourlyRate = 1850;
    const totalMinutes = dur.totalMinutes > 0 ? dur.totalMinutes : 60;

    let totalAmount = hourlyRate;
    let breakdownText = "";
    let isMinFloorApplied = false;

    if (totalMinutes <= 60) {
      totalAmount = hourlyRate;
      isMinFloorApplied = true;
      breakdownText = `${Math.round(totalMinutes)} મિનિટ (૦ થી ૬૦ મિનિટ ન્યૂનતમ ૧ કલાક સ્લેબ) = ₹${hourlyRate.toLocaleString("en-IN")}`;
    } else {
      const extraMinutes = totalMinutes - 60;
      const extraCost = Math.round(extraMinutes * (hourlyRate / 60));
      totalAmount = hourlyRate + extraCost;
      const h = Math.floor(totalMinutes / 60);
      const m = Math.round(totalMinutes % 60);
      breakdownText = `${h} કલાક ${m} મિનિટ [૧ કલાક ₹${hourlyRate.toLocaleString("en-IN")} + ${m} મિનિટ ₹${extraCost.toLocaleString("en-IN")}] = ₹${totalAmount.toLocaleString("en-IN")}`;
    }

    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;

    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText,
      isMinFloorApplied,
      isProRataApplied: !isMinFloorApplied,
    };
  }

  // 4. Wedding Short Film (30 to 40 min) @ Fixed ₹16,500
  if (serviceId === "in_wedding_short_film") {
    const totalAmount = 16500;
    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;
    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText: "Wedding Short Film (૩૦ થી ૪૦ મિનિટ) ફિક્સ રેટ = ₹૧૬,૫૦૦",
    };
  }

  // 5. Wedding Vertical Reel @ ₹951 / reel
  if (serviceId === "in_wedding_reel") {
    const totalAmount = qty * 951;
    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;
    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText: `${qty} ઊભી રીલ (Vertical 9:16) @ ₹૯૫૧ = ₹${totalAmount.toLocaleString("en-IN")}`,
    };
  }

  // 6. Wedding Insta Cut @ ₹1,851 / cut
  if (serviceId === "in_wedding_insta_cut") {
    const totalAmount = qty * 1851;
    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;
    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText: `${qty} ઇન્સ્ટા કટ (9:16) @ ₹૧,૮૫૧ = ₹${totalAmount.toLocaleString("en-IN")}`,
    };
  }

  // 7. Wedding Teaser / Trailer @ ₹3,500 base
  if (serviceId === "in_wedding_teaser") {
    const totalAmount = 3500;
    const advanceAmount = Math.round(totalAmount / 2);
    const finalAmount = totalAmount - advanceAmount;
    return {
      totalAmount,
      advanceAmount,
      finalAmount,
      breakdownText: "Wedding Teaser / Trailer બેઝ રેટ = ₹૩,૫૦૦ (રેન્જ: ₹૩,૫૦૦ - ₹૫,૦૦૦)",
    };
  }

  // Default / Custom / Foreign
  return {
    totalAmount: 0,
    advanceAmount: 0,
    finalAmount: 0,
    breakdownText: "Custom Quote / ચર્ચા મુજબ નક્કી થશે",
  };
}

// ─── Diwali & Labh Pancham Muhurat Special Offer (15% Flat Discount + ₹1,000 Token) ───

export const LABH_PANCHAM_OFFER_DEADLINE = "2026-11-14T23:59:59+05:30";

export function isLabhPanchamActive(): boolean {
  try {
    return new Date() <= new Date(LABH_PANCHAM_OFFER_DEADLINE);
  } catch (_) {
    return false;
  }
}

export interface LabhPanchamPriceResult {
  originalPrice: number;
  discountPercent: number; // 15
  discountAmount: number;
  offerPrice: number;
  tokenAdvance: number; // 1000
  balanceDue: number;
  breakdownText: string;
}

export function calculateLabhPanchamPrice(
  serviceId: string,
  durationInput: string = "",
  customBasePrice?: number
): LabhPanchamPriceResult {
  const std = calculateRsePrice(serviceId, durationInput, customBasePrice);
  const originalPrice = std.totalAmount;
  const discountPercent = 15;
  const discountAmount = Math.round(originalPrice * 0.15);
  const offerPrice = Math.max(0, originalPrice - discountAmount);
  const tokenAdvance = 1000;
  const balanceDue = Math.max(0, offerPrice - tokenAdvance);

  return {
    originalPrice,
    discountPercent,
    discountAmount,
    offerPrice,
    tokenAdvance,
    balanceDue,
    breakdownText: `મૂળ ભાવ ₹${originalPrice.toLocaleString("en-IN")} માંથી ૧૫% મુહૂર્ત ડિસ્કાઉન્ટ (-₹${discountAmount.toLocaleString("en-IN")}) બાદ ફાઇનલ ભાવ ₹${offerPrice.toLocaleString("en-IN")}. માત્ર ₹1,000 માં સ્લોટ લોક.`,
  };
}

