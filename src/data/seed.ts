import { StaffMember, Booking, AttendanceRecord, Client, LeaveRequest } from "@/types";
import { FULL_ADMIN_PERMISSIONS, EDITOR_DEFAULT_PERMISSIONS } from "@/lib/permissions";

// ─── Official Studio Staff ───────────────────────────────────────

export const STAFF: StaffMember[] = [
  {
    id: "s1",
    name: "Keyur Rao",
    email: "Keyur@rse-edit.com",
    password: "keyur@123",
    role: "admin",
    baseSalary: 0,
    isActive: true,
    isSuperAdmin: true,
    permissions: { ...FULL_ADMIN_PERMISSIONS },
  },
  {
    id: "s2",
    name: "Nirali Dhorajiya",
    email: "nirali@rse-edit.com",
    password: "nirali@123",
    role: "admin",
    baseSalary: 0,
    isActive: true,
    permissions: { ...FULL_ADMIN_PERMISSIONS },
  },
  {
    id: "s3",
    name: "Jaydeep Tank",
    email: "jaydeep@rse-edit.com",
    password: "jaydeep@123",
    role: "editor",
    baseSalary: 0,
    isActive: true,
    permissions: { ...EDITOR_DEFAULT_PERMISSIONS },
  },
];

// ─── Clients Directory (Fresh for Original Clients) ──────────────

export const SEED_CLIENTS: Client[] = [];

// ─── Slot Bookings Pipeline (Fresh for Original Bookings) ────────

export const SEED_BOOKINGS: Booking[] = [];

// ─── Daily Attendance ────────────────────────────────────────────

export const SEED_ATTENDANCE: AttendanceRecord[] = [];

// ─── Leave Requests ──────────────────────────────────────────────

export const SEED_LEAVES: LeaveRequest[] = [];
