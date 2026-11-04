/**
 * Phone number normalization and WhatsApp URL generation utilities.
 * Handles automatic country code detection and formatting based on location.
 */

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
  digits: number;
}

export const COUNTRIES: Record<string, CountryInfo> = {
  india: {
    code: "91",
    name: "India",
    flag: "🇮🇳",
    placeholder: "+91 98250 11999",
    digits: 10,
  },
  "united states": {
    code: "1",
    name: "United States",
    flag: "🇺🇸",
    placeholder: "+1 (555) 019-9283",
    digits: 10,
  },
  canada: {
    code: "1",
    name: "Canada",
    flag: "🇨🇦",
    placeholder: "+1 (416) 555-0199",
    digits: 10,
  },
  "united kingdom": {
    code: "44",
    name: "United Kingdom",
    flag: "🇬🇧",
    placeholder: "+44 7700 900123",
    digits: 10,
  },
  australia: {
    code: "61",
    name: "Australia",
    flag: "🇦🇺",
    placeholder: "+61 412 345 678",
    digits: 9,
  },
  "united arab emirates": {
    code: "971",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    placeholder: "+971 50 123 4567",
    digits: 9,
  },
  germany: {
    code: "49",
    name: "Germany",
    flag: "🇩🇪",
    placeholder: "+49 151 23456789",
    digits: 10,
  },
  france: {
    code: "33",
    name: "France",
    flag: "🇫🇷",
    placeholder: "+33 6 12 34 56 78",
    digits: 9,
  },
  "new zealand": {
    code: "64",
    name: "New Zealand",
    flag: "🇳🇿",
    placeholder: "+64 21 123 4567",
    digits: 9,
  },
  singapore: {
    code: "65",
    name: "Singapore",
    flag: "🇸🇬",
    placeholder: "+65 9123 4567",
    digits: 8,
  },
};

/**
 * Detect country dial code from country, region, and city strings.
 */
export function detectDialCode(
  country?: string,
  region?: string,
  city?: string
): { dialCode: string; countryName: string; flag: string } {
  const norm = (str?: string) => (str || "").toLowerCase().trim();
  const c = norm(country);
  const ct = norm(city);

  // 1. Direct exact or partial match on country
  for (const [key, info] of Object.entries(COUNTRIES)) {
    if (c === key || c.includes(key)) {
      return { dialCode: info.code, countryName: info.name, flag: info.flag };
    }
  }

  // Common aliases
  if (c.includes("usa") || c.includes("america") || c === "us") {
    return { dialCode: "1", countryName: "United States", flag: "🇺🇸" };
  }
  if (c.includes("uk") || c.includes("britain") || c.includes("england")) {
    return { dialCode: "44", countryName: "United Kingdom", flag: "🇬🇧" };
  }
  if (c.includes("uae") || c.includes("dubai") || c.includes("emirates")) {
    return { dialCode: "971", countryName: "United Arab Emirates", flag: "🇦🇪" };
  }

  // 2. Check city string for country/city hints
  for (const [key, info] of Object.entries(COUNTRIES)) {
    if (ct.includes(key)) {
      return { dialCode: info.code, countryName: info.name, flag: info.flag };
    }
  }

  // Popular Indian cities
  const indianCities = [
    "ahmedabad",
    "gandhinagar",
    "surat",
    "vadodara",
    "rajkot",
    "bhavnagar",
    "jamnagar",
    "junagadh",
    "gujarat",
    "mumbai",
    "pune",
    "delhi",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "chennai",
    "kolkata",
    "jaipur",
    "udaipur",
    "indore",
    "chandigarh",
    "goa",
    "kochi",
  ];
  if (indianCities.some((ic) => ct.includes(ic) || c.includes(ic))) {
    return { dialCode: "91", countryName: "India", flag: "🇮🇳" };
  }

  // Popular Foreign cities
  if (
    ct.includes("sydney") ||
    ct.includes("melbourne") ||
    ct.includes("brisbane") ||
    ct.includes("perth")
  ) {
    return { dialCode: "61", countryName: "Australia", flag: "🇦🇺" };
  }
  if (
    ct.includes("london") ||
    ct.includes("manchester") ||
    ct.includes("birmingham")
  ) {
    return { dialCode: "44", countryName: "United Kingdom", flag: "🇬🇧" };
  }
  if (
    ct.includes("new york") ||
    ct.includes("los angeles") ||
    ct.includes("chicago") ||
    ct.includes("san francisco") ||
    ct.includes("texas") ||
    ct.includes("california")
  ) {
    return { dialCode: "1", countryName: "United States", flag: "🇺🇸" };
  }
  if (
    ct.includes("toronto") ||
    ct.includes("vancouver") ||
    ct.includes("montreal")
  ) {
    return { dialCode: "1", countryName: "Canada", flag: "🇨🇦" };
  }

  // 3. Region fallback
  if (region === "foreign") {
    return { dialCode: "1", countryName: "International", flag: "🌐" };
  }

  // Default to India (Studio HQ is Gandhinagar / Ahmedabad)
  return { dialCode: "91", countryName: "India", flag: "🇮🇳" };
}

/**
 * Normalizes phone number into clean WhatsApp digits with guaranteed country code.
 * E.g. "953732317" with country India -> "91953732317"
 * E.g. "98250 11999" with country India -> "919825011999"
 * E.g. "+91 98250 11999" -> "919825011999"
 * E.g. "0412 345 678" with country Australia -> "61412345678"
 * E.g. "૮૮૬૬૩૨૩૫૬૭" (Gujarati numerals) -> "918866323567"
 */
export function convertIndicDigitsToAscii(str: string): string {
  const indicDigits: Record<string, string> = {
    "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
    "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
    "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  };
  return str.replace(/[૦-૯०-९]/g, (ch) => indicDigits[ch] || ch);
}

export function normalizeWhatsAppDigits(
  rawPhone?: string | null,
  country?: string,
  region?: string,
  city?: string
): string {
  if (!rawPhone) return "";
  const converted = convertIndicDigitsToAscii(String(rawPhone));
  const trimmed = converted.trim();
  if (!trimmed) return "";

  // If user explicitly provided a '+' prefix, they specified their own country code
  if (trimmed.startsWith("+")) {
    return trimmed.replace(/\D/g, "");
  }

  // If user typed 00 international prefix
  if (trimmed.startsWith("00")) {
    return trimmed.replace(/\D/g, "").replace(/^00/, "");
  }

  const { dialCode } = detectDialCode(country, region, city);
  let clean = trimmed.replace(/\D/g, "");
  if (!clean) return "";

  // Strip leading zero commonly used in domestic dialing
  if (clean.startsWith("0")) {
    clean = clean.replace(/^0+/, "");
  }

  // Country specific normalization
  if (dialCode === "91") {
    // In India, mobile numbers without country code are 10 digits (can start with 6-9, or 91xx)
    // If clean has 12 digits and starts with 91, country code is already included
    if (clean.length === 12 && clean.startsWith("91")) {
      return clean;
    }
    // Any 10-digit number or shorter (e.g. 953732317 or 9825011999), prepend 91
    return `91${clean}`;
  }

  if (dialCode === "1") {
    // US/Canada: 10 digits without code, 11 digits with 1
    if (clean.length === 11 && clean.startsWith("1")) {
      return clean;
    }
    return `1${clean}`;
  }

  if (dialCode === "61") {
    // Australia: 9 digits without leading 0, or 11 digits starting with 61
    if (clean.startsWith("61") && clean.length >= 10) {
      return clean;
    }
    return `61${clean}`;
  }

  if (dialCode === "44") {
    // UK: 10 digits without leading 0, or 12 digits starting with 44
    if (clean.startsWith("44") && clean.length >= 11) {
      return clean;
    }
    return `44${clean}`;
  }

  if (dialCode === "971") {
    // UAE: 9 digits without leading 0
    if (clean.startsWith("971")) {
      return clean;
    }
    return `971${clean}`;
  }

  // Generic country fallback
  if (clean.startsWith(dialCode)) {
    return clean;
  }
  return `${dialCode}${clean}`;
}

/**
 * Formats a phone number for clean human-readable display.
 * E.g. "919537323170" -> "+91 95373 23170"
 * E.g. "91953732317" -> "+91 953732317"
 */
export function formatPhoneDisplay(
  rawPhone?: string | null,
  country?: string,
  region?: string,
  city?: string
): string {
  const digits = normalizeWhatsAppDigits(rawPhone, country, region, city);
  if (!digits) return rawPhone || "";

  // India
  if (digits.startsWith("91")) {
    const num = digits.slice(2);
    if (num.length === 10) {
      return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
    }
    return `+91 ${num}`;
  }

  // USA / Canada
  if (digits.startsWith("1") && digits.length === 11) {
    const area = digits.slice(1, 4);
    const mid = digits.slice(4, 7);
    const last = digits.slice(7);
    return `+1 (${area}) ${mid}-${last}`;
  }

  // Australia
  if (digits.startsWith("61")) {
    const num = digits.slice(2);
    if (num.length === 9) {
      return `+61 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return `+61 ${num}`;
  }

  // UK
  if (digits.startsWith("44")) {
    const num = digits.slice(2);
    if (num.length === 10) {
      return `+44 ${num.slice(0, 4)} ${num.slice(4)}`;
    }
    return `+44 ${num}`;
  }

  // UAE
  if (digits.startsWith("971")) {
    const num = digits.slice(3);
    return `+971 ${num}`;
  }

  return `+${digits}`;
}

/**
 * Builds direct WhatsApp click-to-chat URL with prefilled greeting message.
 */
export function createWhatsAppChatUrl(
  phone: string | null | undefined,
  options: {
    country?: string;
    region?: string;
    city?: string;
    message?: string;
  } = {}
): { cleanDigits: string; formattedDisplay: string; url: string } {
  const cleanDigits = normalizeWhatsAppDigits(
    phone,
    options.country,
    options.region,
    options.city
  );
  const formattedDisplay = formatPhoneDisplay(
    phone,
    options.country,
    options.region,
    options.city
  );

  if (!cleanDigits) {
    return { cleanDigits: "", formattedDisplay: "", url: "" };
  }

  const query = options.message
    ? `?text=${encodeURIComponent(options.message)}`
    : "";

  return {
    cleanDigits,
    formattedDisplay,
    url: `https://wa.me/${cleanDigits}${query}`,
  };
}
