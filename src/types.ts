// ─── Users & Auth ──────────────────────────────────────────────

export type Role = "admin" | "editor" | "accountant" | "outreach" | "social";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;    // Email & Password login
  role: Role;
  baseSalary: number;  // Monthly base salary
  avatar?: string;
  isActive: boolean;
}

// ─── Clients Directory (Auto-synced into RSE | OS) ─────────────

export interface Client {
  id: string;
  studioName: string;
  contactPerson: string;
  phone: string;          // WhatsApp Number with country code
  email: string;
  region: "indian" | "foreign";
  customerType: "new" | "existing";
  country?: string;
  city?: string;
  whatsappGroupUrl?: string; // Dedicated WhatsApp Group Link
  preferredLutStyle?: string;
  notes?: string;
  totalBookings: number;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  createdAt: string;
  lastActive: string;
}

// ─── Slot Booking Pipeline (Tailored to RSE 8-step Workflow) ───

export type BookingSource = "website" | "manual";
export type RegionType = "indian" | "foreign";
export type DeliveryMethod = "courier" | "online";

export type BookingStatus =
  | "new_deposit_pending" // 1. New / 50% Advance Pending
  | "awaiting_footage"    // 2. Waiting for HDD Courier or Drive Link
  | "in_selection_cut"    // 3. Premiere Pro Culling & Rough Cut
  | "in_edit_polish"      // 4. Color Grading, Sound & Main Edit
  | "preview_sent"        // 5. 70-80% Preview on Frame.io (7-day timer starts)
  | "in_revision"         // 6. Saturday / In-progress Client Corrections
  | "ready_for_final"     // 7. Balance 50% Due before final release
  | "delivered_done";     // 8. Final Delivery Done & Archived

export interface BookingPricing {
  totalAmount: number;
  advanceAmount: number;
  finalAmount: number;
  advancePaid: boolean;
  finalPaid: boolean;
  currency: "INR" | "USD" | "GBP" | "EUR";
}

export interface ReminderLog {
  timestamp: string;
  channel: "whatsapp" | "email";
  message: string;
}

export interface Booking {
  id: string;
  code: string;                  // RSE-001, RSE-002 …
  source: BookingSource;
  region: RegionType;
  customerType: "new" | "existing";
  clientId?: string;             // Links to Client profile in directory
  coupleNames: string;
  studioOrClient: string;
  contactPerson?: string;
  phone: string;                 // WhatsApp phone
  email: string;
  country?: string;
  city?: string;
  whatsappGroupUrl?: string;

  // Key Dates
  eventDate: string;             // YYYY-MM-DD (Wedding Day)
  slotDate: string;              // YYYY-MM-DD (Production start)
  originalSlotDate?: string;     // If rescheduled due to data delay
  deliveryDate: string;          // YYYY-MM-DD (Calculated with buffers)

  // Service & Deliverable (Supports multiple deliverables)
  serviceId: string;
  packageType: string;
  serviceIds?: string[];
  packagesList?: string[];
  editorDays: number;
  clientDays: number;

  // Data Delivery Info
  deliveryMethod: DeliveryMethod;
  courierName?: string;
  docketNumber?: string;
  dispatchDate?: string;
  onlineDriveLink?: string;
  rseDriveRequested?: boolean;   // If client requests RSE studio drive link
  rawLink: string;               // Unified link
  footageSizeGB?: number;
  cameraProfile?: string;        // e.g. "Sony FX3 S-Log3", "Canon C-Log"
  songPreference?: string;
  notes: string;

  // Legal & Terms
  ndaAccepted?: boolean;
  ndaAcceptedAt?: string;

  // Financials (50% / 50% Terms)
  pricing: BookingPricing;

  // Pipeline Status & Execution
  status: BookingStatus;
  assignedTo?: string;           // StaffMember.id (Editor)

  // Frame.io & Revisions
  frameIoLink?: string;
  previewSentAt?: string;
  correctionDueAt?: string;      // 7-day countdown deadline

  // Delay & Reschedule Tracking
  rescheduledReason?: string;
  reminderHistory?: ReminderLog[];

  createdAt: string;
}

// ─── Attendance ─────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;       // YYYY-MM-DD
  punchIn: string;    // ISO
  punchOut?: string;  // ISO
}
