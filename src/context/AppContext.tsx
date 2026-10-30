"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { StaffMember, Booking, AttendanceRecord, Client, BookingStatus } from "@/types";
import { STAFF, SEED_BOOKINGS, SEED_ATTENDANCE, SEED_CLIENTS } from "@/data/seed";
import {
  ALL_SERVICES,
  ServiceDefinition,
  STUDIO_CONFIG,
  DEFAULT_HOLIDAYS,
  StudioHoliday,
} from "@/data/servicesData";

interface AppState {
  // Auth
  currentUser: StaffMember | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;

  // Bookings
  bookings: Booking[];
  addBooking: (b: Omit<Booking, "id" | "code" | "createdAt">) => Booking;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  assignBooking: (id: string, staffId: string) => void;
  updateFrameIo: (id: string, frameIoLink: string) => void;
  rescheduleBooking: (id: string, newSlotDate: string, reason: string) => Booking;
  sendFootageReminder: (id: string, channel: "whatsapp" | "email") => string;

  // Clients Directory
  clients: Client[];
  findClientByPhone: (phone: string) => Client | undefined;
  updateClientWhatsAppGroup: (clientId: string, groupUrl: string) => void;

  // Services & Pricing
  services: ServiceDefinition[];
  updateServicePrice: (serviceId: string, newPriceINR: number) => void;

  // Holidays
  holidays: StudioHoliday[];
  addHoliday: (holiday: StudioHoliday) => void;
  removeHoliday: (date: string) => void;

  // Calculation & Slot Logic
  calculateDeliveryDate: (serviceId: string, slotDateStr: string, deliveryMethod: "courier" | "online") => string;
  getSlotAvailability: (dateStr: string) => {
    isAvailable: boolean;
    reason?: string;
    occupiedCount: number;
    maxSlots: number;
  };
  findNextAvailableSlot: (fromSlotDateStr: string, editorDays: number) => string;

  // Attendance
  attendance: AttendanceRecord[];
  punchIn: () => void;
  punchOut: () => void;
  todayRecord: AttendanceRecord | undefined;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [services, setServices] = useState<ServiceDefinition[]>(ALL_SERVICES);
  const [holidays, setHolidays] = useState<StudioHoliday[]>(DEFAULT_HOLIDAYS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(SEED_ATTENDANCE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const u = localStorage.getItem("rse_user");
      if (u) setCurrentUser(JSON.parse(u));

      const b = localStorage.getItem("rse_bookings_v2");
      if (b) setBookings(JSON.parse(b));

      const c = localStorage.getItem("rse_clients_v2");
      if (c) setClients(JSON.parse(c));

      const s = localStorage.getItem("rse_services_v2");
      if (s) setServices(JSON.parse(s));

      const h = localStorage.getItem("rse_holidays_v2");
      if (h) setHolidays(JSON.parse(h));

      const a = localStorage.getItem("rse_attendance");
      if (a) setAttendance(JSON.parse(a));
    } catch (_) {}
    setHydrated(true);
  }, []);

  // Persist whenever data changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("rse_bookings_v2", JSON.stringify(bookings));
      localStorage.setItem("rse_clients_v2", JSON.stringify(clients));
      localStorage.setItem("rse_services_v2", JSON.stringify(services));
      localStorage.setItem("rse_holidays_v2", JSON.stringify(holidays));
      localStorage.setItem("rse_attendance", JSON.stringify(attendance));
      if (currentUser) {
        localStorage.setItem("rse_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("rse_user");
      }
    } catch (_) {}
  }, [bookings, clients, services, holidays, attendance, currentUser, hydrated]);

  // Auth
  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      const member = STAFF.find(
        (s) => s.email.toLowerCase() === cleanEmail && s.password === cleanPass
      );

      if (!member) {
        return { success: false, error: "ખોટો ઈમેઈલ અથવા પાસવર્ડ. કૃપા કરીને ફરી પ્રયાસ કરો." };
      }

      setCurrentUser(member);

      // Auto punch-in on login
      const todayStr = new Date().toISOString().split("T")[0];
      const existing = attendance.find((a) => a.staffId === member.id && a.date === todayStr);
      if (!existing) {
        const rec: AttendanceRecord = {
          id: `att_${Date.now()}`,
          staffId: member.id,
          date: todayStr,
          punchIn: new Date().toISOString(),
        };
        setAttendance((prev) => [rec, ...prev]);
      }

      return { success: true };
    },
    [attendance]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // Holiday management
  const addHoliday = useCallback((holiday: StudioHoliday) => {
    setHolidays((prev) => [...prev.filter((h) => h.date !== holiday.date), holiday]);
  }, []);

  const removeHoliday = useCallback((date: string) => {
    setHolidays((prev) => prev.filter((h) => h.date !== date));
  }, []);

  // Service Pricing
  const updateServicePrice = useCallback((serviceId: string, newPriceINR: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, totalPriceINR: newPriceINR, basePriceINR: newPriceINR } : s))
    );
  }, []);

  // Check Slot Availability
  const getSlotAvailability = useCallback(
    (dateStr: string): { isAvailable: boolean; reason?: string; occupiedCount: number; maxSlots: number } => {
      const targetDate = new Date(`${dateStr}T00:00:00`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // 1. Past dates or Lead time buffer (Minimum 3 days)
      const minDate = new Date(now);
      minDate.setDate(now.getDate() + STUDIO_CONFIG.MIN_LEAD_DAYS);

      if (targetDate <= minDate) {
        return {
          isAvailable: false,
          reason: `Minimum ${STUDIO_CONFIG.MIN_LEAD_DAYS} days advance booking notice required`,
          occupiedCount: 3,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 2. Sunday check
      if (targetDate.getDay() === 0) {
        return {
          isAvailable: false,
          reason: "Sunday (Studio Closed)",
          occupiedCount: 3,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 3. Holiday check
      const holidayMatch = holidays.find((h) => h.date === dateStr);
      if (holidayMatch) {
        return {
          isAvailable: false,
          reason: `Public Holiday: ${holidayMatch.name}`,
          occupiedCount: 3,
          maxSlots: STUDIO_CONFIG.DAILY_MAX_SLOTS,
        };
      }

      // 4. Daily Capacity check with multi-day editor blocking
      let activeOccupied = 0;
      for (const b of bookings) {
        if (b.status === "delivered_done") continue;
        const bStart = new Date(`${b.slotDate}T00:00:00`);
        const durationDays = Math.max(1, Math.ceil(b.editorDays || 1));
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

  // Calculate Delivery Date with Holidays, Sundays, and Online +1.5 days buffer
  const calculateDeliveryDate = useCallback(
    (serviceId: string, slotDateStr: string, deliveryMethod: "courier" | "online"): string => {
      const s = services.find((item) => item.id === serviceId) || ALL_SERVICES[0];
      const baseDays = s.clientDays || 5;

      // Online transfer adds +1.5 days (rounded up to 2 days for calendar safety)
      const bufferDays = deliveryMethod === "online" ? Math.ceil(STUDIO_CONFIG.ONLINE_INGEST_BUFFER_DAYS) : 0;
      const totalWorkingDays = baseDays + bufferDays;

      const cursor = new Date(`${slotDateStr}T00:00:00`);
      let added = 0;

      while (added < totalWorkingDays) {
        cursor.setDate(cursor.getDate() + 1);
        const ymd = cursor.toISOString().split("T")[0];

        // Skip Sundays
        if (cursor.getDay() === 0) continue;
        // Skip Holidays
        if (holidays.some((h) => h.date === ymd)) continue;

        added += 1;
      }

      return cursor.toISOString().split("T")[0];
    },
    [services, holidays]
  );

  // Find Next Available Slot for Rescheduling
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

  // Update WhatsApp group link for a client in directory
  const updateClientWhatsAppGroup = useCallback((clientId: string, groupUrl: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, whatsappGroupUrl: groupUrl } : c))
    );
  }, []);

  // Lookup client by phone
  const findClientByPhone = useCallback(
    (phone: string): Client | undefined => {
      const cleanPhone = phone.replace(/\D/g, "");
      if (!cleanPhone) return undefined;
      return clients.find((c) => c.phone.replace(/\D/g, "").includes(cleanPhone));
    },
    [clients]
  );

  // Auto-sync or create client profile
  const syncClientDirectory = (booking: Booking) => {
    setClients((prev) => {
      const cleanPhone = booking.phone.replace(/\D/g, "");
      const existing = prev.find((c) => c.phone.replace(/\D/g, "") === cleanPhone);

      const totalAmount = booking.pricing.totalAmount || 0;
      const advanceAmount = booking.pricing.advancePaid ? booking.pricing.advanceAmount || 0 : 0;
      const pendingAmount = totalAmount - advanceAmount;

      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalBookings: c.totalBookings + 1,
                totalBilled: c.totalBilled + totalAmount,
                totalPaid: c.totalPaid + advanceAmount,
                totalPending: c.totalPending + pendingAmount,
                lastActive: new Date().toISOString(),
                preferredLutStyle: booking.notes || c.preferredLutStyle,
              }
            : c
        );
      }

      const newClient: Client = {
        id: `cli_${Date.now()}`,
        studioName: booking.studioOrClient,
        contactPerson: booking.contactPerson || booking.coupleNames,
        phone: booking.phone,
        email: booking.email,
        region: booking.region,
        customerType: booking.customerType,
        preferredLutStyle: booking.cameraProfile || "Standard",
        totalBookings: 1,
        totalBilled: totalAmount,
        totalPaid: advanceAmount,
        totalPending: pendingAmount,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };
      return [newClient, ...prev];
    });
  };

  // Add Booking
  const addBooking = useCallback(
    (data: Omit<Booking, "id" | "code" | "createdAt">): Booking => {
      const code = `RSE-${String(bookings.length + 1).padStart(3, "0")}`;
      const newBooking: Booking = {
        ...data,
        id: `b_${Date.now()}`,
        code,
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [newBooking, ...prev]);
      syncClientDirectory(newBooking);
      return newBooking;
    },
    [bookings.length]
  );

  // Update Status
  const updateBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  // Assign Editor
  const assignBooking = useCallback((id: string, staffId: string) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, assignedTo: staffId } : b)));
  }, []);

  // Update Frame.io link & trigger 7-day correction timer
  const updateFrameIo = useCallback((id: string, frameIoLink: string) => {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + STUDIO_CONFIG.REVISION_DEADLINE_DAYS);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              frameIoLink,
              previewSentAt: now.toISOString(),
              correctionDueAt: due.toISOString(),
              status: "preview_sent",
            }
          : b
      )
    );
  }, []);

  // Reschedule Booking when footage delayed
  const rescheduleBooking = useCallback(
    (id: string, newSlotDate: string, reason: string): Booking => {
      let updatedBooking!: Booking;

      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;

          const newDelivery = calculateDeliveryDate(b.serviceId, newSlotDate, b.deliveryMethod);
          updatedBooking = {
            ...b,
            originalSlotDate: b.originalSlotDate || b.slotDate,
            slotDate: newSlotDate,
            deliveryDate: newDelivery,
            rescheduledReason: reason,
            status: "awaiting_footage",
          };
          return updatedBooking;
        })
      );

      return updatedBooking;
    },
    [calculateDeliveryDate]
  );

  // Send WhatsApp / Email Reminder for Delayed Footage
  const sendFootageReminder = useCallback(
    (id: string, channel: "whatsapp" | "email"): string => {
      const b = bookings.find((item) => item.id === id);
      if (!b) return "";

      const msg = `નમસ્તે ${b.studioOrClient || b.coupleNames}, RSE Post Production House તરફથી. તમારા પ્રોજેક્ટ (${b.code}) માટેનો એડિટિંગ સ્લોટ ${b.slotDate} ના રોજ રિઝર્વ છે. અમને હજુ સુધી તમારો ડેટા (HDD/લિંક) મળ્યો નથી. સ્લોટ કેન્સલ કે ડીલે ન થાય તે માટે આજે જ ડેટા મોકલવા વિનંતી. ડેટા મોડો આવ્યે સ્લોટ આગામી ઉપલબ્ધ તારીખે શિફ્ટ થઈ જશે. આભાર. - RSE Team`;

      setBookings((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                reminderHistory: [
                  ...(item.reminderHistory || []),
                  { timestamp: new Date().toISOString(), channel, message: msg },
                ],
              }
            : item
        )
      );

      if (channel === "whatsapp") {
        const cleanPhone = b.phone.replace(/\D/g, "");
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        if (typeof window !== "undefined") {
          window.open(waUrl, "_blank");
        }
      } else if (channel === "email" && b.email) {
        fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "footage_reminder",
            bookingCode: b.code,
            clientEmail: b.email,
            clientName: b.coupleNames,
            studioName: b.studioOrClient,
            slotDate: b.slotDate,
            deliveryDate: b.deliveryDate,
          }),
        }).catch((err) => console.error("Footage reminder email error:", err));
      }

      return msg;
    },
    [bookings]
  );

  // Attendance
  const today = new Date().toISOString().split("T")[0];
  const todayRecord = currentUser
    ? attendance.find((a) => a.staffId === currentUser.id && a.date === today)
    : undefined;

  const punchIn = useCallback(() => {
    if (!currentUser) return;
    const existing = attendance.find((a) => a.staffId === currentUser.id && a.date === today);
    if (existing && !existing.punchOut) return;

    const rec: AttendanceRecord = {
      id: `att_${Date.now()}`,
      staffId: currentUser.id,
      date: today,
      punchIn: new Date().toISOString(),
    };
    setAttendance((prev) => [rec, ...prev.filter((a) => !(a.staffId === currentUser.id && a.date === today))]);
  }, [currentUser, attendance, today]);

  const punchOut = useCallback(() => {
    if (!currentUser || !todayRecord || todayRecord.punchOut) return;
    setAttendance((prev) =>
      prev.map((a) => (a.id === todayRecord.id ? { ...a, punchOut: new Date().toISOString() } : a))
    );
  }, [currentUser, todayRecord]);

  if (!hydrated) return null;

  return (
    <Ctx.Provider
      value={{
        currentUser,
        login,
        logout,
        bookings,
        addBooking,
        updateBookingStatus,
        assignBooking,
        updateFrameIo,
        rescheduleBooking,
        sendFootageReminder,
        clients,
        findClientByPhone,
        updateClientWhatsAppGroup,
        services,
        updateServicePrice,
        holidays,
        addHoliday,
        removeHoliday,
        calculateDeliveryDate,
        getSlotAvailability,
        findNextAvailableSlot,
        attendance,
        punchIn,
        punchOut,
        todayRecord,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
