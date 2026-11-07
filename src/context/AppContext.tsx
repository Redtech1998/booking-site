"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Booking,
  Client,
  BookingStatus,
  StaffMember,
  AttendanceRecord,
  LeaveRequest,
  Invoice,
} from "@/types";
import {
  STAFF as SEED_STAFF,
  SEED_BOOKINGS,
  SEED_CLIENTS,
  SEED_ATTENDANCE,
  SEED_LEAVES,
} from "@/data/seed";
import {
  ALL_SERVICES,
  ServiceDefinition,
  STUDIO_CONFIG,
  DEFAULT_HOLIDAYS,
  StudioHoliday,
} from "@/data/servicesData";
import { generateBookingCode } from "@/lib/bookingCode";

interface AppState {
  // Auth
  currentUser: StaffMember | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Staff Management
  staff: StaffMember[];
  addStaff: (member: Omit<StaffMember, "id">) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;

  // Attendance
  attendance: AttendanceRecord[];
  punchIn: (device?: "mac" | "iphone" | "workstation") => void;
  punchOut: () => void;
  todayRecord: AttendanceRecord | undefined;

  // Leave Management (રજા અરજી)
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (
    req: Omit<LeaveRequest, "id" | "createdAt" | "status" | "staffName">
  ) => LeaveRequest;
  updateLeaveStatus: (
    id: string,
    status: "approved" | "rejected",
    adminComment?: string
  ) => void;

  // Live Website Cloud Sync
  syncLiveBookings: () => Promise<{ success: boolean; count: number; error?: string }>;
  isSyncing: boolean;
  lastSyncedAt: Date | null;

  // Bookings Pipeline
  bookings: Booking[];
  addBooking: (b: Omit<Booking, "id" | "code" | "createdAt">) => Booking;
  updateBooking: (b: Booking) => void;
  deleteBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  assignBooking: (id: string, staffId: string) => void;
  updateFrameIo: (id: string, frameIoLink: string) => void;
  rescheduleBooking: (id: string, newSlotDate: string, reason: string) => Booking;
  sendFootageReminder: (id: string, channel: "whatsapp" | "email") => string;

  // Clients Directory
  clients: Client[];
  findClientByPhone: (phone: string) => Client | undefined;
  updateClientWhatsAppGroup: (clientId: string, groupUrl: string) => void;

  // Permanent Invoices Archive (વર્ષો સુધી સુરક્ષિત બિલ હિસાબ)
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, "id" | "createdAt">) => Promise<Invoice>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Services & Capacity
  services: ServiceDefinition[];
  updateServicePrice: (serviceId: string, newPriceINR: number) => void;
  holidays: StudioHoliday[];
  addHoliday: (holiday: StudioHoliday) => void;
  removeHoliday: (date: string) => void;

  // Calculation & Slot Logic
  calculateDeliveryDate: (
    serviceId: string,
    slotDateStr: string,
    deliveryMethod: "courier" | "online",
    customDays?: number
  ) => string;
  getSlotAvailability: (dateStr: string) => {
    isAvailable: boolean;
    reason?: string;
    occupiedCount: number;
    maxSlots: number;
  };
  findNextAvailableSlot: (fromSlotDateStr: string, editorDays: number) => string;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Authentication & Staff (Default to Studio Admin Harsh Patel for instant workstation access)
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(SEED_STAFF[0]);
  const [staff, setStaff] = useState<StaffMember[]>(SEED_STAFF);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(SEED_LEAVES);

  // Bookings & Clients
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>(ALL_SERVICES);
  const [holidays, setHolidays] = useState<StudioHoliday[]>(DEFAULT_HOLIDAYS);
  const [hydrated, setHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());

  // Hydrate from localStorage once on mount, then sync with server API
  useEffect(() => {
    try {
      const u = localStorage.getItem("rse_user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed?.email?.includes("@rse-edit.com")) {
          setCurrentUser(parsed);
        } else {
          setCurrentUser(SEED_STAFF[0]);
          localStorage.setItem("rse_user", JSON.stringify(SEED_STAFF[0]));
        }
      } else {
        setCurrentUser(SEED_STAFF[0]);
      }

      const st = localStorage.getItem("rse_staff_v2");
      if (st) {
        const parsedStaff = JSON.parse(st);
        if (Array.isArray(parsedStaff) && parsedStaff.some((s: StaffMember) => s.email?.includes("@rse-edit.com"))) {
          setStaff(parsedStaff);
        } else {
          setStaff(SEED_STAFF);
          localStorage.setItem("rse_staff_v2", JSON.stringify(SEED_STAFF));
        }
      } else {
        setStaff(SEED_STAFF);
      }

      const att = localStorage.getItem("rse_attendance_v2");
      if (att) setAttendance(JSON.parse(att));

      const lv = localStorage.getItem("rse_leaves_v2");
      if (lv) setLeaveRequests(JSON.parse(lv));

      const b = localStorage.getItem("rse_bookings_v2");
      if (b) setBookings(JSON.parse(b));

      const c = localStorage.getItem("rse_clients_v2");
      if (c) setClients(JSON.parse(c));

      const inv = localStorage.getItem("rse_invoices_v2");
      if (inv) setInvoices(JSON.parse(inv));

      const s = localStorage.getItem("rse_services_v2");
      if (s) setServices(JSON.parse(s));

      const h = localStorage.getItem("rse_holidays_v2");
      if (h) setHolidays(JSON.parse(h));
    } catch (_) {}
    setHydrated(true);

    // Initial & continuous sync from local API & live website API (MongoDB Atlas synced)
    const fetchStudioData = async () => {
      // 1. Bookings Sync
      try {
        const res = await fetch("/api/bookings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.bookings)) {
            setBookings(data.bookings);
            setLastSyncedAt(new Date());
          }
        }
      } catch (_) {}

      // 2. Invoices Sync (MongoDB Atlas)
      try {
        const res = await fetch("/api/invoices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.invoices)) {
            setInvoices(data.invoices);
          }
        }
      } catch (_) {}

      // 3. Staff & Salaries Sync (MongoDB Atlas)
      try {
        const res = await fetch("/api/staff", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.staff && Array.isArray(data.staff) && data.staff.length > 0) {
            setStaff(data.staff);
          }
        }
      } catch (_) {}

      // 4. Clients Sync (MongoDB Atlas)
      try {
        const res = await fetch("/api/clients", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.clients)) {
            setClients(data.clients);
          }
        }
      } catch (_) {}
    };

    fetchStudioData();

    // Auto-poll server every 15 seconds for continuous real-time cross-device sync
    const interval = setInterval(fetchStudioData, 15000);
    const handleSync = () => fetchStudioData();
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Persist locally as fallback cache
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (currentUser) localStorage.setItem("rse_user", JSON.stringify(currentUser));
      else localStorage.removeItem("rse_user");

      localStorage.setItem("rse_staff_v2", JSON.stringify(staff));
      localStorage.setItem("rse_attendance_v2", JSON.stringify(attendance));
      localStorage.setItem("rse_leaves_v2", JSON.stringify(leaveRequests));
      localStorage.setItem("rse_bookings_v2", JSON.stringify(bookings));
      localStorage.setItem("rse_clients_v2", JSON.stringify(clients));
      localStorage.setItem("rse_invoices_v2", JSON.stringify(invoices));
      localStorage.setItem("rse_services_v2", JSON.stringify(services));
      localStorage.setItem("rse_holidays_v2", JSON.stringify(holidays));
    } catch (_) {}
  }, [currentUser, staff, attendance, leaveRequests, bookings, clients, invoices, services, holidays, hydrated]);

  // Auth Functions
  const login = useCallback(
    (email: string, pass: string): { success: boolean; error?: string } => {
      const found = staff.find(
        (s) => s.email.toLowerCase() === email.toLowerCase() && s.password === pass
      );
      if (found) {
        if (!found.isActive) {
          return { success: false, error: "Account deactivated. Contact Admin." };
        }
        setCurrentUser(found);
        return { success: true };
      }
      return { success: false, error: "Invalid email or password." };
    },
    [staff]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Staff Management
  const addStaff = useCallback((memberData: Omit<StaffMember, "id">): StaffMember => {
    const newStaff: StaffMember = {
      ...memberData,
      id: `s_${Date.now()}`,
    };
    setStaff((prev) => [...prev, newStaff]);
    return newStaff;
  }, []);

  const updateStaff = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const target = updated.find((s) => s.id === id);
      if (target && typeof window !== "undefined") {
        fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(target),
        }).catch(() => {});
      }
      return updated;
    });
    setCurrentUser((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  }, []);

  const deleteStaff = useCallback((id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Attendance
  const punchIn = useCallback(
    (device: "mac" | "iphone" | "workstation" = "workstation") => {
      if (!currentUser) return;
      const today = new Date().toISOString().split("T")[0];
      const existing = attendance.find(
        (a) => a.staffId === currentUser.id && a.date === today
      );
      if (existing) return;

      const record: AttendanceRecord = {
        id: `att_${Date.now()}`,
        staffId: currentUser.id,
        date: today,
        punchIn: new Date().toISOString(),
        device,
      };
      setAttendance((prev) => [record, ...prev]);
    },
    [currentUser, attendance]
  );

  const punchOut = useCallback(() => {
    if (!currentUser) return;
    const today = new Date().toISOString().split("T")[0];
    setAttendance((prev) =>
      prev.map((a) =>
        a.staffId === currentUser.id && a.date === today && !a.punchOut
          ? { ...a, punchOut: new Date().toISOString() }
          : a
      )
    );
  }, [currentUser]);

  const todayRecord = currentUser
    ? attendance.find(
        (a) =>
          a.staffId === currentUser.id &&
          a.date === new Date().toISOString().split("T")[0]
      )
    : undefined;

  // Leave Management
  const submitLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, "id" | "createdAt" | "status" | "staffName">): LeaveRequest => {
      const staffMember = staff.find((s) => s.id === req.staffId);
      const newLeave: LeaveRequest = {
        ...req,
        id: `lv_${Date.now()}`,
        staffName: staffMember?.name || "Staff Member",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setLeaveRequests((prev) => [newLeave, ...prev]);
      return newLeave;
    },
    [staff]
  );

  const updateLeaveStatus = useCallback(
    (id: string, status: "approved" | "rejected", adminComment?: string) => {
      setLeaveRequests((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status, adminComment, reviewedAt: new Date().toISOString() }
            : l
        )
      );
    },
    []
  );

  // Check Slot Availability (With Current Week Lock, Preview Release, and Delay Cascade)
  const getSlotAvailability = useCallback(
    (dateStr: string): { isAvailable: boolean; reason?: string; occupiedCount: number; maxSlots: number } => {
      const targetDate = new Date(`${dateStr}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 1. Current Week Lock (No same-day & No current week bookings)
      const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      const currentWeekSunday = new Date(now);
      currentWeekSunday.setDate(now.getDate() + daysUntilSunday);
      currentWeekSunday.setHours(23, 59, 59, 999);

      // Minimum notice buffer
      const minNoticeDate = new Date(now);
      minNoticeDate.setDate(now.getDate() + STUDIO_CONFIG.MIN_LEAD_DAYS);
      minNoticeDate.setHours(23, 59, 59, 999);

      const cutoffDate = new Date(
        Math.max(currentWeekSunday.getTime(), minNoticeDate.getTime())
      );

      if (targetDate <= now) {
        return {
          isAvailable: false,
          reason: "Past date (cannot select historical dates)",
          occupiedCount: STUDIO_CONFIG.DAILY_MAX_SLOTS,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      if (targetDate <= cutoffDate) {
        const isCurrentWeek = targetDate <= currentWeekSunday;
        return {
          isAvailable: false,
          reason: isCurrentWeek
            ? "Current Week Closed (Advance bookings open next week onwards)"
            : `Minimum ${STUDIO_CONFIG.MIN_LEAD_DAYS} days advance booking notice required`,
          occupiedCount: STUDIO_CONFIG.DAILY_MAX_SLOTS,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 2. Sunday check
      if (targetDate.getDay() === 0) {
        return {
          isAvailable: false,
          reason: "Sunday (Studio Closed)",
          occupiedCount: STUDIO_CONFIG.DAILY_MAX_SLOTS,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 3. Holiday check
      const holidayMatch = holidays.find((h) => h.date === dateStr);
      if (holidayMatch) {
        return {
          isAvailable: false,
          reason: `Public Holiday: ${holidayMatch.name}`,
          occupiedCount: STUDIO_CONFIG.DAILY_MAX_SLOTS,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 4. Daily Capacity check with multi-day editor blocking
      // Smart slot release: When an edit is delivered OR sent for client preview/review,
      // the editor is free! So the slot is immediately released for new bookings!
      let activeOccupied = 0;
      for (const b of bookings) {
        if (
          b.status === "delivered_done" ||
          b.status === "preview_sent" ||
          b.status === "in_client_review"
        ) {
          continue;
        }

        const bStart = new Date(`${b.slotDate}T00:00:00`);
        const durationDays = Math.max(
          1,
          Math.ceil((b.editorDays || 1) + (b.delayDays || 0))
        );
        const bEnd = new Date(bStart);
        bEnd.setDate(bStart.getDate() + durationDays - 1);

        if (targetDate >= bStart && targetDate <= bEnd) {
          activeOccupied += 1;
        }
      }

      if (activeOccupied >= STUDIO_CONFIG.DAILY_MAX_SLOTS) {
        return {
          isAvailable: false,
          reason: `Daily Capacity Full (Sold Out)`,
          occupiedCount: activeOccupied,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      return {
        isAvailable: true,
        occupiedCount: activeOccupied,
        maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
      };
    },
    [bookings, holidays]
  );

  // Calculate Delivery Date with Sundays, Holidays, and Online buffer
  const calculateDeliveryDate = useCallback(
    (
      serviceId: string,
      slotDateStr: string,
      deliveryMethod: "courier" | "online",
      customDays?: number
    ): string => {
      const svc = services.find((s) => s.id === serviceId);
      const standardDays =
        customDays !== undefined && customDays > 0
          ? customDays
          : svc
          ? svc.clientDays
          : 5;

      const cursor = new Date(`${slotDateStr}T00:00:00`);
      let countedDays = 0;

      while (countedDays < standardDays) {
        cursor.setDate(cursor.getDate() + 1);
        const ymd = cursor.toISOString().split("T")[0];
        const isSunday = cursor.getDay() === 0;
        const isHoliday = holidays.some((h) => h.date === ymd);

        if (!isSunday && !isHoliday) {
          countedDays += 1;
        }
      }

      if (deliveryMethod === "online") {
        let bufferAdded = 0;
        while (bufferAdded < 1) {
          cursor.setDate(cursor.getDate() + 1);
          const ymd = cursor.toISOString().split("T")[0];
          const isSunday = cursor.getDay() === 0;
          const isHoliday = holidays.some((h) => h.date === ymd);
          if (!isSunday && !isHoliday) {
            bufferAdded += 1;
          }
        }
      }

      return cursor.toISOString().split("T")[0];
    },
    [services, holidays]
  );

  // Find Next Available Slot
  const findNextAvailableSlot = useCallback(
    (fromSlotDateStr: string, editorDays: number): string => {
      const cursor = new Date(`${fromSlotDateStr}T00:00:00`);
      cursor.setDate(cursor.getDate() + 1);

      for (let i = 0; i < 45; i++) {
        const ymd = cursor.toISOString().split("T")[0];
        const avail = getSlotAvailability(ymd);
        if (avail.isAvailable) {
          return ymd;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      return cursor.toISOString().split("T")[0];
    },
    [getSlotAvailability]
  );

  // Lookup client by phone
  const findClientByPhone = useCallback(
    (phone: string): Client | undefined => {
      const cleanPhone = phone.replace(/\D/g, "");
      if (!cleanPhone) return undefined;
      return clients.find((c) => c.phone.replace(/\D/g, "").includes(cleanPhone));
    },
    [clients]
  );

  // Sync client profile
  const syncClientDirectory = (booking: Booking) => {
    setClients((prev) => {
      const cleanPhone = booking.phone.replace(/\D/g, "");
      const existing = prev.find((c) => c.phone.replace(/\D/g, "") === cleanPhone);

      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalBookings: c.totalBookings + 1,
                totalBilled: c.totalBilled + booking.pricing.totalAmount,
                totalPaid: c.totalPaid + (booking.pricing.advancePaid ? booking.pricing.advanceAmount : 0),
                totalPending:
                  c.totalPending +
                  (booking.pricing.totalAmount - (booking.pricing.advancePaid ? booking.pricing.advanceAmount : 0)),
                lastActive: new Date().toISOString(),
              }
            : c
        );
      }

      const newClient: Client = {
        id: `c_${Date.now()}`,
        studioName: booking.studioOrClient,
        contactPerson: booking.contactPerson || booking.studioOrClient,
        phone: booking.phone,
        email: booking.email,
        region: booking.region,
        customerType: "new",
        country: booking.country,
        city: booking.city,
        whatsappGroupUrl: booking.whatsappGroupUrl,
        totalBookings: 1,
        totalBilled: booking.pricing.totalAmount,
        totalPaid: booking.pricing.advancePaid ? booking.pricing.advanceAmount : 0,
        totalPending: booking.pricing.totalAmount - (booking.pricing.advancePaid ? booking.pricing.advanceAmount : 0),
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      return [newClient, ...prev];
    });
  };

  // Add Booking
  const addBooking = useCallback(
    (data: Omit<Booking, "id" | "code" | "createdAt">): Booking => {
      const code = generateBookingCode(data.slotDate, bookings);
      const newBooking: Booking = {
        ...data,
        id: `b_${Date.now()}`,
        code,
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      syncClientDirectory(newBooking);

      // Sync immediately to server API
      if (typeof window !== "undefined") {
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBooking),
        }).catch((e) => console.warn("Failed to sync booking to server:", e));
      }

      return newBooking;
    },
    [bookings]
  );

  // Update Booking Complete
  const updateBooking = useCallback((updatedBooking: Booking) => {
    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
      if (typeof window !== "undefined") {
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBooking),
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  // Delete Booking (Admin)
  const deleteBooking = useCallback((id: string) => {
    setBookings((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      if (typeof window !== "undefined") {
        fetch(`/api/bookings?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  // Update Booking Status
  const updateBookingStatus = useCallback(
    (id: string, status: BookingStatus) => {
      setBookings((prev) => {
        const updated = prev.map((b) => (b.id === id ? { ...b, status } : b));
        const currentTarget = updated.find((b) => b.id === id);
        if (currentTarget && typeof window !== "undefined") {
          fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentTarget),
          }).catch(() => {});
        }
        return updated;
      });
    },
    []
  );

  // Assign Booking to Editor
  const assignBooking = useCallback((id: string, staffId: string) => {
    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, assignedTo: staffId } : b));
      const currentTarget = updated.find((b) => b.id === id);
      if (currentTarget && typeof window !== "undefined") {
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentTarget),
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  // Update Frame.io link
  const updateFrameIo = useCallback((id: string, frameIoLink: string) => {
    setBookings((prev) => {
      const updated = prev.map((b) =>
        b.id === id
          ? {
              ...b,
              frameIoLink,
              status: "preview_sent" as BookingStatus,
              previewSentAt: new Date().toISOString(),
            }
          : b
      );
      const currentTarget = updated.find((b) => b.id === id);
      if (currentTarget && typeof window !== "undefined") {
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentTarget),
        }).catch(() => {});
      }
      return updated;
    });
  }, []);

  // Reschedule Booking
  const rescheduleBooking = useCallback(
    (id: string, newSlotDate: string, reason: string): Booking => {
      let rescheduledItem: Booking | null = null;
      setBookings((prev) => {
        const updated = prev.map((b) => {
          if (b.id !== id) return b;
          const newDeliveryDate = calculateDeliveryDate(
            b.serviceId,
            newSlotDate,
            b.deliveryMethod
          );
          const oldSlotTime = new Date(`${b.slotDate}T00:00:00`).getTime();
          const newSlotTime = new Date(`${newSlotDate}T00:00:00`).getTime();
          const diffDays = Math.max(
            0,
            Math.round((newSlotTime - oldSlotTime) / (1000 * 60 * 60 * 24))
          );

          rescheduledItem = {
            ...b,
            originalSlotDate: b.originalSlotDate || b.slotDate,
            slotDate: newSlotDate,
            deliveryDate: newDeliveryDate,
            delayDays: diffDays,
            rescheduledReason: reason,
          };
          return rescheduledItem;
        });

        if (rescheduledItem && typeof window !== "undefined") {
          fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rescheduledItem),
          }).catch(() => {});
        }
        return updated;
      });
      return rescheduledItem!;
    },
    [calculateDeliveryDate]
  );

  // Send Footage Reminder
  const sendFootageReminder = useCallback(
    (id: string, channel: "whatsapp" | "email"): string => {
      const b = bookings.find((item) => item.id === id);
      if (!b) return "";

      const msg = `નમસ્તે ${b.studioOrClient}, RSE સ્ટુડિયોમાંથી યાદી: તમારા પ્રોજેક્ટ "${b.coupleNames}" (${b.code}) નો એડિટિંગ સ્લોટ ${b.slotDate} ના રોજ રિઝર્વ છે. કૃપા કરીને રૉ ફૂટેજ જલ્દી મોકલી આપવા વિનંતી.`;

      setBookings((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const history = item.reminderHistory || [];
          return {
            ...item,
            reminderHistory: [
              ...history,
              {
                timestamp: new Date().toISOString(),
                channel,
                message: msg,
              },
            ],
          };
        })
      );
      return msg;
    },
    [bookings]
  );

  // Manual / On-Demand Sync with live book.rsegnr.in
  const syncLiveBookings = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
          setLastSyncedAt(new Date());
          setIsSyncing(false);
          return { success: true, count: data.bookings.length };
        }
      }
      setIsSyncing(false);
      return { success: false, count: 0, error: "સિન્ક નિષ્ફળ રહ્યું" };
    } catch (err: any) {
      setIsSyncing(false);
      return { success: false, count: 0, error: err?.message || "સિન્ક ભૂલ" };
    }
  }, []);

  // Update Client WhatsApp Group Link
  const updateClientWhatsAppGroup = useCallback(
    (clientId: string, groupUrl: string) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, whatsappGroupUrl: groupUrl } : c))
      );
    },
    []
  );

  // Update Service Price
  const updateServicePrice = useCallback(
    (serviceId: string, newPriceINR: number) => {
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, basePriceINR: newPriceINR } : s))
      );
    },
    []
  );

  // Add / Remove Holidays
  const addHoliday = useCallback((holiday: StudioHoliday) => {
    setHolidays((prev) => [...prev.filter((h) => h.date !== holiday.date), holiday]);
  }, []);

  const removeHoliday = useCallback((date: string) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  }, []);

  // Permanent Invoices Archive Handlers (MongoDB Atlas synced)
  const addInvoice = useCallback(
    async (invData: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> => {
      const newInv: Invoice = {
        ...invData,
        id: `inv_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [newInv, ...prev]);
      if (typeof window !== "undefined") {
        fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newInv),
        }).catch(() => {});
      }
      return newInv;
    },
    []
  );

  const updateInvoice = useCallback(async (inv: Invoice): Promise<void> => {
    setInvoices((prev) => prev.map((item) => (item.id === inv.id ? inv : item)));
    if (typeof window !== "undefined") {
      fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      }).catch(() => {});
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string): Promise<void> => {
    setInvoices((prev) => prev.filter((item) => item.id !== id));
    if (typeof window !== "undefined") {
      fetch(`/api/invoices?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }).catch(() => {});
    }
  }, []);

  return (
    <Ctx.Provider
      value={{
        currentUser,
        login,
        logout,
        staff,
        addStaff,
        updateStaff,
        deleteStaff,
        attendance,
        punchIn,
        punchOut,
        todayRecord,
        leaveRequests,
        submitLeaveRequest,
        updateLeaveStatus,
        bookings,
        syncLiveBookings,
        isSyncing,
        lastSyncedAt,
        addBooking,
        updateBooking,
        deleteBooking,
        updateBookingStatus,
        assignBooking,
        updateFrameIo,
        rescheduleBooking,
        sendFootageReminder,
        clients,
        findClientByPhone,
        updateClientWhatsAppGroup,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        services,
        updateServicePrice,
        holidays,
        addHoliday,
        removeHoliday,
        calculateDeliveryDate,
        getSlotAvailability,
        findNextAvailableSlot,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
