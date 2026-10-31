"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Booking, Client, BookingStatus } from "@/types";
import { SEED_BOOKINGS, SEED_CLIENTS } from "@/data/seed";
import {
  ALL_SERVICES,
  ServiceDefinition,
  STUDIO_CONFIG,
  DEFAULT_HOLIDAYS,
  StudioHoliday,
} from "@/data/servicesData";

interface AppState {
  // Bookings
  bookings: Booking[];
  addBooking: (b: Omit<Booking, "id" | "code" | "createdAt">) => Booking;

  // Clients Directory
  clients: Client[];
  findClientByPhone: (phone: string) => Client | undefined;

  // Services & Capacity
  services: ServiceDefinition[];
  holidays: StudioHoliday[];

  // Calculation & Slot Logic
  calculateDeliveryDate: (serviceId: string, slotDateStr: string, deliveryMethod: "courier" | "online") => string;
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
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [clients, setClients] = useState<Client[]>(SEED_CLIENTS);
  const [services] = useState<ServiceDefinition[]>(ALL_SERVICES);
  const [holidays] = useState<StudioHoliday[]>(DEFAULT_HOLIDAYS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount, then sync with server API
  useEffect(() => {
    try {
      const b = localStorage.getItem("rse_bookings_v2");
      if (b) setBookings(JSON.parse(b));

      const c = localStorage.getItem("rse_clients_v2");
      if (c) setClients(JSON.parse(c));
    } catch (_) {}
    setHydrated(true);

    // Initial background sync from server API (/api/bookings)
    fetch("/api/bookings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
          setBookings((prev) => {
            const map = new Map<string, Booking>();
            for (const item of data.bookings) map.set(item.id, item);
            for (const item of prev) {
              if (!map.has(item.id)) map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync polling every 25 seconds & on window focus (syncs slots booked from external OS or other clients)
  useEffect(() => {
    const handleSync = () => {
      fetch("/api/bookings", { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.bookings) && data.bookings.length > 0) {
            setBookings((prev) => {
              const map = new Map<string, Booking>();
              for (const item of data.bookings) map.set(item.id, item);
              for (const item of prev) {
                if (!map.has(item.id)) map.set(item.id, item);
              }
              return Array.from(map.values());
            });
          }
        })
        .catch(() => {});
    };

    const interval = setInterval(handleSync, 25000);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Persist locally
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("rse_bookings_v2", JSON.stringify(bookings));
      localStorage.setItem("rse_clients_v2", JSON.stringify(clients));
    } catch (_) {}
  }, [bookings, clients, hydrated]);

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

  // Calculate Delivery Date with Holidays, Sundays, and Online buffer
  const calculateDeliveryDate = useCallback(
    (serviceId: string, slotDateStr: string, deliveryMethod: "courier" | "online"): string => {
      const svc = services.find((s) => s.id === serviceId);
      const standardDays = svc ? svc.clientDays : 5;

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
    [bookings.length]
  );

  return (
    <Ctx.Provider
      value={{
        bookings,
        addBooking,
        clients,
        findClientByPhone,
        services,
        holidays,
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
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
