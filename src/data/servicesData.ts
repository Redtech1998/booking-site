// ─── RSE Post Production House: Services & Rules Master Data ─────────

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

// 🇮🇳 2. Indian Client Services
export const INDIAN_SERVICES: ServiceDefinition[] = [
  {
    id: "in_wedding_highlight",
    name: "Wedding Highlight",
    region: "indian",
    editorDays: 2,
    clientDays: 4,
    description: "Classic Indian wedding cinematic highlight with beat sync, emotional audio, and teaser feel.",
    category: "wedding",
    basePriceINR: 20000,
  },
  {
    id: "in_wedding_short_film",
    name: "Wedding Short Film",
    region: "indian",
    editorDays: 4,
    clientDays: 6,
    description: "10-15 minute short film covering all primary wedding rituals with custom sound mastering.",
    category: "wedding",
    basePriceINR: 38000,
  },
  {
    id: "in_trad_single_cam",
    name: "Traditional Wedding Film (Single-Cam)",
    region: "indian",
    editorDays: 3,
    clientDays: 4,
    description: "Complete chronological traditional edit for single-camera capture.",
    category: "wedding",
    basePriceINR: 22000,
  },
  {
    id: "in_trad_multi_cam",
    name: "Traditional Wedding Film (Multi-Cam)",
    region: "indian",
    editorDays: 3,
    clientDays: 5,
    description: "Multicam synchronized traditional wedding film with seamless angle switching.",
    category: "wedding",
    basePriceINR: 32000,
  },
  {
    id: "in_wedding_insta_reel",
    name: "Wedding / Reel Insta Cut",
    region: "indian",
    editorDays: 0.5,
    clientDays: 1,
    description: "Quick turnaround vertical 9:16 reel with trending beat-sync cuts.",
    category: "reel",
    basePriceINR: 5000,
  },
  {
    id: "in_wedding_teaser",
    name: "Wedding Teaser / Trailer",
    region: "indian",
    editorDays: 1,
    clientDays: 2,
    description: "Punchy 60-90 second cinematic trailer designed for WhatsApp and social announcement.",
    category: "wedding",
    basePriceINR: 12000,
  },
  {
    id: "in_education_reel_other",
    name: "Education - Video / Reel / Highlight / Other",
    region: "indian",
    editorDays: 2,
    clientDays: 3,
    description: "E-learning, workshop recap, podcast, or customized commercial edit.",
    category: "other",
    basePriceINR: 18000,
  },
  {
    id: "in_corp_event_highlight",
    name: "Corporate Event - Highlight",
    region: "indian",
    editorDays: 1.5,
    clientDays: 2,
    description: "Polished corporate brand event summary with speaker soundbites and motion titles.",
    category: "corporate",
    basePriceINR: 16000,
  },
  {
    id: "in_corp_reel",
    name: "Corporate - Reel / Insta Cut",
    region: "indian",
    editorDays: 1,
    clientDays: 1,
    description: "High-impact social reel for corporate brand campaigns.",
    category: "reel",
    basePriceINR: 8000,
  },
];

export const ALL_SERVICES = [...FOREIGN_SERVICES, ...INDIAN_SERVICES];

// ─── Studio Capacity & Operational Constants ────────────────────────
export const STUDIO_CONFIG = {
  DAILY_MAX_SLOTS: 3,           // 3 active concurrent edits per day
  MIN_LEAD_DAYS: 3,             // Clients cannot book today or next 3 days
  ONLINE_INGEST_BUFFER_DAYS: 1.5,// 1.5 days added to delivery if online transfer
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
