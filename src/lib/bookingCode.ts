/**
 * Booking code generator & parser.
 * Format: RSE/<MONTH_SHORT>/<3_DIGIT_SEQ_NUMBER>
 * Example: RSE/NOV/029, RSE/NOV/006, RSE/DEC/001
 */

const MONTH_SHORT_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/**
 * Extracts 3-letter uppercase month abbreviation from a date string (YYYY-MM-DD or ISO).
 */
export function getSlotMonthAbbr(dateStr?: string | null): string {
  if (!dateStr) {
    return MONTH_SHORT_NAMES[new Date().getMonth()];
  }

  // Fast parse for YYYY-MM-DD
  const parts = String(dateStr).split("-");
  if (parts.length >= 2) {
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return MONTH_SHORT_NAMES[monthIndex];
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return MONTH_SHORT_NAMES[parsed.getMonth()];
  }

  return MONTH_SHORT_NAMES[new Date().getMonth()];
}

export interface BookingCodeItem {
  code?: string | null;
  slotDate?: string | null;
  eventDate?: string | null;
}

/**
 * Parses numeric sequence from existing booking codes.
 * Supports:
 * - RSE/NOV/029 -> { month: "NOV", seq: 29 }
 * - RSE/DEC/001 -> { month: "DEC", seq: 1 }
 * - RSE-005     -> { month: null, seq: 5 }
 */
export function parseBookingCode(codeStr?: string | null): {
  month: string | null;
  seq: number | null;
} {
  if (!codeStr) return { month: null, seq: null };
  const trimmed = codeStr.trim().toUpperCase();

  // Pattern: RSE/NOV/029 or RSE-NOV-029
  const monthMatch = trimmed.match(/^RSE[/-]([A-Z]{3})[/-](\d+)$/);
  if (monthMatch) {
    return {
      month: monthMatch[1],
      seq: parseInt(monthMatch[2], 10),
    };
  }

  // Legacy pattern: RSE-005 or RSE/005
  const legacyMatch = trimmed.match(/^RSE[/-](\d+)$/);
  if (legacyMatch) {
    return {
      month: null,
      seq: parseInt(legacyMatch[1], 10),
    };
  }

  // Generic trailing digits fallback
  const trailingDigits = trimmed.match(/(\d+)$/);
  if (trailingDigits) {
    return {
      month: null,
      seq: parseInt(trailingDigits[1], 10),
    };
  }

  return { month: null, seq: null };
}

/**
 * Generates a unique, non-colliding booking code for the given slot date.
 * Guaranteed format: RSE/<MONTH_SHORT>/<3_DIGIT_SEQ_NUMBER>
 * e.g. RSE/NOV/006, RSE/NOV/029, RSE/DEC/001
 */
export function generateBookingCode(
  slotDate: string | undefined | null,
  existingBookings: BookingCodeItem[] = []
): string {
  const targetMonth = getSlotMonthAbbr(slotDate);

  // Extract all existing sequence numbers relevant to this month
  const numbersInMonth: number[] = [];
  const allExistingCodes = new Set<string>();

  for (const b of existingBookings) {
    if (!b?.code) continue;
    const cleanCode = b.code.trim().toUpperCase();
    allExistingCodes.add(cleanCode);

    const parsed = parseBookingCode(cleanCode);
    if (parsed.seq !== null) {
      if (parsed.month === targetMonth) {
        // Direct month match (e.g. RSE/NOV/005)
        numbersInMonth.push(parsed.seq);
      } else if (!parsed.month) {
        // Legacy code like RSE-005: check if booking's slotDate belongs to targetMonth
        const bMonth = getSlotMonthAbbr(b.slotDate || b.eventDate);
        if (bMonth === targetMonth) {
          numbersInMonth.push(parsed.seq);
        }
      }
    }
  }

  // Find highest number in this month
  const maxNumber = numbersInMonth.length > 0 ? Math.max(...numbersInMonth) : 0;
  let nextSeq = maxNumber + 1;

  // Build candidate and ensure strict uniqueness across ALL existing codes
  let candidate = `RSE/${targetMonth}/${String(nextSeq).padStart(3, "0")}`;
  while (allExistingCodes.has(candidate)) {
    nextSeq++;
    candidate = `RSE/${targetMonth}/${String(nextSeq).padStart(3, "0")}`;
  }

  return candidate;
}
