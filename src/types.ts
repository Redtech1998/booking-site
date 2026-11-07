// ─── Users & Auth ──────────────────────────────────────────────

export type Role = "admin" | "editor" | "accountant" | "outreach" | "social";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  password: string;    // Email & Password login
  role: Role;
  baseSalary: number;  // Monthly base salary
  phone?: string;
  avatar?: string;
  isActive: boolean;
  joinedDate?: string;
}

// ─── Leave Requests (રજા અરજી) ───────────────────────────────────

export type LeaveType = "casual" | "sick" | "emergency" | "planned";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  totalDays: number;
  reason: string;
  type: LeaveType;
  status: LeaveStatus;
  adminComment?: string;
  createdAt: string;   // ISO
  reviewedAt?: string; // ISO
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
  | "in_client_review"    // Client Review / Awaiting Feedback
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

export type SsdStatus = "not_sent" | "in_transit" | "received" | "dispatched_back";

export interface Booking {
  id: string;
  code: string;                  // RSE/NOV/029, RSE/DEC/001 …
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

  // SSD & Courier Physical Tracking
  ssdCourierCompany?: string;    // e.g. "Tirupati", "DTDC", "Maruti", "By Hand"
  ssdTrackingNumber?: string;    // Tracking / Docket No
  ssdStatus?: SsdStatus;         // not_sent | in_transit | received | dispatched_back
  ssdDispatchedDocket?: string;  // Return courier docket no

  // Legal & Terms
  ndaAccepted?: boolean;
  ndaAcceptedAt?: string;

  // Festive Campaigns & Offers (e.g. લાભ પાંચમ મુહૂર્ત)
  offerType?: "labh_pancham_2026" | "regular";
  discountPercent?: number;       // e.g. 15
  paymentScreenshotSent?: boolean; // Payment screenshot via WhatsApp

  // Financials (50% / 50% Terms or Token Advance)
  pricing: BookingPricing;

  // Pipeline Status & Execution
  status: BookingStatus;
  assignedTo?: string;           // StaffMember.id (Editor)

  // Frame.io & Revisions
  frameIoLink?: string;
  previewSentAt?: string;
  correctionDueAt?: string;      // 7-day countdown deadline
  revisionRound?: number;        // 0 = v1 Initial, 1 = Rev 1, 2 = Rev 2 ...
  revisionNotes?: string;        // Summary of feedback/changes

  // Delay & Reschedule Tracking
  delayDays?: number;            // Extra delay days cascaded from OS
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
  device?: "mac" | "iphone" | "workstation";
}

// ─── Permanent Invoices Archive (વર્ષો સુધી સુરક્ષિત બિલ હિસાબ) ──────

export interface InvoiceItem {
  id: string;
  description: string;
  duration?: string;     // e.g. "05:40" or "1:25"
  unitPrice: number;     // e.g. 1251 or 1550
  quantity: number;      // e.g. 5.67 minutes or 1.42 hours or 1 item
  rateType?: "per_min" | "per_hour" | "fixed";
  amount: number;        // Total line item amount
}

export type InvoiceStatus = "unpaid" | "partially_paid" | "paid" | "cancelled";

export interface Invoice {
  id: string;
  invoiceNumber: string;        // e.g. "RSE/INV/2026/001"
  bookingId?: string;           // Linked Booking ID
  bookingCode?: string;         // e.g. "RSE/NOV/008"
  clientName: string;           // Couple Name or Photographer
  studioName?: string;          // Studio / Production House Name
  phone: string;                // WhatsApp Number
  email?: string;
  city?: string;
  country?: string;
  issueDate: string;            // YYYY-MM-DD
  dueDate?: string;             // YYYY-MM-DD
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount?: number;           // If GST applicable
  totalAmount: number;
  advancePaid: number;          // 50% Advance amount
  balanceDue: number;           // Remaining 50%
  status: InvoiceStatus;
  currency: "INR" | "USD" | "GBP" | "EUR";
  notes?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    upiId: string;
  };
  createdAt: string;            // ISO
  updatedAt?: string;
}

