// ─── RSE Post Production House: Services & Rules Master Data ─────────

export type PricingType = "per_minute" | "per_hour" | "fixed" | "custom";

export interface ServiceDefinition {
  id: string;
  name: string;
  region: "foreign" | "indian";
  editorDays: number;       // Production capacity days blocked (per editor)
  clientDays: number;       // Standard promised delivery turnaround to client
  description: string;
  category: "wedding" | "corporate" | "reel" | "demo" | "other";
  basePriceINR?: number;    // Customizable in Admin panel
  isFreeDemo?: boolean;
  pricingType?: PricingType;
  ratePerMinute?: number;
  ratePerHour?: number;
  minDurationMinutes?: number;
  pricingNote?: string;
  isCustomQuote?: boolean;
}

// 🌍 1. Foreign Client Services
export const FOREIGN_SERVICES: ServiceDefinition[] = [
  {
    id: "f_demo_5m",
    name: "Free 5-Minute Demo (Trial)",
    region: "foreign",
    editorDays: 2,
    clientDays: 12, // 10 to 15 days window
    description: "Complimentary 5-min sample highlight edit to experience RSE's world-class cinematic quality.",
    category: "demo",
    basePriceINR: 0,
    isFreeDemo: true,
  },
  {
    id: "f_event_highlight",
    name: "Event - Highlight (Corporate)",
    region: "foreign",
    editorDays: 2,
    clientDays: 4,
    description: "Corporate event highlight reel with clean color grade, sound design, and narrative flow.",
    category: "corporate",
    basePriceINR: 25000,
  },
  {
    id: "f_event_reel",
    name: "Event Reel (Corporate)",
    region: "foreign",
    editorDays: 1,
    clientDays: 2,
    description: "Fast-paced vertical 9:16 social reel optimized for high engagement.",
    category: "reel",
    basePriceINR: 12000,
  },
  {
    id: "f_wedding_highlight",
    name: "Wedding Highlight (3 to 5 min)",
    region: "foreign",
    editorDays: 3,
    clientDays: 5,
    description: "Cinematic wedding highlight film cut to premium music with vows integration and warm LUT tone.",
    category: "wedding",
    basePriceINR: 45000,
  },
  {
    id: "f_wedding_doc_highlight",
    name: "Wedding Documentary Style Highlight (5 to 7 min)",
    region: "foreign",
    editorDays: 4,
    clientDays: 6,
    description: "Story-driven documentary highlight combining speeches, rituals, and emotional pacing.",
    category: "wedding",
    basePriceINR: 60000,
  },
  {
    id: "f_wedding_doc_film",
    name: "Wedding Documentary Film (30 to 40 min)",
    region: "foreign",
    editorDays: 8, // 7 to 10 days
    clientDays: 11, // 10 to 12 days
    description: "Extended documentary featuring complete speeches, multicam ceremony, and party montage.",
    category: "wedding",
    basePriceINR: 110000,
  },
  {
    id: "f_wedding_full_film",
    name: "Wedding Full Film (1 hr to 3 hr)",
    region: "foreign",
    editorDays: 11, // 10 to 12 days
    clientDays: 14, // 12 to 15 days
    description: "Full cinematic feature film with complete Multicam sync, audio mastering, and chapters.",
    category: "wedding",
    basePriceINR: 175000,
  },
];

// 🇮🇳 2. Indian Client Services (Official RSE Master Pricing)
export const INDIAN_SERVICES: ServiceDefinition[] = [
  {
    id: "in_wedding_highlight",
    name: "Wedding Highlight (૩ થી ૫ મિનિટ)",
    region: "indian",
    editorDays: 2,
    clientDays: 4,
    description: "સિનેમેટિક વેડિંગ હાઇલાઇટ ફિલ્મ - ₹૧,૨૫૧ પ્રતિ મિનિટ (સેકન્ડ દીઠ ₹૨૦.૮૫) પ્રો-રેટા હિસાબ.",
    category: "wedding",
    pricingType: "per_minute",
    ratePerMinute: 1251,
    basePriceINR: 5004, // 4 min standard reference
    pricingNote: "₹૧,૨૫૧ / મિનિટ (Pro-Rata)",
  },
  {
    id: "in_wedding_short_film",
    name: "Wedding Short Film (૩૦ થી ૪૦ મિનિટ)",
    region: "indian",
    editorDays: 4,
    clientDays: 6,
    description: "સંપૂર્ણ ૩૦ થી ૪૦ મિનિટની સ્ટોરી-ડ્રિવન વેડિંગ શોર્ટ ફિલ્મ વિથ સાઉન્ડ માસ્ટરિંગ.",
    category: "wedding",
    pricingType: "fixed",
    basePriceINR: 16500,
    pricingNote: "ફિક્સ રેટ: ₹૧૬,૫૦૦",
  },
  {
    id: "in_trad_single_cam",
    name: "Traditional Wedding Film (Single-Cam)",
    region: "indian",
    editorDays: 3,
    clientDays: 4,
    description: "સિંગલ કેમેરા ટ્રેડિશનલ એડિટ - ₹૧,૫૫૦ પ્રતિ કલાક (૦ થી ૬૦ મિનિટ ન્યૂનતમ ૧ કલાક સ્લેબ).",
    category: "wedding",
    pricingType: "per_hour",
    ratePerHour: 1550,
    minDurationMinutes: 60,
    basePriceINR: 1550,
    pricingNote: "₹૧,૫૫૦ / કલાક (Min 1 hr)",
  },
  {
    id: "in_trad_multi_cam",
    name: "Traditional Wedding Film (Multi-Cam)",
    region: "indian",
    editorDays: 3,
    clientDays: 5,
    description: "મલ્ટી કેમેરા ટ્રેડિશનલ એડિટ - ₹૧,૮૫૦ પ્રતિ કલાક (૦ થી ૬૦ મિનિટ ન્યૂનતમ ૧ કલાક સ્લેબ).",
    category: "wedding",
    pricingType: "per_hour",
    ratePerHour: 1850,
    minDurationMinutes: 60,
    basePriceINR: 1850,
    pricingNote: "₹૧,૮૫૦ / કલાક (Min 1 hr)",
  },
  {
    id: "in_wedding_reel",
    name: "Wedding Vertical Reel (ઊભી રીલ 9:16)",
    region: "indian",
    editorDays: 0.5,
    clientDays: 1,
    description: "ટ્રેન્ડિંગ મ્યુઝિક સાથેની વર્ટિકલ 9:16 સોશિયલ મીડિયા રીલ.",
    category: "reel",
    pricingType: "fixed",
    basePriceINR: 951,
    pricingNote: "₹૯૫૧ / રીલ",
  },
  {
    id: "in_wedding_insta_cut",
    name: "Wedding Insta Cut (9:16)",
    region: "indian",
    editorDays: 0.5,
    clientDays: 1,
    description: "ઇન્સ્ટાગ્રામ સ્પેશિયલ સિનેમેટિક કટ વિડીયો.",
    category: "reel",
    pricingType: "fixed",
    basePriceINR: 1851,
    pricingNote: "₹૧,૮૫૧ / કટ",
  },
  {
    id: "in_wedding_teaser",
    name: "Wedding Teaser / Trailer (૬૦ થી ૯૦ સેકન્ડ)",
    region: "indian",
    editorDays: 1,
    clientDays: 2,
    description: "પંચી ૬૦-૯૦ સેકન્ડ સિનેમેટિક ટીઝર અને ટ્રેલર.",
    category: "wedding",
    pricingType: "fixed",
    basePriceINR: 3500,
    pricingNote: "₹૩,૫૦૦ થી ₹૫,૦૦૦",
  },
  {
    id: "in_education_reel_other",
    name: "Education - Video / Reel / Other",
    region: "indian",
    editorDays: 2,
    clientDays: 3,
    description: "એડ્યુકેશન વિડીયો અને અન્ય કસ્ટમ વર્ક - ક્લાયન્ટ અને કામ મુજબ નક્કી થશે.",
    category: "other",
    pricingType: "custom",
    isCustomQuote: true,
    basePriceINR: 0,
    pricingNote: "ચર્ચા મુજબ / Custom Quote",
  },
  {
    id: "in_corp_event_highlight",
    name: "Corporate Event - Highlight",
    region: "indian",
    editorDays: 1.5,
    clientDays: 2,
    description: "કોર્પોરેટ ઇવેન્ટ વિડીયો - ક્લાયન્ટ પ્રોજેક્ટ મુજબ નક્કી થશે.",
    category: "corporate",
    pricingType: "custom",
    isCustomQuote: true,
    basePriceINR: 0,
    pricingNote: "ચર્ચા મુજબ / Custom Quote",
  },
  {
    id: "in_corp_reel",
    name: "Corporate - Reel / Promo",
    region: "indian",
    editorDays: 1,
    clientDays: 1,
    description: "કોર્પોરેટ સોશિયલ રીલ અને પ્રમોશનલ વિડીયો.",
    category: "reel",
    pricingType: "custom",
    isCustomQuote: true,
    basePriceINR: 0,
    pricingNote: "ચર્ચા મુજબ / Custom Quote",
  },
];

export const ALL_SERVICES = [...FOREIGN_SERVICES, ...INDIAN_SERVICES];

// ─── Studio Capacity & Operational Constants ────────────────────────
export const STUDIO_CONFIG = {
  DAILY_MAX_SLOTS: 3,           // 3 active concurrent edits per day
  MIN_LEAD_DAYS: 3,             // Clients cannot book today or next 3 days
  ONLINE_INGEST_BUFFER_DAYS: 1.5,// 1.5 days added to delivery if online transfer
  COURIER_BUFFER_DAYS: 2,       // 2 days courier buffer
  DELIVERY_BUFFER_DAYS: 1,      // 1 day delivery QA buffer
  FRAME_IO_EXPIRY_DAYS: 7,      // 7-day Frame.io review timer
  REVISION_DEADLINE_DAYS: 7,    // Client has 7 days to review on Frame.io
  SATURDAY_IS_CORRECTION_DAY: true,
  PAYMENT_ADVANCE_PERCENT: 50,  // 50% on booking
  PAYMENT_FINAL_PERCENT: 50,    // 50% on final delivery
};

// ─── Studio Public Holidays (2026/2027) ─────────────────────────────
export interface StudioHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export const DEFAULT_HOLIDAYS: StudioHoliday[] = [
  { date: "2026-01-14", name: "Makar Sankranti / Uttarayan" },
  { date: "2026-01-15", name: "Vasi Uttarayan" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-04", name: "Holi / Dhuleti" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-08-28", name: "Raksha Bandhan" },
  { date: "2026-09-04", name: "Janmashtami" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-20", name: "Dussehra" },
  { date: "2026-11-08", name: "Diwali" },
  { date: "2026-11-09", name: "New Year (Bestu Varas)" },
  { date: "2026-11-10", name: "Bhai Dooj" },
  { date: "2026-12-25", name: "Christmas" },
];
