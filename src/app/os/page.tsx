"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { convertIndicDigitsToAscii } from "@/lib/phone";
import { calculateRsePrice, parseDuration } from "@/lib/pricingCalculator";
import { INDIAN_SERVICES } from "@/data/servicesData";
import {
  getEffectivePermissions,
  getRoleDefaultPermissions,
  isSuperAdminUser,
  PERMISSION_LABELS,
} from "@/lib/permissions";
import {
  Booking,
  BookingStatus,
  StaffMember,
  StaffPermissions,
  Client,
  LeaveRequest,
  Role,
  LeaveType,
  Invoice,
  InvoiceItem,
} from "@/types";
import {
  Kanban,
  Calendar,
  Users,
  Plus,
  ExternalLink,
  Phone,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  HardDrive,
  ShieldCheck,
  Search,
  Filter,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Printer,
  Check,
  Send,
  Cloud,
  Truck,
  RefreshCw,
  FolderSync,
  Edit2,
  Trash2,
  Settings,
  Download,
  CalendarDays,
  Smartphone,
  Laptop,
  CheckCheck,
  XCircle,
  HelpCircle,
  UserCheck,
  Briefcase,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// ─── RSE 8-Stage Production Kanban ──────────────────────────────────
const STAGES: {
  id: BookingStatus;
  label: string;
  stepNum: string;
  countColor: string;
  badgeBg: string;
  description: string;
}[] = [
  {
    id: "new_deposit_pending",
    stepNum: "૧",
    label: "નવું / ૫૦% એડવાન્સ",
    countColor: "bg-amber-100 text-amber-900 border-amber-300",
    badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
    description: "સ્લોટ બુકિંગ - ડિપોઝીટ બાકી",
  },
  {
    id: "awaiting_footage",
    stepNum: "૨",
    label: "ડેટાની રાહમાં",
    countColor: "bg-blue-100 text-blue-900 border-blue-300",
    badgeBg: "bg-blue-50 text-blue-800 border-blue-200",
    description: "HDD કુરિયર કે ડ્રાઇવ લિંક",
  },
  {
    id: "in_selection_cut",
    stepNum: "૩",
    label: "સિલેક્શન અને કટ",
    countColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    badgeBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    description: "Premiere / FCPX Culling",
  },
  {
    id: "in_edit_polish",
    stepNum: "૪",
    label: "ફાઇનલ એડિટિંગ",
    countColor: "bg-purple-100 text-purple-900 border-purple-300",
    badgeBg: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Color Grading & Sound",
  },
  {
    id: "preview_sent",
    stepNum: "૫",
    label: "પ્રિવ્યૂ Frame.io",
    countColor: "bg-pink-100 text-pink-900 border-pink-300",
    badgeBg: "bg-pink-50 text-pink-800 border-pink-200",
    description: "૭ દિવસનું કરેક્શન ટાઈમર",
  },
  {
    id: "in_revision",
    stepNum: "૬",
    label: "શનિવાર કરેક્શન",
    countColor: "bg-orange-100 text-orange-900 border-orange-300",
    badgeBg: "bg-orange-50 text-orange-800 border-orange-200",
    description: "ક્લાયન્ટ ફીડબેક કામ",
  },
  {
    id: "ready_for_final",
    stepNum: "૭",
    label: "આખરી ૫૦% બાકી",
    countColor: "bg-cyan-100 text-cyan-900 border-cyan-300",
    badgeBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
    description: "બિલિંગ ક્લીયરન્સ",
  },
  {
    id: "delivered_done",
    stepNum: "૮",
    label: "ડિલિવર થયેલ ✅",
    countColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "સંપૂર્ણ પૂર્ણ થયેલ",
  },
];

export default function RseOsPage() {
  const {
    hydrated,
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
    addBooking,
    updateBooking,
    deleteBooking,
    updateBookingStatus,
    assignBooking,
    updateFrameIo,
    rescheduleBooking,
    sendFootageReminder,
    clients,
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
    findNextAvailableSlot,
    lastSyncedAt,
  } = useApp();

  // Defense-in-depth: Allow localhost, studio Wi-Fi LAN (.local / private IPs), or authorized remote passkey/cookie
  const [isBlockedDomain, setIsBlockedDomain] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isLocalNet =
        hostname.includes("localhost") ||
        hostname.includes("127.0.0.1") ||
        hostname.includes(".local") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

      const hasCookieAuth = document.cookie.includes("rse_os_token=rse_studio_keyur");
      const search = window.location.search || "";
      const hasQueryPass = search.includes("pass=rse2026") || search.includes("pin=8866");

      if (!isLocalNet && !hasCookieAuth && !hasQueryPass) {
        setIsBlockedDomain(true);
        window.location.replace("/");
      }
    }
  }, []);

  if (isBlockedDomain) {
    return null;
  }

  // Cloud Sync notification toast
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleManualSync = async () => {
    const res = await syncLiveBookings();
    if (res.success) {
      setSyncNotice(`✅ વેબસાઇટ પરથી ${res.count} સ્લોટ્સ લાઇવ સિન્ક થયા!`);
    } else {
      setSyncNotice(`⚠️ સિન્ક ચેતવણી: ${res.error || "કનેક્શન ચકાસો"}`);
    }
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Editor Workload Filter State
  const [selectedEditorFilter, setSelectedEditorFilter] = useState<string | null>(null);

  // Helper to generate professional 1-Click WhatsApp stage messages
  const getWhatsAppStageMessage = (booking: Booking, stageId?: string): string => {
    const stage = stageId || booking.status;
    const couple = booking.coupleNames || "પ્રોજેક્ટ";
    const code = booking.code || "RSE";
    const studio = booking.studioOrClient || "Studio";
    const date = booking.deliveryDate || booking.slotDate || "";

    switch (stage) {
      case "new_deposit_pending":
        return `નમસ્તે ${studio},\nઆપનું બુકિંગ સ્લોટ ${code} (${couple}) કન્ફર્મ થયેલ છે. ૫૦% એડવાન્સ જમા થયેલ છે.\n- RSE Post Production House, Gandhinagar`;
      case "awaiting_footage":
        if (booking.deliveryMethod === "courier") {
          const ssdInfo = booking.ssdTrackingNumber
            ? ` (કુરિયર: ${booking.ssdCourierCompany || "કુરિયર"}, ટ્રેકિંગ નં: ${booking.ssdTrackingNumber})`
            : "";
          return `નમસ્તે ${studio},\nઆપના પ્રોજેક્ટ ${code} (${couple}) ની હાર્ડડ્રાઇવ (SSD) અમને સ્ટુડિયો પર સુરક્ષિત મળી ગઈ છે.${ssdInfo}\nટૂંક સમયમાં એડિટિંગ શરૂ થશે.\n- RSE Post Production House`;
        }
        return `નમસ્તે ${studio},\nઆપના પ્રોજેક્ટ ${code} (${couple}) ની રૉ ફૂટેજ લિંક અમને મળી ગઈ છે.\nટૂંક સમયમાં એડિટિંગ શરૂ થશે.\n- RSE Post Production House`;
      case "in_selection_cut":
        return `નમસ્તે ${studio},\nઆપના પ્રોજેક્ટ ${code} (${couple}) નું Premiere Pro માં કલિંગ અને રફ કટ એડિટિંગ શરૂ થઈ ગયું છે.\nઅંદાજિત ડિલિવરી તારીખ: ${date}\n- RSE Post Production House`;
      case "in_edit_polish":
        return `નમસ્તે ${studio},\nઆપના પ્રોજેક્ટ ${code} (${couple}) નું સિનેમેટિક કલર ગ્રેડિંગ અને સાઉન્ડ એડિટિંગ ચાલુ છે.\n- RSE Post Production House`;
      case "preview_sent":
      case "in_client_review": {
        const link = booking.frameIoLink || "Frame.io લિંક ટૂંક સમયમાં મોકલાશે";
        return `નમસ્તે ${studio},\nઆપના પ્રોજેક્ટ ${code} (${couple}) નો રિવ્યુ કટ તૈયાર થઈ ગયો છે!\nઆ લિંક પરથી ચેક કરો અને આપનો પ્રતિભાવ જણાવો: ${link}\n- RSE Post Production House`;
      }
      case "in_revision": {
        const round = booking.revisionRound ? ` (Revision Round #${booking.revisionRound})` : "";
        return `નમસ્તે ${studio},\nઆપના જણાવેલા ફેરફારો${round} મુજબ પ્રોજેક્ટ ${code} (${couple}) માં સુધારા કરવાનું કામ ચાલુ છે.\n- RSE Post Production House`;
      }
      case "ready_for_final": {
        const balance = booking.pricing?.finalAmount || 0;
        return `નમસ્તે ${studio},\nઆપનો પ્રોજેક્ટ ${code} (${couple}) ફાઇનલ માસ્ટર એક્સપોર્ટ રેડી છે!\nઆખરી ૫૦% પેમેન્ટ (₹${balance.toLocaleString("en-IN")}) જમા કરાવીને ફુલ ક્વોલિટી વિડીયો મેળવી શકો છો.\n- RSE Post Production House`;
      }
      case "delivered_done":
        return `નમસ્તે ${studio},\nઆપનો પ્રોજેક્ટ ${code} (${couple}) સફળતાપૂર્વક ડિલિવર થઈ ગયો છે. RSE Post Production House સાથે કામ કરવા બદલ આભાર! 🙏\n- RSE Post Production House`;
      default:
        return `નમસ્તે ${studio},\nપ્રોજેક્ટ ${code} (${couple}) અંગે RSE Post Production House તરફથી સંપર્ક કરવામાં આવે છે.`;
    }
  };

  const getWhatsAppUrl = (phoneStr: string, message: string): string => {
    const cleanPhone = convertIndicDigitsToAscii(phoneStr || "").replace(/\D/g, "");
    const waPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Inline Leave Review & Service Pricing edit state (replaces browser prompt())
  const [reviewingLeave, setReviewingLeave] = useState<{
    id: string;
    action: "approved" | "rejected";
    note: string;
  } | null>(null);
  const [editingServicePriceId, setEditingServicePriceId] = useState<string | null>(null);
  const [editingServicePriceValue, setEditingServicePriceValue] = useState<string>("");

  // Apple device view mode: "mac" (Desktop Workstation) vs "iphone" (iOS Mobile)
  const [devicePreviewMode, setDevicePreviewMode] = useState<"mac" | "iphone">("mac");

  // Admin Navigation Tabs:
  // "kanban" (Work Pipeline) | "calendar" (All Bookings & Slots) | "invoices" (Billing Archive) | "staff" (Editors) | "settings" (Backup & Pricing)
  const [adminTab, setAdminTab] = useState<
    "kanban" | "calendar" | "invoices" | "staff" | "settings" | "leaves" | "clients" | "my_desk"
  >("kanban");

  // Invoices & Billing Archive State
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "paid">("all");

  // Booking Register Filter in Calendar tab:
  const [bookingStatusFilter, setBookingStatusFilter] = useState<
    "all" | "urgent" | "active" | "awaiting" | "done"
  >("all");

  // Employee Navigation Tabs:
  // "tasks" | "punch" | "leave" | "salary"
  const [employeeTab, setEmployeeTab] = useState<"tasks" | "punch" | "leave" | "salary">("tasks");

  // Drag and Drop State
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Date badge helper function
  const getDateStatus = (slotDateStr: string, deliveryDateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (slotDateStr === today) {
      return { label: '🔴 આજે સ્લોટ (Today)', badge: 'bg-red-100 text-red-900 border-red-300 font-bold' };
    }
    if (slotDateStr === tomorrow) {
      return { label: '🟠 આવતીકાલે (Tomorrow)', badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
    }
    if (slotDateStr < today) {
      return { label: `⚠️ પાછલી તારીખ: ${slotDateStr}`, badge: "bg-red-50 text-red-800 border-red-200 font-bold" };
    }
    return { label: `🗓️ સ્લોટ: ${slotDateStr}`, badge: "bg-[#F8F7F4] text-[#1C1C1E] border-[#E5E5EA]" };
  };

  // Modals
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showLeaveApplyModal, setShowLeaveApplyModal] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<StaffMember | null>(null);
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<Booking | null>(null);
  const [frameIoInputModalBooking, setFrameIoInputModalBooking] = useState<Booking | null>(null);
  const [tempFrameIoLink, setTempFrameIoLink] = useState("");
  const [editingClientWhatsApp, setEditingClientWhatsApp] = useState<{
    id: string;
    studioName: string;
    url: string;
  } | null>(null);

  // Booking Edit Mode State (Admin Editable Cards)
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editFormData, setEditFormData] = useState<Booking | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Smart Pricing & Duration Calculator State
  const [calcDurationInput, setCalcDurationInput] = useState("");
  const [calcQuantity, setCalcQuantity] = useState(1);
  const [calcSelectedService, setCalcSelectedService] = useState("in_wedding_highlight");
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  const handleApplyCalculatedPriceToEdit = (serviceId: string, durationStr: string, qty: number = 1) => {
    if (!editFormData) return;
    const res = calculateRsePrice(serviceId, durationStr, qty);
    if (res.totalAmount > 0) {
      setEditFormData({
        ...editFormData,
        pricing: {
          ...(editFormData.pricing || {
            currency: "INR",
            advancePaid: true,
            finalPaid: false,
          }),
          totalAmount: res.totalAmount,
          advanceAmount: res.advanceAmount,
          finalAmount: res.finalAmount,
        },
      });
      setCalcFeedback(`✓ ${res.breakdownText}`);
    }
  };

  const startEditingBooking = (booking: Booking) => {
    setEditFormData({ ...booking });
    setIsEditingBooking(true);
    setEditSuccessMsg(null);
    setCalcFeedback(null);
    setCalcDurationInput("");
  };

  const handleSaveBookingEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    const cleanPhone = convertIndicDigitsToAscii(editFormData.phone || "");
    const updated: Booking = {
      ...editFormData,
      phone: cleanPhone,
    };
    updateBooking(updated);
    setSelectedBookingForDetails(updated);
    setIsEditingBooking(false);
    setEditSuccessMsg("✓ બુકિંગ વિગતો સફળતાપૂર્વક સાચવવામાં આવી!");
    setTimeout(() => setEditSuccessMsg(null), 3500);
  };

  const handleDeleteBooking = (id: string, code: string, couple: string) => {
    if (window.confirm(`શું તમે ખરેખર ${code} (${couple}) બુકિંગ ડિલીટ કરવા માંગો છો?`)) {
      deleteBooking(id);
      setSelectedBookingForDetails(null);
      setIsEditingBooking(false);
    }
  };

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | "indian" | "foreign">("all");

  // New Booking form state
  const [formCouple, setFormCouple] = useState("");
  const [formStudio, setFormStudio] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRegion, setFormRegion] = useState<"indian" | "foreign">("indian");
  const [formSlotDate, setFormSlotDate] = useState("2026-11-19");
  const [formDeliveryDate, setFormDeliveryDate] = useState("2026-11-24");
  const [formPackage, setFormPackage] = useState("Birthday Highlight (બર્થડે હાઇલાઇટ)");
  const [formAssignedTo, setFormAssignedTo] = useState("");
  const [formDeliveryMethod, setFormDeliveryMethod] = useState<"courier" | "online">("online");
  const [formRawLink, setFormRawLink] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPrice, setFormPrice] = useState(4500);
  const [formAdvanceAmount, setFormAdvanceAmount] = useState<number>(1000);
  const [formAdvancePaid, setFormAdvancePaid] = useState<boolean>(true);

  // Helper: Calculate forward delivery date (Slot + 5 days)
  const calculateDefaultDeliveryDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        d.setDate(d.getDate() + 5);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    } catch {}
    return dateStr;
  };

  // Helper: Open Quick Booking modal with current date & auto-calculated delivery
  const openNewBookingModal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    const delStr = calculateDefaultDeliveryDate(todayStr);

    setFormCouple("");
    setFormStudio("");
    setFormPhone("");
    setFormEmail("");
    setFormRegion("indian");
    setFormSlotDate(todayStr);
    setFormDeliveryDate(delStr);
    setFormPackage("Birthday Highlight (બર્થડે હાઇલાઇટ)");
    setFormPrice(4500);
    setFormAdvanceAmount(1000);
    setFormAdvancePaid(true);
    setFormAssignedTo("");
    setFormRawLink("");
    setFormNotes("");
    setShowNewBookingModal(true);
  };

  // Helper: Auto-advance delivery date when slot date is selected
  const handleFormSlotDateChange = (newDate: string) => {
    setFormSlotDate(newDate);
    if (newDate) {
      setFormDeliveryDate(calculateDefaultDeliveryDate(newDate));
    }
  };

  // New Staff & Permission Editor state
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<Role>("editor");
  const [newStaffSalary, setNewStaffSalary] = useState(45000);
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffPermissions, setNewStaffPermissions] = useState<StaffPermissions>(() =>
    getRoleDefaultPermissions("editor")
  );
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);

  // New Leave form state
  const [leaveStartDate, setLeaveStartDate] = useState("2026-11-16");
  const [leaveEndDate, setLeaveEndDate] = useState("2026-11-17");
  const [leaveDays, setLeaveDays] = useState(2);
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [leaveReason, setLeaveReason] = useState("");

  // Settings: New holiday
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  // Settings: Cloud Database (MongoDB)
  const [mongoUriInput, setMongoUriInput] = useState("");
  const [dbStatus, setDbStatus] = useState<{
    configured: boolean;
    connected: boolean;
    type: string;
    message: string;
    totalBookingsInCloud?: number;
  } | null>(null);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbMessage, setDbMessage] = useState<string | null>(null);
  const [showIosInstallPrompt, setShowIosInstallPrompt] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Register Service Worker, iOS Install Banner & Desktop Keyboard Shortcuts (Cmd+N, Cmd+K)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const ua = window.navigator.userAgent || "";
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isIos && !isStandalone && !localStorage.getItem("rse_ios_banner_dismissed")) {
      setShowIosInstallPrompt(true);
    }

    const handleOsAction = (evt: Event) => {
      const action = (evt as CustomEvent).detail;
      const curPerms = getEffectivePermissions(currentUser);
      if (action === "new-booking" && curPerms.canCreateBooking) {
        openNewBookingModal();
      } else if (action === "focus-search") {
        setAdminTab("kanban");
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAdminTab("kanban");
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        if (getEffectivePermissions(currentUser).canCreateBooking) {
          e.preventDefault();
          openNewBookingModal();
        }
      }
    };

    window.addEventListener("rse-os-action", handleOsAction);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("rse-os-action", handleOsAction);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentUser]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    setLoginError(null);
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !loginPassword) {
      setLoginError("⚠️ કૃપા કરીને ઈમેઈલ અને પાસવર્ડ બંને દાખલ કરો.");
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await login(cleanEmail, loginPassword);
      if (!res.success) {
        setLoginError(res.error || "ખોટો ઈમેઈલ અથવા પાસવર્ડ.");
      } else {
        setLoginPassword("");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Add Staff Submit
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !newStaffPassword.trim()) return;

    addStaff({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      password: newStaffPassword.trim(),
      role: newStaffRole,
      baseSalary: Number(newStaffSalary) || 30000,
      phone: newStaffPhone.trim() || undefined,
      isActive: true,
      permissions: { ...newStaffPermissions },
    });

    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPassword("");
    setNewStaffPhone("");
    setNewStaffRole("editor");
    setNewStaffPermissions(getRoleDefaultPermissions("editor"));
    setShowAddStaffModal(false);
  };

  // Save Staff Permissions & Details Submit
  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember) return;
    updateStaff(editingStaffMember.id, {
      name: editingStaffMember.name.trim(),
      email: editingStaffMember.email.trim(),
      password: editingStaffMember.password,
      role: editingStaffMember.role,
      baseSalary: Number(editingStaffMember.baseSalary) || 0,
      phone: editingStaffMember.phone,
      isActive: editingStaffMember.isActive,
      permissions: editingStaffMember.permissions,
    });
    setSyncNotice(`✅ ${editingStaffMember.name} ની પરમિશન અને વિગતો સેવ થઈ ગઈ!`);
    setTimeout(() => setSyncNotice(null), 3500);
    setEditingStaffMember(null);
  };

  // Submit Leave Request
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !leaveReason.trim()) return;

    submitLeaveRequest({
      staffId: currentUser.id,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      totalDays: Number(leaveDays) || 1,
      reason: leaveReason.trim(),
      type: leaveType,
    });

    setLeaveReason("");
    setShowLeaveApplyModal(false);
  };

  // Add Booking Submit
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCouple.trim()) return;

    const totalAmt = Number(formPrice) || 0;
    const advance = Number(formAdvanceAmount) || Math.round(totalAmt / 2);
    const finalAmt = Math.max(0, totalAmt - advance);

    addBooking({
      source: "manual",
      region: formRegion,
      customerType: "existing",
      coupleNames: formCouple.trim(),
      studioOrClient: formStudio.trim() || "ડાયરેક્ટ ક્લાયન્ટ",
      phone: formPhone.trim(),
      email: formEmail.trim(),
      eventDate: formSlotDate,
      slotDate: formSlotDate,
      deliveryDate: formDeliveryDate,
      serviceId: "manual_custom",
      packageType: formPackage,
      editorDays: 3,
      clientDays: 5,
      deliveryMethod: formDeliveryMethod,
      rawLink: formRawLink.trim() || "https://drive.google.com/sample",
      notes: formNotes.trim(),
      assignedTo: formAssignedTo || undefined,
      pricing: {
        totalAmount: totalAmt,
        advanceAmount: advance,
        finalAmount: finalAmt,
        advancePaid: formAdvancePaid,
        finalPaid: false,
        currency: formRegion === "foreign" ? "USD" : "INR",
      },
      status: formAdvancePaid ? "awaiting_footage" : "new_deposit_pending",
    });

    setFormCouple("");
    setFormStudio("");
    setFormPhone("");
    setFormEmail("");
    setFormRawLink("");
    setFormNotes("");
    setFormAssignedTo("");
    setShowNewBookingModal(false);
  };

  // Active User Effective Permissions (Computed safely)
  const currentPerms = useMemo(() => getEffectivePermissions(currentUser), [currentUser]);
  const isSuperAdmin = isSuperAdminUser(currentUser);

  // Filtered Bookings for Workspace (Respects canViewAllBookings permission!)
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!currentPerms.canViewAllBookings && currentUser) {
          if (b.assignedTo !== currentUser.id) return false;
        }
        const couple = (b.coupleNames || "").toLowerCase();
        const studio = (b.studioOrClient || "").toLowerCase();
        const code = (b.code || "").toLowerCase();
        const phone = currentPerms.canViewClientContacts ? (b.phone || "") : "";
        const query = searchQuery.toLowerCase();

        const matchQuery =
          couple.includes(query) ||
          studio.includes(query) ||
          code.includes(query) ||
          phone.includes(searchQuery);
        const matchRegion = regionFilter === "all" || b.region === regionFilter;
        const matchEditor = !selectedEditorFilter || b.assignedTo === selectedEditorFilter;
        return matchQuery && matchRegion && matchEditor;
      })
      .sort((a, b) => new Date(a.slotDate || 0).getTime() - new Date(b.slotDate || 0).getTime());
  }, [bookings, searchQuery, regionFilter, selectedEditorFilter, currentPerms.canViewAllBookings, currentPerms.canViewClientContacts, currentUser]);

  // Filtered Bookings for Complete Register View (Respects canViewAllBookings permission!)
  const filteredCalendarBookings = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    return bookings
      .filter((b) => {
        if (!currentPerms.canViewAllBookings && currentUser) {
          if (b.assignedTo !== currentUser.id) return false;
        }
        const couple = (b.coupleNames || "").toLowerCase();
        const studio = (b.studioOrClient || "").toLowerCase();
        const code = (b.code || "").toLowerCase();
        const phone = currentPerms.canViewClientContacts ? (b.phone || "") : "";
        const query = searchQuery.toLowerCase();

        const matchQuery =
          couple.includes(query) ||
          studio.includes(query) ||
          code.includes(query) ||
          phone.includes(searchQuery);

        if (!matchQuery) return false;

        if (bookingStatusFilter === "urgent") {
          return b.slotDate === today || b.slotDate === tomorrow;
        }
        if (bookingStatusFilter === "active") {
          return (
            b.status === "in_selection_cut" ||
            b.status === "in_edit_polish" ||
            b.status === "in_revision" ||
            b.status === "preview_sent"
          );
        }
        if (bookingStatusFilter === "awaiting") {
          return b.status === "awaiting_footage";
        }
        if (bookingStatusFilter === "done") {
          return b.status === "delivered_done";
        }
        return true;
      })
      .sort((a, b) => new Date(a.slotDate || 0).getTime() - new Date(b.slotDate || 0).getTime());
  }, [bookings, searchQuery, bookingStatusFilter, currentPerms.canViewAllBookings, currentPerms.canViewClientContacts, currentUser]);

  // Employee tasks hook (must be declared at top level to obey rules of hooks)
  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return bookings
      .filter((b) => b.assignedTo === currentUser.id)
      .sort((a, b) => new Date(a.deliveryDate || 0).getTime() - new Date(b.deliveryDate || 0).getTime());
  }, [bookings, currentUser?.id]);

  // Download System Backup (JSON)
  const handleDownloadBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      studio: "RSE Post Production House, Gandhinagar",
      version: "Apple Edition 2.0",
      staff,
      attendance,
      leaveRequests,
      bookings,
      clients,
      services,
      holidays,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RSE_OS_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cloud Database (MongoDB) Status & Connect
  const checkDbStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/database-config", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (_) {}
  }, []);

  React.useEffect(() => {
    checkDbStatus();
  }, [checkDbStatus]);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUri = mongoUriInput.trim();
    if (!cleanUri.startsWith("mongodb")) {
      setDbMessage("⚠️ કૃપા કરીને સાચો MongoDB URI દાખલ કરો (mongodb:// અથવા mongodb+srv://)");
      return;
    }
    setIsSavingDb(true);
    setDbMessage(null);
    try {
      const res = await fetch("/api/database-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: cleanUri }),
      });
      const data = await res.json();
      if (data.success) {
        setDbMessage(data.message);
        setMongoUriInput("");
        checkDbStatus();
        syncLiveBookings();
      } else {
        setDbMessage(`❌ ${data.error}`);
      }
    } catch (err: any) {
      setDbMessage(`❌ કનેક્શન ક્ષતિ: ${err?.message || "ચકાસો"}`);
    } finally {
      setIsSavingDb(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // SCREEN 0: INITIAL SESSION CHECK (Prevents login flicker)
  // ─────────────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 font-sans">
        <div className="h-12 w-12 rounded-2xl bg-[#6B2E4C] text-white flex items-center justify-center font-black text-xl shadow-md animate-pulse">
          R
        </div>
        <p className="mt-3 text-xs font-semibold text-[#8E8E93]">RSE | OS લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // SCREEN 1: APPLE-STYLED LOGIN (Strict Email & Password Auth)
  // ─────────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#1C1C1E] flex flex-col justify-between p-4 sm:p-8 pt-8 sm:pt-10 font-sans select-none">
        {/* Header / Brand */}
        <header
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 pl-16 sm:pl-0"
        >
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#6B2E4C] text-white flex items-center justify-center font-black text-lg shadow-md">
              R
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#1C1C1E]">
                RSE | OS
              </span>
              <span className="block text-2xs text-[#8E8E93] font-medium">
                Apple Workstation Edition • Mac & iPhone
              </span>
            </div>
          </div>

          <Link
            href="/book"
            className="text-xs text-[#6B2E4C] font-semibold hover:underline flex items-center space-x-1"
          >
            <span>Booking Portal</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </header>

        {/* Login Center Box */}
        <main
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="max-w-md w-full mx-auto my-auto select-text"
        >
          <div className="apple-glass-card rounded-3xl p-7 sm:p-8 space-y-5 shadow-xl border border-black/[0.06] bg-white/95">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#6B2E4C]/10 text-[#6B2E4C] mb-1">
                <Laptop className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1C1C1E]">
                RSE Studio Login
              </h1>
              <p className="text-xs text-[#8E8E93]">
                તમારો ઈમેઈલ અને પાસવર્ડ નાખીને તમારા ડિવાઇસમાં લોગિન કરો
              </p>
            </div>

            {/* Fixed minimum height feedback container prevents card resize jitter on error */}
            <div className="min-h-[46px] flex items-center">
              {loginError ? (
                <div
                  role="alert"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="leading-snug">{loginError}</span>
                </div>
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA]/70 text-[#636366] text-[11px] flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#6B2E4C] shrink-0" />
                  <span>MongoDB Live Authentication • સુરક્ષિત સ્ટુડિયો લોગિન</span>
                </div>
              )}
            </div>

            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="os-login-email"
                  className="block text-[#3A3A3C] font-semibold mb-1.5 text-2xs uppercase tracking-wider"
                >
                  ઈમેઈલ એડ્રેસ (Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                  <input
                    id="os-login-email"
                    type="email"
                    autoFocus
                    autoComplete="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Keyur@rse-edit.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#D1D1D6] bg-white text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#6B2E4C]/20 focus:border-[#6B2E4C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="os-login-password"
                  className="block text-[#3A3A3C] font-semibold mb-1.5 text-2xs uppercase tracking-wider"
                >
                  પાસવર્ડ (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
                  <input
                    id="os-login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-[#D1D1D6] bg-white text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#6B2E4C]/20 focus:border-[#6B2E4C] transition-colors"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "પાસવર્ડ છુપાવો" : "પાસવર્ડ જુઓ"}
                    aria-pressed={showPassword}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center rounded-r-xl text-[#636366] hover:text-[#1C1C1E] hover:bg-black/[0.04] z-20 cursor-pointer focus:outline-none focus:text-[#6B2E4C]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 pointer-events-none" />
                    ) : (
                      <Eye className="h-4 w-4 pointer-events-none" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-2xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] disabled:opacity-70 transition-colors shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>લોગિન થઈ રહ્યું છે...</span>
                  </>
                ) : (
                  <>
                    <span>લોગિન કરો (Sign In)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice (Zero Demo/Passwordless Quick-Logins) */}
            <div className="pt-3 border-t border-[#E5E5EA] text-center">
              <p className="text-2xs text-[#8E8E93] leading-relaxed">
                એડમિન દ્વારા આપવામાં આવેલ ઈમેઈલ અને પાસવર્ડથી લોગિન કરો. લોગિન થયા પછી તમારી પરમિશન મુજબ જ ડેશબોર્ડ ખૂલશે.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-2xs text-[#8E8E93] py-2">
          RSE Post Production House • Gandhinagar, Gujarat • Connected to Apple Ecosystem
        </footer>
      </div>
    );
  }

  const hasExtendedWorkspace =
    isSuperAdmin ||
    currentPerms.canViewAllBookings ||
    currentPerms.canCreateBooking ||
    currentPerms.canViewPricingAndInvoices ||
    currentPerms.canViewClientsDirectory ||
    currentPerms.canManageStaffAndSalary ||
    currentPerms.canManageSettings;

  const isAdmin = hasExtendedWorkspace;
  const workspaceProjects = currentPerms.canViewAllBookings ? bookings : myTasks;

  // Ensure active tab is permitted for current user
  const effectiveAdminTab: typeof adminTab = (() => {
    if (adminTab === "kanban") return "kanban";
    if (adminTab === "calendar" && currentPerms.canViewAllBookings) return "calendar";
    if (adminTab === "invoices" && currentPerms.canViewPricingAndInvoices) return "invoices";
    if (adminTab === "clients" && currentPerms.canViewClientsDirectory) return "clients";
    if (adminTab === "staff" && currentPerms.canManageStaffAndSalary) return "staff";
    if (adminTab === "leaves" && currentPerms.canManageStaffAndSalary) return "leaves";
    if (adminTab === "settings" && currentPerms.canManageSettings) return "settings";
    if (adminTab === "my_desk" && !isSuperAdmin) return "my_desk";
    return "kanban";
  })();

  // ─────────────────────────────────────────────────────────────────
  // SCREEN 2: LOGGED-IN VIEW (MAC / IPHONE)
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1C1C1E] flex flex-col font-sans">
      <head>
        <title>RSE | OS - Studio Production</title>
        <link rel="manifest" href="/manifest-os.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RSE OS" />
        <link rel="apple-touch-icon" href="/rse-logo.png" />
      </head>
      {/* ── Top Bar (macOS Window Header) ── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-[#E5E5EA] px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Branding & Role (With native traffic light spacing) */}
          <div className="flex items-center space-x-3 pl-2 sm:pl-16">
            <div className="h-8 w-8 rounded-xl bg-[#6B2E4C] text-white flex items-center justify-center font-black text-sm shadow-sm">
              R
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-tight text-[#1C1C1E]">
                  RSE | OS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#6B2E4C]/10 text-[#6B2E4C] text-2xs font-bold uppercase tracking-wider">
                  {isSuperAdmin ? "Super Admin" : currentUser.role}
                </span>
              </div>
              <p className="text-2xs text-[#8E8E93] hidden sm:block">
                {currentUser.name} • Gandhinagar Studio
              </p>
            </div>
          </div>

          {/* Right: Cloud Sync, Add Booking, Punch Status & Logout */}
          <div className="flex items-center space-x-2">

            {/* Live Website Cloud Sync Button (MongoDB Atlas Auto-Sync) */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm flex items-center space-x-1.5 active:scale-95 ${
                isSyncing
                  ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                  : "bg-white hover:bg-[#F8F7F4] text-[#1C1C1E] border-[#D1D1D6]"
              }`}
              title={`MongoDB Atlas લાઈવ કનેક્ટેડ • ઑટો બેકગ્રાઉન્ડ સિન્ક સક્રિય છે${
                lastSyncedAt ? ` • છેલ્લું સિન્ક: ${lastSyncedAt.toLocaleTimeString()}` : ""
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  isSyncing ? "bg-amber-500 animate-ping" : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span className="hidden md:inline font-mono">
                {isSyncing ? "સિન્ક થાય છે..." : "MongoDB લાઇવ"}
              </span>
              <RefreshCw className={`h-3 w-3 text-[#6B2E4C] ${isSyncing ? "animate-spin" : ""}`} />
            </button>

            {/* Quick Add Booking Button (Permission Controlled) */}
            {currentPerms.canCreateBooking && (
              <button
                onClick={openNewBookingModal}
                className="px-3.5 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold hover:bg-[#58243E] transition shadow-sm flex items-center space-x-1.5 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">+ નવું બુકિંગ ઉમેરો</span>
                <span className="sm:hidden">+ બુકિંગ</span>
              </button>
            )}

            {/* Quick Punch In/Out button for Staff (All non-super-admins) */}
            {!isSuperAdmin && (
              todayRecord?.punchOut ? (
                <span className="badge bg-[#E5E5EA] text-[#8E8E93] border border-[#D1D1D6] text-2xs px-2 py-1 rounded-lg">
                  Shift Done
                </span>
              ) : todayRecord ? (
                <button
                  onClick={punchOut}
                  className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 text-2xs font-semibold hover:bg-red-100 transition active:scale-95"
                >
                  Punch Out
                </button>
              ) : (
                <button
                  onClick={() => punchIn("mac")}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-2xs font-bold hover:bg-emerald-100 transition active:scale-95 flex items-center space-x-1"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Punch In</span>
                </button>
              )
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-xl text-[#8E8E93] hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notice for Live Cloud Sync */}
      {syncNotice && (
        <div className="fixed top-14 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#1C1C1E] text-white text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-fadeIn border border-white/10">
          <span>{syncNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADMIN MASTER SUITE (Keyur Rao / Nirali Dhorajiya)
      ───────────────────────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-6 space-y-4">
          {/* Mobile Safari Standalone App Install Banner */}
          {showIosInstallPrompt && (
            <div className="md:hidden bg-[#6B2E4C] text-white p-3 rounded-2xl shadow-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="h-5 w-5 shrink-0 text-amber-200" />
                <div>
                  <p className="font-bold">અસલી iPhone એપ તરીકે ઇન્સ્ટોલ કરો</p>
                  <p className="text-2xs text-white/85">
                    નીચે <strong>Share (⎋)</strong> દબાવી <strong>&quot;Add to Home Screen&quot;</strong> પસંદ કરો
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowIosInstallPrompt(false);
                  localStorage.setItem("rse_ios_banner_dismissed", "1");
                }}
                className="px-2 py-1 rounded-lg bg-white/15 text-2xs font-bold shrink-0"
              >
                ✕
              </button>
            </div>
          )}
          {/* ── Production Health & KPI Banner ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-2xs text-[#8E8E93] font-semibold uppercase block">કુલ પ્રોજેક્ટ્સ</span>
                <span className="text-xl font-black text-[#1C1C1E]">{workspaceProjects.length}</span>
              </div>
              <span className="h-9 w-9 rounded-xl bg-[#6B2E4C]/10 text-[#6B2E4C] flex items-center justify-center font-bold text-sm">
                🎞️
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-2xs text-[#8E8E93] font-semibold uppercase block">ચાલુ એડિટિંગ</span>
                <span className="text-xl font-black text-[#6B2E4C]">
                  {workspaceProjects.filter(b => b.status === "in_selection_cut" || b.status === "in_edit_polish" || b.status === "in_revision").length}
                </span>
              </div>
              <span className="h-9 w-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                🎬
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-2xs text-[#8E8E93] font-semibold uppercase block">ડેટા/ફૂટેજ બાકી</span>
                <span className="text-xl font-black text-amber-700">
                  {workspaceProjects.filter(b => b.status === "awaiting_footage").length}
                </span>
              </div>
              <span className="h-9 w-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                ⏳
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-[#E5E5EA] shadow-xs flex items-center justify-between">
              <div>
                <span className="text-2xs text-[#8E8E93] font-semibold uppercase block">ડિલિવર થયેલ</span>
                <span className="text-xl font-black text-emerald-700">
                  {workspaceProjects.filter(b => b.status === "delivered_done").length}
                </span>
              </div>
              <span className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                ✅
              </span>
            </div>
          </div>

          {/* ── Top Workspace Navigation Tabs (Permission Controlled) ── */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 border-b border-[#E5E5EA] text-xs font-semibold scrollbar-none">
            <button
              onClick={() => setAdminTab("kanban")}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                effectiveAdminTab === "kanban"
                  ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                  : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>📋 પ્રોડક્શન કાનબાન</span>
              <span className="ml-1 text-2xs px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                {workspaceProjects.length}
              </span>
            </button>
            {currentPerms.canViewAllBookings && (
              <button
                onClick={() => setAdminTab("calendar")}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                  effectiveAdminTab === "calendar"
                    ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                    : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>📅 તમામ બુકિંગ્સ & સ્લોટ્સ</span>
              </button>
            )}
            {currentPerms.canViewPricingAndInvoices && (
              <button
                onClick={() => setAdminTab("invoices")}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                  effectiveAdminTab === "invoices"
                    ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                    : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>🧾 ઇન્વોઇસ & બિલિંગ આર્કાઇવ</span>
                {invoices.length > 0 && (
                  <span className="ml-1 text-2xs px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                    {invoices.length}
                  </span>
                )}
              </button>
            )}
            {currentPerms.canViewClientsDirectory && (
              <button
                onClick={() => setAdminTab("clients")}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                  effectiveAdminTab === "clients"
                    ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                    : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>📇 ક્લાયન્ટ્સ ({clients.length})</span>
              </button>
            )}
            {currentPerms.canManageStaffAndSalary && (
              <>
                <button
                  onClick={() => setAdminTab("staff")}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                    effectiveAdminTab === "staff"
                      ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                      : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>👥 એડિટર્સ & ટીમ ({staff.length})</span>
                </button>
                <button
                  onClick={() => setAdminTab("leaves")}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                    effectiveAdminTab === "leaves"
                      ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                      : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>🏖️ રજા અરજીઓ</span>
                  {leaveRequests.filter((l) => l.status === "pending").length > 0 && (
                    <span className="ml-1 text-2xs px-1.5 py-0.2 rounded-full bg-amber-400 text-[#6B2E4C] font-black">
                      {leaveRequests.filter((l) => l.status === "pending").length}
                    </span>
                  )}
                </button>
              </>
            )}
            {currentPerms.canManageSettings && (
              <button
                onClick={() => setAdminTab("settings")}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                  effectiveAdminTab === "settings"
                    ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                    : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>⚙️ બેકઅપ & સેટિંગ્સ</span>
              </button>
            )}
            {!isSuperAdmin && (
              <button
                onClick={() => setAdminTab("my_desk")}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition flex items-center space-x-1.5 ${
                  effectiveAdminTab === "my_desk"
                    ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                    : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>👤 મારી રજા & પગાર</span>
              </button>
            )}
          </nav>

          {/* ── TAB 2: 8-STAGE KANBAN ── */}
          {effectiveAdminTab === "kanban" && (
            <div className="space-y-3 animate-fadeIn">
              {/* Search & Region Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <div className="bg-[#E5E5EA] p-0.5 rounded-xl flex items-center text-xs">
                    <button
                      onClick={() => setRegionFilter("all")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        regionFilter === "all" ? "bg-white font-bold text-[#1C1C1E] shadow-sm" : "text-[#8E8E93]"
                      }`}
                    >
                      બધા ({workspaceProjects.length})
                    </button>
                    <button
                      onClick={() => setRegionFilter("indian")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        regionFilter === "indian"
                          ? "bg-white font-bold text-[#1C1C1E] shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      🇮🇳 ઇન્ડિયન ({workspaceProjects.filter((b) => b.region === "indian").length})
                    </button>
                    <button
                      onClick={() => setRegionFilter("foreign")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        regionFilter === "foreign"
                          ? "bg-white font-bold text-[#1C1C1E] shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      🌍 ફોરેન ({workspaceProjects.filter((b) => b.region === "foreign").length})
                    </button>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8E8E93]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="કપલ, સ્ટુડિયો, કોડ શોધો... (Cmd+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
              </div>

              {/* ── Feature 6: Editor Workload & Capacity Meter (Admin / All Bookings Permission Only) ── */}
              {currentPerms.canViewAllBookings && (
              <div className="bg-white p-3 rounded-2xl border border-[#E5E5EA] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#1C1C1E] flex items-center space-x-1.5">
                      <span>👥</span>
                      <span>એડિટર વાઇઝ વર્કલોડ (Editor Capacity Meter)</span>
                    </span>
                    <span className="text-2xs text-[#8E8E93] hidden sm:inline">
                      (એડિટર પર ક્લિક કરીને તેમના પ્રોજેક્ટ્સ ફિલ્ટર કરો)
                    </span>
                  </div>
                  {selectedEditorFilter && (
                    <button
                      onClick={() => setSelectedEditorFilter(null)}
                      className="text-2xs font-bold text-[#6B2E4C] hover:underline flex items-center space-x-1 bg-[#6B2E4C]/10 px-2 py-0.5 rounded-lg"
                    >
                      <span>બધા દર્શાવો (Clear Filter) ✕</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                  {/* All button */}
                  <button
                    onClick={() => setSelectedEditorFilter(null)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                      selectedEditorFilter === null
                        ? "bg-[#6B2E4C] text-white border-[#6B2E4C] shadow-xs"
                        : "bg-[#F8F7F4] text-[#1C1C1E] border-[#E5E5EA] hover:border-[#6B2E4C]/40"
                    }`}
                  >
                    <span>સમગ્ર ટીમ ({bookings.filter((b) => b.status !== "delivered_done").length})</span>
                  </button>

                  {staff
                    .filter((s) => s.role === "editor" || s.role === "admin")
                    .map((member) => {
                      const activeCount = bookings.filter(
                        (b) => b.assignedTo === member.id && b.status !== "delivered_done"
                      ).length;
                      const isSelected = selectedEditorFilter === member.id;

                      let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                      let statusEmoji = "🟢";
                      if (activeCount >= 5) {
                        badgeColor = "bg-red-100 text-red-800 border-red-200";
                        statusEmoji = "🔴";
                      } else if (activeCount >= 3) {
                        badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                        statusEmoji = "🟡";
                      }

                      return (
                        <button
                          key={member.id}
                          onClick={() => setSelectedEditorFilter(isSelected ? null : member.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs transition whitespace-nowrap flex items-center space-x-2 ${
                            isSelected
                              ? "bg-[#6B2E4C]/10 border-[#6B2E4C] text-[#6B2E4C] font-black ring-2 ring-[#6B2E4C]/20"
                              : "bg-white text-[#1C1C1E] border-[#E5E5EA] hover:border-[#6B2E4C]/40 font-semibold"
                          }`}
                        >
                          <span className="truncate max-w-[100px]">{member.name.split(" ")[0]}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-md font-mono font-bold text-2xs border ${badgeColor}`}
                          >
                            {statusEmoji} {activeCount}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
              )}

              {/* 8-Stage Horizontal Scrollable Kanban Columns with Native HTML5 Drag & Drop */}
              <div className="flex space-x-3.5 overflow-x-auto pb-4 select-text">
                {STAGES.map((stage) => {
                  // Strictly sort cards in each column chronologically by slotDate ascending
                  const stageItems = filteredBookings
                    .filter((b) => b.status === stage.id)
                    .sort((a, b) => new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime());

                  const isColumnActiveTarget = dragOverStageId === stage.id;

                  return (
                    <div
                      key={stage.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverStageId !== stage.id) {
                          setDragOverStageId(stage.id);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget === e.target) {
                          setDragOverStageId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const droppedId = e.dataTransfer.getData("text/plain") || draggedBookingId;
                        if (droppedId) {
                          updateBookingStatus(droppedId, stage.id);
                        }
                        setDragOverStageId(null);
                        setDraggedBookingId(null);
                      }}
                      className={`rounded-2xl border transition-all duration-150 p-3 space-y-2.5 min-w-[290px] max-w-[290px] min-h-[600px] flex flex-col shrink-0 ${
                        isColumnActiveTarget
                          ? "bg-[#6B2E4C]/10 border-2 border-dashed border-[#6B2E4C] shadow-lg scale-[1.01]"
                          : "bg-[#EFEFEA]/80 border-[#E5E5EA]"
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#E5E5EA]">
                        <div>
                          <span className="text-xs font-bold text-[#1C1C1E] block leading-tight">
                            {stage.stepNum}. {stage.label}
                          </span>
                          <span className="text-2xs text-[#8E8E93]">{stage.description}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${stage.countColor}`}>
                          {stageItems.length}
                        </span>
                      </div>

                      {/* Drop Target Indicator when dragging */}
                      {isColumnActiveTarget && (
                        <div className="p-3 rounded-xl border-2 border-dashed border-[#6B2E4C] bg-white text-center text-xs font-bold text-[#6B2E4C] animate-pulse">
                          📥 અહીં મૂકો (Drop to move)
                        </div>
                      )}

                      {/* Cards Container */}
                      <div className="space-y-2.5 flex-1">
                        {stageItems.length === 0 ? (
                          <div className="h-28 rounded-xl border border-dashed border-[#D1D1D6] flex items-center justify-center text-2xs text-[#8E8E93]">
                            કોઈ પ્રોજેક્ટ નથી (ડ્રેગ કરીને અહીં મૂકી શકો છો)
                          </div>
                        ) : (
                          stageItems.map((item) => {
                            const assignedMember = staff.find((s) => s.id === item.assignedTo);
                            const isFootageDelayed =
                              item.status === "awaiting_footage" &&
                              new Date(item.slotDate) <= new Date();
                            const isLabhPancham = item.offerType === "labh_pancham_2026";
                            const isCurrentlyDragged = draggedBookingId === item.id;
                            const dateInfo = getDateStatus(item.slotDate, item.deliveryDate);

                            return (
                              <div
                                key={item.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("text/plain", item.id);
                                  e.dataTransfer.effectAllowed = "move";
                                  setDraggedBookingId(item.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedBookingId(null);
                                  setDragOverStageId(null);
                                }}
                                onClick={() => setSelectedBookingForDetails(item)}
                                className={`apple-glass-card p-3 rounded-2xl space-y-2 cursor-pointer active:cursor-grabbing transition shadow-xs ${
                                  isLabhPancham
                                    ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 shadow-[0_4px_16px_rgba(245,158,11,0.22)] hover:border-amber-500 hover:shadow-md"
                                    : isFootageDelayed
                                    ? "border-red-400 bg-red-50/40 hover:border-[#6B2E4C]/60 hover:shadow-md"
                                    : "bg-white hover:border-[#6B2E4C]/60 hover:shadow-md"
                                } ${
                                  isCurrentlyDragged
                                    ? "opacity-30 scale-95 border-2 border-dashed border-[#6B2E4C]"
                                    : ""
                                }`}
                              >
                                {/* Header: Code + Revision Pill + SSD Badge + Quick Edit */}
                                <div className="flex items-center justify-between text-2xs">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-mono font-bold text-[#6B2E4C] text-xs">
                                      {item.code}
                                    </span>
                                    {/* Revision Pill */}
                                    {item.revisionRound && item.revisionRound > 0 ? (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-md text-2xs font-bold border ${
                                          item.revisionRound === 1
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : item.revisionRound === 2
                                            ? "bg-purple-50 text-purple-800 border-purple-200"
                                            : "bg-red-50 text-red-800 border-red-200"
                                        }`}
                                        title={`રિવિઝન રાઉન્ડ #${item.revisionRound}`}
                                      >
                                        🔄 Rev {item.revisionRound}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded-md bg-[#F2F2F7] text-[#8E8E93] text-2xs font-mono font-semibold">
                                        v1
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    {/* SSD Physical Status Badge (if courier) */}
                                    {item.deliveryMethod === "courier" && (
                                      <span
                                        className={`px-1.5 py-0.2 rounded-md text-2xs font-bold flex items-center border ${
                                          item.ssdStatus === "received"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : item.ssdStatus === "in_transit"
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : item.ssdStatus === "dispatched_back"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                        }`}
                                        title={`SSD કુરિયર સ્ટેટસ: ${item.ssdStatus || "બાકી"}`}
                                      >
                                        {item.ssdStatus === "received" ? (
                                          "💾 આવી ગઈ"
                                        ) : item.ssdStatus === "in_transit" ? (
                                          "🚚 રસ્તામાં"
                                        ) : item.ssdStatus === "dispatched_back" ? (
                                          "📦 રવાના"
                                        ) : (
                                          "⏳ બાકી"
                                        )}
                                      </span>
                                    )}

                                    {/* Quick Edit Pen */}
                                    {currentPerms.canEditBooking && (
                                      <button
                                        type="button"
                                        title="કાર્ડ વિગતો એડિટ કરો"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedBookingForDetails(item);
                                          startEditingBooking(item);
                                        }}
                                        className="p-1 rounded-md bg-[#6B2E4C]/10 hover:bg-[#6B2E4C] text-[#6B2E4C] hover:text-white transition flex items-center"
                                      >
                                        <Edit2 className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Labh Pancham Festive Badge */}
                                {isLabhPancham && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/60 text-2xs font-bold text-amber-950 shadow-xs">
                                      <span className="flex items-center space-x-1">
                                        <span className="text-xs animate-pulse">🪔</span>
                                        <span>લાભ પાંચમ (15% OFF)</span>
                                      </span>
                                      {item.pricing?.advancePaid ? (
                                        <span className="font-mono text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md border border-emerald-300">
                                          ✓ કન્ફર્મ
                                        </span>
                                      ) : (
                                        <span className="font-mono text-2xs font-extrabold text-red-800 bg-red-100 px-1.5 py-0.2 rounded-md border border-red-300">
                                          ⚠️ પેમેન્ટ બાકી
                                        </span>
                                      )}
                                    </div>

                                    {/* 1-Click Admin Verify Advance (Only when Pricing & Billing permitted) */}
                                    {currentPerms.canViewPricingAndInvoices && !item.pricing?.advancePaid && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateBooking({
                                            ...item,
                                            pricing: {
                                              ...item.pricing,
                                              advancePaid: true,
                                            },
                                            notes: `${item.notes || ""} | [✓ ₹1,000 પેમેન્ટ વેરિફાય & સ્લોટ કન્ફર્મ]`,
                                          });
                                        }}
                                        className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-2xs shadow-xs transition flex items-center justify-center space-x-1"
                                        title="WhatsApp સ્ક્રીનશૉટ જોઈને ₹1,000 પેમેન્ટ મંજૂર કરો"
                                      >
                                        <span>✓ ₹1,000 મળ્યા (કન્ફર્મ)</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Body: Couple Names & Studio */}
                                <div>
                                  <h4 className="text-xs font-bold text-[#1C1C1E] leading-snug line-clamp-1">
                                    {item.coupleNames}
                                  </h4>
                                  <p className="text-2xs text-[#8E8E93] truncate">{item.studioOrClient}</p>
                                </div>

                                {/* Delivery Target Date with Status Badge */}
                                <div className="flex items-center justify-between text-2xs pt-0.5">
                                  <div className="flex items-center space-x-1 text-[#8E8E93]">
                                    <span>📅</span>
                                    <span className="font-mono font-bold text-[#1C1C1E]">{item.deliveryDate}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-md border text-2xs font-semibold ${dateInfo.badge}`}>
                                    {dateInfo.label}
                                  </span>
                                </div>

                                {/* Footer: Editor + 1-Click WhatsApp + Advance Stage */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-[#F2F2F7] text-2xs">
                                  <span className="text-[#3A3A3C] font-semibold truncate max-w-[90px] text-2xs flex items-center space-x-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#6B2E4C]" />
                                    <span>{assignedMember ? assignedMember.name.split(" ")[0] : "અનસાઇન્ડ"}</span>
                                  </span>

                                  <div className="flex items-center space-x-1">
                                    {/* 1-Click Invoice / Bill Generator (Permission gated) */}
                                    {currentPerms.canViewPricingAndInvoices && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setInvoiceModalBooking(item);
                                        }}
                                        className="px-1.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-600 text-purple-800 hover:text-white transition text-2xs font-bold flex items-center space-x-0.5 border border-purple-200"
                                        title="આ પ્રોજેક્ટનું સત્તાવાર બિલ / ઇન્વોઇસ બનાવો"
                                      >
                                        <FileText className="h-2.5 w-2.5" />
                                        <span>બિલ</span>
                                      </button>
                                    )}

                                    {/* 1-Click WhatsApp Quick Action (Permission gated) */}
                                    {currentPerms.canViewClientContacts && item.phone && (
                                      <a
                                        href={getWhatsAppUrl(item.phone, getWhatsAppStageMessage(item))}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition text-2xs font-bold flex items-center space-x-0.5 border border-emerald-200"
                                        title={`૧-ક્લિક વોટ્સએપ અપડેટ મોકલો (${stage.label})`}
                                      >
                                        <Phone className="h-2.5 w-2.5" />
                                        <span>WA</span>
                                      </a>
                                    )}

                                    {/* Stage Advance Arrow */}
                                    {stage.id !== "delivered_done" ? (
                                      <button
                                        type="button"
                                        title="આગલા સ્ટેજમાં ખસેડો"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const idx = STAGES.findIndex((s) => s.id === stage.id);
                                          if (idx < STAGES.length - 1) updateBookingStatus(item.id, STAGES[idx + 1].id);
                                        }}
                                        className="p-1 rounded-md bg-[#6B2E4C]/10 hover:bg-[#6B2E4C] text-[#6B2E4C] hover:text-white font-bold transition flex items-center"
                                      >
                                        <ChevronRight className="h-3 w-3" />
                                      </button>
                                    ) : (
                                      <span className="text-emerald-700 font-bold text-2xs">✓ પૂર્ણ</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 2: COMPLETE BOOKINGS & SLOTS REGISTER ── */}
          {effectiveAdminTab === "calendar" && currentPerms.canViewAllBookings && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header & Filter Controls */}
              <div className="apple-glass-card rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5E5EA] pb-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1C1C1E] flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-[#6B2E4C]" />
                      <span>તમામ બુકિંગ્સ અને સ્લોટ્સ રજિસ્ટર</span>
                    </h3>
                    <p className="text-xs text-[#8E8E93]">
                      લાઈવ વેબસાઇટ અને સ્ટુડિયોમાંથી બુક થયેલા તમામ કામનું લિસ્ટ • સ્લોટ તારીખ મુજબ
                    </p>
                  </div>
                  {currentPerms.canCreateBooking && (
                    <button
                      onClick={openNewBookingModal}
                      className="px-3.5 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold hover:bg-[#58243E] transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ નવું બુકિંગ ઉમેરો</span>
                    </button>
                  )}
                </div>

                {/* Filters & Search Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Status Filter Chips */}
                  <div className="bg-[#E5E5EA] p-0.5 rounded-xl flex items-center text-xs overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => setBookingStatusFilter("all")}
                      className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                        bookingStatusFilter === "all"
                          ? "bg-white font-bold text-[#1C1C1E] shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      બધા ({bookings.length})
                    </button>
                    <button
                      onClick={() => setBookingStatusFilter("urgent")}
                      className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                        bookingStatusFilter === "urgent"
                          ? "bg-white font-bold text-red-700 shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      🔴 આજે/આવતીકાલે
                    </button>
                    <button
                      onClick={() => setBookingStatusFilter("active")}
                      className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                        bookingStatusFilter === "active"
                          ? "bg-white font-bold text-[#6B2E4C] shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      🎬 ચાલુ કામ
                    </button>
                    <button
                      onClick={() => setBookingStatusFilter("awaiting")}
                      className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                        bookingStatusFilter === "awaiting"
                          ? "bg-white font-bold text-amber-800 shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      ⏳ ડેટા બાકી
                    </button>
                    <button
                      onClick={() => setBookingStatusFilter("done")}
                      className={`px-3 py-1 rounded-lg transition whitespace-nowrap ${
                        bookingStatusFilter === "done"
                          ? "bg-white font-bold text-emerald-800 shadow-sm"
                          : "text-[#8E8E93]"
                      }`}
                    >
                      ✅ પૂર્ણ
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#8E8E93]" />
                    <input
                      type="text"
                      placeholder="કપલ, સ્ટુડિયો, કોડ કે ફોન શોધો..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                </div>

                {/* Table for Desktop / Tablet */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F7F4] text-[#8E8E93] border-b border-[#E5E5EA] text-2xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">સ્લોટ તારીખ</th>
                        <th className="px-3 py-2.5">કોડ & કપલ</th>
                        {currentPerms.canViewClientContacts && (
                          <th className="px-3 py-2.5">સંપર્ક / WhatsApp</th>
                        )}
                        <th className="px-3 py-2.5">પેકેજ & ફૂટેજ</th>
                        <th className="px-3 py-2.5">સોંપાયેલ એડિટર</th>
                        <th className="px-3 py-2.5">પાઇપલાઇન સ્ટેજ</th>
                        <th className="px-3 py-2.5">ડિલિવરી ટાર્ગેટ</th>
                        {currentPerms.canViewPricingAndInvoices && (
                          <th className="px-3 py-2.5">પેમેન્ટ</th>
                        )}
                        <th className="px-3 py-2.5 text-right">વિગતો</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5EA]">
                      {filteredCalendarBookings.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-[#8E8E93]">
                            કોઈ બુકિંગ મળ્યું નથી.
                          </td>
                        </tr>
                      ) : (
                        filteredCalendarBookings.map((b) => {
                          const dateInfo = getDateStatus(b.slotDate, b.deliveryDate);
                          const isLabhPancham = b.offerType === "labh_pancham_2026";
                          return (
                            <tr
                              key={b.id}
                              className={`transition ${
                                isLabhPancham
                                  ? "bg-amber-50/60 hover:bg-amber-100/60 border-l-4 border-amber-400"
                                  : "hover:bg-[#F8F7F4]/60"
                              }`}
                            >
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-lg border text-2xs font-semibold ${dateInfo.badge}`}>
                                  {dateInfo.label}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-mono font-bold text-[#6B2E4C] text-2xs">{b.code}</span>
                                  {isLabhPancham && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold text-2xs">
                                      🪔 મુહૂર્ત 15% OFF
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-[#1C1C1E]">{b.coupleNames}</p>
                                <p className="text-2xs text-[#8E8E93] truncate max-w-[140px]">{b.studioOrClient}</p>
                              </td>
                              {currentPerms.canViewClientContacts && (
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <p className="text-2xs font-mono text-[#3A3A3C]">{b.phone || "-"}</p>
                                  <a
                                    href={`https://wa.me/${(b.phone || "").replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1 text-2xs font-bold text-emerald-700 hover:underline pt-0.5"
                                  >
                                    <Phone className="h-2.5 w-2.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                </td>
                              )}
                              <td className="px-3 py-2.5">
                                <p className="text-2xs font-medium text-[#1C1C1E] truncate max-w-[150px]">{b.packageType || "સ્ટાન્ડર્ડ"}</p>
                                {b.rawLink ? (
                                  <a
                                    href={b.rawLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center space-x-1 text-2xs text-[#6B2E4C] font-bold hover:underline"
                                  >
                                    <HardDrive className="h-2.5 w-2.5" />
                                    <span>ગૂગલ ડ્રાઇવ ↗</span>
                                  </a>
                                ) : (
                                  <span className="text-2xs text-amber-700 font-semibold">ડેટા પેન્ડિંગ</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <select
                                  value={b.assignedTo || ""}
                                  onChange={(e) => assignBooking(b.id, e.target.value)}
                                  className="px-2 py-1 rounded-lg border border-[#D1D1D6] bg-white text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                                >
                                  <option value="">⚠️ બિનસોંપાયેલ</option>
                                  {staff
                                    .filter((s) => s.role === "editor" || s.role === "admin")
                                    .map((ed) => (
                                      <option key={ed.id} value={ed.id}>
                                        👤 {ed.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <select
                                  value={b.status}
                                  onChange={(e) => updateBookingStatus(b.id, e.target.value as any)}
                                  className="px-2 py-1 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold text-[#6B2E4C] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.stepNum}. {s.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap font-mono text-2xs font-bold text-[#6B2E4C]">
                                {b.deliveryDate || "-"}
                              </td>
                              {currentPerms.canViewPricingAndInvoices && (
                                <td className="px-3 py-2.5 whitespace-nowrap text-2xs">
                                  <span className="block font-mono font-bold text-[#1C1C1E]">
                                    ₹{(b.pricing?.totalAmount || 0).toLocaleString("en-IN")}
                                  </span>
                                  {isLabhPancham ? (
                                    b.pricing?.advancePaid ? (
                                      <span className="inline-block px-1.5 py-0.2 rounded text-2xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                                        ✓ ₹1,000 કન્ફર્મ
                                      </span>
                                    ) : (
                                      <span className="inline-block px-1.5 py-0.2 rounded text-2xs bg-red-100 text-red-900 border border-red-300 font-bold">
                                        ⚠️ ₹1,000 પેમેન્ટ બાકી
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.2 rounded text-2xs bg-emerald-100 text-emerald-800 font-semibold">
                                      ૫૦% એડવાન્સ ✓
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="px-3 py-2.5 whitespace-nowrap text-right space-x-1.5">
                                <button
                                  onClick={() => setSelectedBookingForDetails(b)}
                                  className="px-2 py-1 rounded-lg bg-[#E5E5EA] hover:bg-[#D1D1D6] text-[#1C1C1E] text-2xs font-bold"
                                >
                                  વિગતો
                                </button>
                                {(currentPerms.canViewPricingAndInvoices || currentPerms.canEditBooking) && (
                                  <div className="inline-flex items-center space-x-1">
                                    {currentPerms.canViewPricingAndInvoices && (
                                      <button
                                        onClick={() => setInvoiceModalBooking(b)}
                                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold inline-flex items-center space-x-1"
                                        title="આ પ્રોજેક્ટનું સત્તાવાર બિલ / ઇન્વોઇસ બનાવો"
                                      >
                                        <FileText className="h-2.5 w-2.5" />
                                        <span>બિલ</span>
                                      </button>
                                    )}
                                    {currentPerms.canEditBooking && (
                                      <button
                                        onClick={() => {
                                          setSelectedBookingForDetails(b);
                                          startEditingBooking(b);
                                        }}
                                        className="px-2 py-1 rounded-lg bg-[#6B2E4C] hover:bg-[#58243E] text-white text-2xs font-bold inline-flex items-center space-x-1"
                                      >
                                        <Edit2 className="h-2.5 w-2.5" />
                                        <span>એડિટ</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: INVOICES & BILLING ARCHIVE (વર્ષો સુધી સુરક્ષિત ક્લાઉડ આર્કાઇવ) ── */}
          {effectiveAdminTab === "invoices" && currentPerms.canViewPricingAndInvoices && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E5EA] pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E] flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-[#6B2E4C]" />
                    <span>સત્તાવાર ઇન્વોઇસ & બિલિંગ આર્કાઇવ (10+ Years Cloud Invoices)</span>
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    MongoDB Atlas ક્લાઉડમાં કાયમ માટે સચવાયેલા تمام બિલ, ૫૦% એડવાન્સ, બાકી રકમ અને PDF ડાઉનલોડ
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setInvoiceModalBooking(null);
                      setShowNewInvoiceModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white text-xs font-bold transition flex items-center space-x-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ નવું ઇન્વોઇસ બનાવો</span>
                  </button>
                </div>
              </div>

              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xs font-bold text-purple-700 uppercase">કુલ બિલિંગ (Total Invoiced)</span>
                    <div className="text-lg font-mono font-extrabold text-purple-900">
                      ₹{invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="text-xl">🧾</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xs font-bold text-emerald-700 uppercase">મળેલ ૫૦% એડવાન્સ (Collected)</span>
                    <div className="text-lg font-mono font-extrabold text-emerald-900">
                      ₹{invoices.reduce((acc, i) => acc + (i.advancePaid || 0), 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="text-xl">💰</span>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                  <div>
                    <span className="text-2xs font-bold text-amber-700 uppercase">બાકી રકમ (Balance Due)</span>
                    <div className="text-lg font-mono font-extrabold text-amber-900">
                      ₹{invoices.reduce((acc, i) => acc + (i.balanceDue || 0), 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <span className="text-xl">⏳</span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="h-3.5 w-3.5 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="ક્લાયન્ટ નામ, સ્ટુડિયો, કે બિલ નં. થી શોધો..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div className="flex items-center space-x-1 overflow-x-auto text-2xs font-bold">
                  {(["all", "paid", "partially_paid", "unpaid"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setInvoiceStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        invoiceStatusFilter === st
                          ? "bg-[#6B2E4C] text-white"
                          : "bg-white border border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E]"
                      }`}
                    >
                      {st === "all" && "બધા"}
                      {st === "paid" && "ચુકવેલ (Paid)"}
                      {st === "partially_paid" && "૫૦% એડવાન્સ (Partial)"}
                      {st === "unpaid" && "બાકી (Unpaid)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoices List Table */}
              <div className="overflow-x-auto border border-[#E5E5EA] rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7F4] text-[#8E8E93] text-2xs uppercase border-b border-[#E5E5EA]">
                    <tr>
                      <th className="px-3 py-2 font-bold">ઇન્વોઇસ નં. & તારીખ</th>
                      <th className="px-3 py-2 font-bold">ક્લાયન્ટ / સ્ટુડિયો</th>
                      <th className="px-3 py-2 font-bold">સર્વિસ / વિગત</th>
                      <th className="px-3 py-2 font-bold text-right">કુલ રકમ</th>
                      <th className="px-3 py-2 font-bold text-right">એડવાન્સ</th>
                      <th className="px-3 py-2 font-bold text-right">બાકી રકમ</th>
                      <th className="px-3 py-2 font-bold text-center">સ્ટેટસ</th>
                      <th className="px-3 py-2 font-bold text-center">એક્શન્સ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {invoices
                      .filter((inv) => {
                        if (invoiceStatusFilter !== "all" && inv.status !== invoiceStatusFilter) return false;
                        if (!invoiceSearchQuery.trim()) return true;
                        const q = invoiceSearchQuery.toLowerCase();
                        return (
                          inv.invoiceNumber.toLowerCase().includes(q) ||
                          inv.clientName.toLowerCase().includes(q) ||
                          (inv.studioName && inv.studioName.toLowerCase().includes(q)) ||
                          (inv.bookingCode && inv.bookingCode.toLowerCase().includes(q))
                        );
                      })
                      .map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#F8F7F4]/80 transition">
                          <td className="px-3 py-2 font-mono font-bold text-[#6B2E4C]">
                            <div>{inv.invoiceNumber}</div>
                            <div className="text-2xs text-[#8E8E93] font-normal">{inv.issueDate}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-bold text-[#1C1C1E]">{inv.clientName}</div>
                            {inv.studioName && (
                              <div className="text-2xs text-[#8E8E93]">{inv.studioName}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-[#3A3A3C]">
                            {inv.items && inv.items.length > 0 ? (
                              <div>
                                <span className="font-medium">{inv.items[0].description}</span>
                                {inv.items[0].duration && (
                                  <span className="ml-1 text-2xs text-[#6B2E4C] font-mono font-bold">
                                    ({inv.items[0].duration})
                                  </span>
                                )}
                                {inv.items.length > 1 && (
                                  <span className="text-2xs text-[#8E8E93] ml-1">
                                    +{inv.items.length - 1} વધુ
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8E8E93]">વિડિયો એડિટિંગ સર્વિસ</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-[#1C1C1E] text-right">
                            ₹{inv.totalAmount?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className="px-3 py-2 font-mono text-emerald-700 text-right">
                            ₹{inv.advancePaid?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-amber-700 text-right">
                            ₹{inv.balanceDue?.toLocaleString("en-IN") || 0}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase inline-block ${
                                inv.status === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : inv.status === "partially_paid"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {inv.status === "paid"
                                ? "ચુકવેલ (Paid)"
                                : inv.status === "partially_paid"
                                ? "૫૦% એડવાન્સ"
                                : "બાકી (Unpaid)"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => setSelectedInvoiceForView(inv)}
                                className="px-2 py-1 rounded-lg bg-[#6B2E4C] hover:bg-[#58243E] text-white text-2xs font-bold inline-flex items-center space-x-1"
                                title="સંપૂર્ણ સત્તાવાર બિલ જુઓ અને PDF સેવ કરો"
                              >
                                <Printer className="h-2.5 w-2.5" />
                                <span>PDF</span>
                              </button>
                              {inv.phone && (
                                <a
                                  href={`https://wa.me/${inv.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                    `નમસ્તે ${inv.clientName},\nRSE પોસ્ટ પ્રોડક્શન તરફથી ઇન્વોઇસ #${inv.invoiceNumber}:\nકુલ રકમ: ₹${inv.totalAmount}\nમળેલ એડવાન્સ: ₹${inv.advancePaid}\nબાકી રકમ: ₹${inv.balanceDue}\nથેન્ક યુ! - RSE Studio`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-2xs font-bold"
                                  title="WhatsApp પર મોકલો"
                                >
                                  WA
                                </a>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm(`શું તમે ઇન્વોઇસ ${inv.invoiceNumber} ડીલીટ કરવા માંગો છો?`)) {
                                    deleteInvoice(inv.id);
                                  }
                                }}
                                className="px-1.5 py-1 text-red-500 hover:text-red-700 text-xs"
                                title="ડીલીટ"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#8E8E93]">
                          <FileText className="h-8 w-8 text-[#D1D1D6] mx-auto mb-2" />
                          <p className="font-bold text-xs">હજુ સુધી કોઈ ઇન્વોઇસ બનાવવામાં આવ્યું નથી</p>
                          <p className="text-2xs text-[#8E8E93] mt-1">
                            તમે "+ નવું ઇન્વોઇસ બનાવો" અથવા કાનબાન બોર્ડ પરથી સીધું જ બિલ જનરેટ કરી શકો છો.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {effectiveAdminTab === "staff" && currentPerms.canManageStaffAndSalary && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E5E5EA] pb-3 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    સ્ટુડિયો સ્ટાફ, પરમિશન અને પેરોલ રજિસ્ટર (Master Payroll & Access Control)
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    નવા એમ્પ્લોયી ઉમેરો, કોને કઈ સ્ક્રીન દેખાવી જોઈએ તેની પરમિશન સેટ કરો, હાજરી અને પે-સ્લિપ
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-[#6B2E4C] bg-[#6B2E4C]/10 px-3 py-1 rounded-xl border border-[#6B2E4C]/20">
                    Monthly Payroll: ₹
                    {staff.reduce((acc, s) => acc + s.baseSalary, 0).toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => {
                      setNewStaffRole("editor");
                      setNewStaffPermissions(getRoleDefaultPermissions("editor"));
                      setShowAddStaffModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold hover:bg-[#58243E] transition flex items-center space-x-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ નવો એમ્પ્લોયી</span>
                  </button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7F4] text-[#8E8E93] border-b border-[#E5E5EA] text-2xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">કર્મચારી (Staff)</th>
                      <th className="px-4 py-3">રોલ & પરમિશન (Access)</th>
                      <th className="px-4 py-3">આજની હાજરી</th>
                      <th className="px-4 py-3">બેઝિક પગાર</th>
                      <th className="px-4 py-3">સોંપાયેલ / પૂર્ણ ફિલ્મો</th>
                      <th className="px-4 py-3 text-right">ક્રિયા</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {staff.map((member) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const record = attendance.find(
                        (a) => a.staffId === member.id && a.date === todayStr
                      );
                      const isOnline = record && !record.punchOut;
                      const assignedCount = bookings.filter((b) => b.assignedTo === member.id).length;
                      const deliveredCount = bookings.filter(
                        (b) => b.assignedTo === member.id && b.status === "delivered_done"
                      ).length;
                      const memberPerms = getEffectivePermissions(member);
                      const isMemberSuper = isSuperAdminUser(member);
                      const activePermCount = Object.values(memberPerms).filter(Boolean).length;

                      return (
                        <tr key={member.id} className="hover:bg-white/60 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-[#1C1C1E]">{member.name}</p>
                              {!member.isActive && (
                                <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-3xs font-bold">
                                  બંધ
                                </span>
                              )}
                            </div>
                            <p className="text-2xs text-[#8E8E93] font-mono">{member.email}</p>
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#E5E5EA] text-[#3A3A3C] font-semibold text-2xs capitalize">
                              {isMemberSuper ? "👑 Super Admin" : member.role}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {isMemberSuper ? (
                                <span className="text-3xs px-1.5 py-0.2 rounded bg-purple-50 text-[#6B2E4C] border border-[#6B2E4C]/20 font-bold">
                                  સંપૂર્ણ કંટ્રોલ (All Access)
                                </span>
                              ) : activePermCount === 0 ? (
                                <span className="text-3xs px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                  ફક્ત પોતાના એડિટ્સ
                                </span>
                              ) : (
                                <span className="text-3xs px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                  {activePermCount}/9 પરમિશન ચાલુ
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isOnline ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs border border-emerald-200">
                                ● In Duty ({record?.device || "mac"})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#8E8E93] text-2xs">
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#1C1C1E]">
                            ₹{member.baseSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-2xs font-medium text-[#3A3A3C]">
                            {assignedCount} Assigned • {deliveredCount} Done
                          </td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() =>
                                setEditingStaffMember({
                                  ...member,
                                  permissions: getEffectivePermissions(member),
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-[#6B2E4C]/10 hover:bg-[#6B2E4C] text-[#6B2E4C] hover:text-white text-2xs font-bold transition"
                              title="પરમિશન, પાસવર્ડ અને પગાર મેનેજ કરો"
                            >
                              🔐 પરમિશન / એડિટ
                            </button>
                            <button
                              onClick={() => setSelectedStaffForSlip(member)}
                              className="px-2.5 py-1 rounded-lg border border-[#D1D1D6] hover:bg-white text-2xs font-semibold"
                            >
                              Pay Slip
                            </button>
                            {!isMemberSuper && (
                              <button
                                onClick={() => {
                                  if (confirm(`શું તમે ${member.name} નું ખાતું હટાવવા માંગો છો?`)) {
                                    deleteStaff(member.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 5: LEAVE MANAGEMENT (રજા અરજી) ── */}
          {effectiveAdminTab === "leaves" && currentPerms.canManageStaffAndSalary && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    સ્ટાફ રજા અરજીઓ (Leave Applications)
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    કર્મચારીઓ દ્વારા મોકલાયેલી રજાઓની સમીક્ષા કરો અને મંજૂર કે અસ્વીકાર કરો
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
                  {leaveRequests.filter((l) => l.status === "pending").length} બાકી અરજીઓ
                </span>
              </div>

              <div className="space-y-3">
                {leaveRequests.length === 0 ? (
                  <p className="text-xs text-[#8E8E93] text-center py-6">કોઈ રજા અરજી આવેલી નથી.</p>
                ) : (
                  leaveRequests.map((lv) => (
                    <div
                      key={lv.id}
                      className="p-4 rounded-xl border border-[#E5E5EA] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#1C1C1E]">{lv.staffName}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#3A3A3C] text-2xs capitalize">
                            {lv.type} Leave
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                              lv.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : lv.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {lv.status === "approved"
                              ? "✓ મંજૂર (Approved)"
                              : lv.status === "rejected"
                              ? "✕ અસ્વીકાર (Rejected)"
                              : "● સમીક્ષા બાકી (Pending)"}
                          </span>
                        </div>
                        <p className="text-2xs text-[#8E8E93]">
                          તારીખ: <strong>{lv.startDate}</strong> થી <strong>{lv.endDate}</strong> ({lv.totalDays} દિવસ)
                        </p>
                        <p className="text-xs text-[#3A3A3C] bg-[#F8F7F4] p-2 rounded-lg border border-[#E5E5EA]">
                          કારણ: "{lv.reason}"
                        </p>
                        {lv.adminComment && (
                          <p className="text-2xs text-[#6B2E4C] italic">
                            એડમિન નોટ: {lv.adminComment}
                          </p>
                        )}
                      </div>

                      {/* Action buttons if pending (Inline note bar — zero browser prompt()) */}
                      {lv.status === "pending" && (
                        <div className="flex flex-col items-end space-y-2 shrink-0">
                          {reviewingLeave?.id === lv.id ? (
                            <div className="flex flex-wrap items-center gap-1.5 bg-[#F8F7F4] p-2 rounded-xl border border-[#E5E5EA]">
                              <input
                                type="text"
                                autoFocus
                                value={reviewingLeave.note}
                                onChange={(e) =>
                                  setReviewingLeave({
                                    ...reviewingLeave,
                                    note: e.target.value,
                                  })
                                }
                                placeholder={
                                  reviewingLeave.action === "approved"
                                    ? "મંજૂરી નોંધ (વૈકલ્પિક)..."
                                    : "અસ્વીકારનું કારણ લખો..."
                                }
                                className="px-2.5 py-1 rounded-lg border border-[#D1D1D6] bg-white text-xs w-44 focus:outline-none focus:border-[#6B2E4C]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  updateLeaveStatus(
                                    lv.id,
                                    reviewingLeave.action,
                                    reviewingLeave.note.trim() || undefined
                                  );
                                  setReviewingLeave(null);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-white font-bold text-xs cursor-pointer ${
                                  reviewingLeave.action === "approved"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-red-600 hover:bg-red-700"
                                }`}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewingLeave(null)}
                                className="px-2 py-1 rounded-lg bg-white border border-[#D1D1D6] text-xs text-[#636366] hover:text-[#1C1C1E] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewingLeave({ id: lv.id, action: "approved", note: "" })
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                              >
                                ✓ Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReviewingLeave({ id: lv.id, action: "rejected", note: "" })
                                }
                                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors cursor-pointer"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB 6: CLIENTS DIRECTORY ── */}
          {effectiveAdminTab === "clients" && currentPerms.canViewClientsDirectory && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    ક્લાયન્ટ્સ ડિરેક્ટરી અને વ્હોટ્સએપ કનેક્ટ
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    સ્ટુડિયો, ફોટોગ્રાફર્સ અને ડેડિકેટેડ WhatsApp ગ્રુપ લિંક્સ
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-[#E5E5EA] text-[#3A3A3C]">
                  {clients.length} ક્લાયન્ટ્સ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl border border-[#E5E5EA] bg-white space-y-2.5 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-[#1C1C1E]">{c.studioName}</h4>
                        <p className="text-2xs text-[#8E8E93]">{c.contactPerson}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#3A3A3C] text-2xs font-semibold capitalize">
                        {c.region}
                      </span>
                    </div>

                    <div className="text-2xs text-[#8E8E93] space-y-0.5">
                      <p>ફોન: {c.phone}</p>
                      <p>કુલ ઓર્ડર: {c.totalBookings} પ્રોજેક્ટ્સ</p>
                      {c.preferredLutStyle && (
                        <p className="text-[#6B2E4C] truncate">LUT: {c.preferredLutStyle}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-2xs">
                      <a
                        href={`https://wa.me/${(c.phone || "").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 flex items-center space-x-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>WhatsApp Chat</span>
                      </a>

                      <button
                        onClick={() =>
                          setEditingClientWhatsApp({
                            id: c.id,
                            studioName: c.studioName,
                            url: c.whatsappGroupUrl || "",
                          })
                        }
                        className="text-[#6B2E4C] font-semibold hover:underline"
                      >
                        {c.whatsappGroupUrl ? "Edit Group Link" : "+ Add Group"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 7: SETTINGS & BACKUP ── */}
          {effectiveAdminTab === "settings" && currentPerms.canManageSettings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
              {/* Cloud Database (MongoDB Atlas) Card */}
              <div className="apple-glass-card rounded-2xl p-5 space-y-4 lg:col-span-2 border border-[#E5E5EA]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5EA] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1E] flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-[#6B2E4C]" />
                      <span>ક્લાઉડ ડેટાબેઝ (MongoDB Atlas Live Sync)</span>
                    </h3>
                    <p className="text-xs text-[#8E8E93]">
                      બુકિંગ સાઇટ (book.rsegnr.in) અને Mac/iPhone એપ વચ્ચે લાઈવ રિયલ-ટાઇમ ક્લાઉડ સ્ટોરેજ
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-2xs font-bold ${
                        dbStatus?.connected
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${dbStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <span>{dbStatus?.connected ? "🟢 ક્લાઉડ સક્રિય (MongoDB Live)" : "🟡 લોકલ ફાઈલ & સર્વર બ્રિજ સક્રિય"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={checkDbStatus}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#E5E5EA]"
                      title="સ્ટેટસ ચકાસો"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {dbMessage && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                    {dbMessage}
                  </div>
                )}

                <form onSubmit={handleConnectMongo} className="space-y-3">
                  <div>
                    <label className="block text-2xs font-bold text-[#3A3A3C] uppercase mb-1">
                      MongoDB Connection URI (Atlas કનેક્શન સ્ટ્રિંગ):
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="password"
                        value={mongoUriInput}
                        onChange={(e) => setMongoUriInput(e.target.value)}
                        placeholder="mongodb+srv://username:password@cluster0.mongodb.net/?retryWrites=true&w=majority"
                        className="flex-1 px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#6B2E4C]"
                      />
                      <button
                        type="submit"
                        disabled={isSavingDb}
                        className="px-4 py-2 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] transition shrink-0 flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isSavingDb ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>કનેક્ટ થાય છે...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>કનેક્ટ & ક્લાઉડમાં સિન્ક કરો</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-2xs text-[#8E8E93] leading-relaxed">
                    💡 <strong>સરળ માર્ગદર્શિકા:</strong> <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="text-[#6B2E4C] underline font-bold">cloud.mongodb.com</a> પર ૧ મિનિટમાં ૧૦૦% ફ્રી M0 ક્લસ્ટર બનાવી, તેનું કનેક્શન URL અહીં પેસ્ટ કરી શકો છો. જો URL ન હોય તો પણ ચિંતા કરવાની જરૂર નથી—આપણો <strong>Live Server Bridge</strong> બેકગ્રાઉન્ડમાં આપમેળે તમામ સ્લોટ્સ સિન્ક કરતો રહે છે!
                  </p>
                </form>
              </div>
              {/* Backup & System */}
              <div className="apple-glass-card rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#E5E5EA] pb-2">
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    સુરક્ષિત બેકઅપ અને ડેટા સિંક (Backup System)
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    તમારા સ્ટુડિયોના તમામ ડેટાની ૧-ક્લિક સ્થાનિક ફાઇલ ડાઉનલોડ કરો
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <span>ડેટા બેકઅપ સુરક્ષા: સક્રિય</span>
                  </div>
                  <p className="text-2xs text-emerald-800 leading-relaxed">
                    તમામ બુકિંગ્સ, સ્ટાફ માહિતી, પાસવર્ડ્સ, દૈનિક હાજરી, રજા અરજીઓ અને પેરોલ હિસાબ
                    એક જ ફાઇલમાં સાચવવામાં આવે છે.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>સંપૂર્ણ ડેટા બેકઅપ ડાઉનલોડ કરો (JSON)</span>
                  </button>
                </div>

                {/* Holiday manager */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#1C1C1E]">જાહેર રજાઓ અને બંધ દિવસો</h4>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="તહેવારનું નામ..."
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs bg-white"
                    />
                    <button
                      onClick={() => {
                        if (newHolidayDate && newHolidayName.trim()) {
                          addHoliday({ date: newHolidayDate, name: newHolidayName.trim() });
                          setNewHolidayDate("");
                          setNewHolidayName("");
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold"
                    >
                      ઉમેરો
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {holidays.map((h) => (
                      <div
                        key={h.date}
                        className="p-2 rounded-lg border border-[#E5E5EA] bg-white flex justify-between items-center text-xs"
                      >
                        <span>
                          <strong>{h.date}</strong> — {h.name}
                        </span>
                        <button
                          onClick={() => removeHoliday(h.date)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Service Pricing Manager */}
              <div className="apple-glass-card rounded-2xl p-5 space-y-4">
                <div className="border-b border-[#E5E5EA] pb-2">
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    સર્વિસ પ્રાઇસિંગ મેનેજર (Wedding Packages)
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    વેબસાઇટ પર દેખાતા વિવિધ પેકેજોના બેઝિક ભાવ અહીંથી બદલો
                  </p>
                </div>

                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#1C1C1E]">{srv.name}</p>
                        <p className="text-2xs text-[#8E8E93]">
                          એડિટર: {srv.editorDays} દિવસ • ડિલિવરી: {srv.clientDays} દિવસ
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {editingServicePriceId === srv.id ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-[#8E8E93]">₹</span>
                            <input
                              type="number"
                              autoFocus
                              min={0}
                              value={editingServicePriceValue}
                              onChange={(e) => setEditingServicePriceValue(e.target.value)}
                              className="w-24 px-2 py-1 rounded-lg border border-[#6B2E4C] bg-white font-mono text-xs text-[#1C1C1E] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const parsed = Number(editingServicePriceValue);
                                if (!isNaN(parsed) && parsed >= 0) {
                                  updateServicePrice(srv.id, parsed);
                                }
                                setEditingServicePriceId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-[#6B2E4C] text-white text-2xs font-bold hover:bg-[#58243E] cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingServicePriceId(null)}
                              className="px-2 py-1 rounded-lg border border-[#D1D1D6] text-2xs text-[#636366] hover:text-[#1C1C1E] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-mono font-bold text-[#1C1C1E]">
                              ₹{(srv.basePriceINR || 0).toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              aria-label={`${srv.name} ભાવ બદલો`}
                              onClick={() => {
                                setEditingServicePriceId(srv.id);
                                setEditingServicePriceValue(String(srv.basePriceINR || 0));
                              }}
                              className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-black/[0.04] cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 8: PERSONAL LEAVE & PAY SLIP FOR NON-SUPER-ADMIN STAFF ── */}
          {effectiveAdminTab === "my_desk" && !isSuperAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <div className="apple-glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1E]">મારી રજા અરજીઓ</h3>
                    <p className="text-xs text-[#8E8E93]">રજા માટે અરજી કરો અને સ્ટેટસ જુઓ</p>
                  </div>
                  <button
                    onClick={() => setShowLeaveApplyModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold hover:bg-[#58243E] transition"
                  >
                    + રજા અરજી
                  </button>
                </div>
                <div className="space-y-2.5">
                  {leaveRequests.filter((l) => l.staffId === currentUser.id).length === 0 ? (
                    <p className="text-xs text-[#8E8E93] text-center py-6">કોઈ રજા અરજી નથી.</p>
                  ) : (
                    leaveRequests
                      .filter((l) => l.staffId === currentUser.id)
                      .map((lv) => (
                        <div key={lv.id} className="p-3 rounded-xl border border-[#E5E5EA] bg-white text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{lv.startDate} થી {lv.endDate} ({lv.totalDays} દિવસ)</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#F2F2F7] text-2xs font-bold capitalize">{lv.status}</span>
                          </div>
                          <p className="text-[#3A3A3C]">{lv.reason}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
              <div className="apple-glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1C1E]">મારો માસિક પગાર & હાજરી</h3>
                    <p className="text-xs text-[#8E8E93]">તમારા બેઝિક પગાર અને હાજરીની વિગત</p>
                  </div>
                  <button
                    onClick={() => setSelectedStaffForSlip(currentUser)}
                    className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] hover:bg-white text-xs font-bold"
                  >
                    Pay Slip જુઓ
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#E5E5EA] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">બેઝિક માસિક પગાર:</span>
                    <span className="font-mono font-bold text-[#1C1C1E]">₹{currentUser.baseSalary.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8E8E93]">કુલ હાજરી દિવસ:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {attendance.filter((a) => a.staffId === currentUser.id).length} દિવસ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── iPhone / Mobile Native Bottom Navigation Bar (Permission Gated) ── */}
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E5E5EA] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
            <button
              onClick={() => setAdminTab("kanban")}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-3xs font-bold transition ${
                effectiveAdminTab === "kanban" ? "text-[#6B2E4C]" : "text-[#8E8E93]"
              }`}
            >
              <Kanban className="h-5 w-5 mb-0.5" />
              <span>કાનબાન</span>
            </button>
            {currentPerms.canViewAllBookings && (
              <button
                onClick={() => setAdminTab("calendar")}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-3xs font-bold transition ${
                  effectiveAdminTab === "calendar" ? "text-[#6B2E4C]" : "text-[#8E8E93]"
                }`}
              >
                <Calendar className="h-5 w-5 mb-0.5" />
                <span>બુકિંગ્સ</span>
              </button>
            )}
            {currentPerms.canCreateBooking && (
              <button
                onClick={openNewBookingModal}
                className="flex items-center justify-center h-11 w-11 -mt-5 rounded-full bg-[#6B2E4C] text-white shadow-lg border-2 border-white active:scale-95 transition"
                title="+ નવું બુકિંગ ઉમેરો"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
            {currentPerms.canViewPricingAndInvoices && (
              <button
                onClick={() => setAdminTab("invoices")}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-3xs font-bold transition ${
                  effectiveAdminTab === "invoices" ? "text-[#6B2E4C]" : "text-[#8E8E93]"
                }`}
              >
                <FileText className="h-5 w-5 mb-0.5" />
                <span>ઇન્વોઇસ</span>
              </button>
            )}
            {currentPerms.canManageStaffAndSalary ? (
              <button
                onClick={() => setAdminTab("staff")}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-3xs font-bold transition ${
                  effectiveAdminTab === "staff" ? "text-[#6B2E4C]" : "text-[#8E8E93]"
                }`}
              >
                <Users className="h-5 w-5 mb-0.5" />
                <span>ટીમ</span>
              </button>
            ) : !isSuperAdmin ? (
              <button
                onClick={() => setAdminTab("my_desk")}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-3xs font-bold transition ${
                  effectiveAdminTab === "my_desk" ? "text-[#6B2E4C]" : "text-[#8E8E93]"
                }`}
              >
                <Briefcase className="h-5 w-5 mb-0.5" />
                <span>મારું ડેસ્ક</span>
              </button>
            ) : null}
          </nav>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            EMPLOYEE PERSONAL DESK (સ્મિત, રોહિત - Strict Role Isolation)
        ───────────────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
          {/* Employee Welcome & Status Banner */}
          <div className="apple-glass-card p-5 rounded-3xl bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1C1C1E]">
                નમસ્તે, {currentUser.name} 👋
              </h2>
              <p className="text-xs text-[#8E8E93]">
                {currentUser.role.toUpperCase()} DESK • ગાંધીનગર સ્ટુડિયો
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {todayRecord?.punchOut ? (
                <span className="px-3 py-1 rounded-xl bg-[#E5E5EA] text-[#8E8E93] text-xs font-semibold">
                  Shift Completed
                </span>
              ) : todayRecord ? (
                <button
                  onClick={punchOut}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition"
                >
                  Shift Punch Out
                </button>
              ) : (
                <button
                  onClick={() => punchIn("mac")}
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] transition flex items-center space-x-1.5"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Daily Punch In</span>
                </button>
              )}
            </div>
          </div>

          {/* Employee Navigation Tabs */}
          <nav className="flex items-center space-x-2 border-b border-[#E5E5EA] pb-1 text-xs font-semibold">
            <button
              onClick={() => setEmployeeTab("tasks")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
                employeeTab === "tasks"
                  ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                  : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>મારા એડિટ્સ ({myTasks.length})</span>
            </button>
            <button
              onClick={() => setEmployeeTab("leave")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
                employeeTab === "leave"
                  ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                  : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>રજા અરજી (Leave)</span>
            </button>
            <button
              onClick={() => setEmployeeTab("salary")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
                employeeTab === "salary"
                  ? "bg-[#6B2E4C] text-white font-bold shadow-sm"
                  : "text-[#3A3A3C] hover:bg-[#E5E5EA]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>મારો પગાર અને સ્લિપ</span>
            </button>
          </nav>

          {/* ── EMPLOYEE TAB 1: MY TASKS ONLY ── */}
          {employeeTab === "tasks" && (
            <div className="space-y-4 animate-fadeIn">
              {myTasks.length === 0 ? (
                <div className="apple-glass-card rounded-2xl p-10 text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                  <h3 className="font-bold text-sm text-[#1C1C1E]">તમારું કામ બધું પૂર્ણ છે!</h3>
                  <p className="text-xs text-[#8E8E93]">
                    હાલમાં તમારા ખાતામાં કોઈ પેન્ડિંગ એડિટિંગ સોંપાયેલું નથી.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myTasks.map((task) => {
                    const dateInfo = getDateStatus(task.slotDate, task.deliveryDate);
                    return (
                      <div
                        key={task.id}
                        className={`apple-glass-card rounded-2xl p-4 space-y-3 shadow-md border ${
                          task.offerType === "labh_pancham_2026"
                            ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]"
                            : "bg-white border-[#E5E5EA]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-2xs">
                          <span className={`px-2 py-0.5 rounded-lg border text-2xs font-semibold ${dateInfo.badge}`}>
                            {dateInfo.label}
                          </span>
                          <span className="font-mono font-bold text-[#6B2E4C]">{task.code}</span>
                        </div>

                        {task.offerType === "labh_pancham_2026" && (
                          <div className="flex items-center justify-between px-2 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 text-2xs font-bold">
                            <span className="flex items-center space-x-1">
                              <span>🪔</span>
                              <span>લાભ પાંચમ મુહૂર્ત (15% OFF)</span>
                            </span>
                            <span className="font-mono text-2xs font-extrabold text-emerald-800 bg-white/90 px-1.5 py-0.2 rounded border border-emerald-300">
                              મુહૂર્ત સ્લોટ
                            </span>
                          </div>
                        )}

                      <div>
                        <h4 className="font-bold text-sm text-[#1C1C1E]">{task.coupleNames}</h4>
                        <p className="text-xs text-[#8E8E93]">{task.studioOrClient}</p>
                      </div>

                      <div className="bg-[#F8F7F4] p-2.5 rounded-xl text-2xs space-y-1 border border-[#E5E5EA]">
                        <div className="flex justify-between">
                          <span className="text-[#8E8E93]">ડિલિવરી ટાર્ગેટ:</span>
                          <span className="font-mono font-bold text-[#6B2E4C]">
                            {task.deliveryDate}
                          </span>
                        </div>
                        {task.cameraProfile && (
                          <div className="flex justify-between">
                            <span className="text-[#8E8E93]">કેમેરા / પ્રોફાઇલ:</span>
                            <span className="font-semibold text-[#1C1C1E]">
                              {task.cameraProfile}
                            </span>
                          </div>
                        )}
                        {task.songPreference && (
                          <div className="flex justify-between">
                            <span className="text-[#8E8E93]">સોંગ પસંદગી:</span>
                            <span className="font-semibold text-[#1C1C1E] truncate max-w-[150px]">
                              {task.songPreference}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assets Button */}
                      <a
                        href={task.rawLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 rounded-xl bg-[#6B2E4C]/10 text-[#6B2E4C] font-bold text-xs hover:bg-[#6B2E4C]/20 transition flex items-center justify-center space-x-1.5"
                      >
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>📂 રૉ ફૂટેજ લિંક ઓપન કરો</span>
                      </a>

                      {/* Stage Dropdown */}
                      <div className="space-y-1 pt-1 border-t border-[#E5E5EA]">
                        <label className="text-2xs text-[#8E8E93] font-semibold">
                          સ્થિતિ અપડેટ કરો (Update Status):
                        </label>
                        <select
                          value={task.status}
                          onChange={(e) => updateBookingStatus(task.id, e.target.value as any)}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-[#D1D1D6] text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.stepNum}. {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Frame.io link updater */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFrameIoInputModalBooking(task);
                            setTempFrameIoLink(task.frameIoLink || "");
                          }}
                          className="text-2xs text-[#6B2E4C] font-semibold hover:underline flex items-center space-x-1"
                        >
                          <span>{task.frameIoLink ? "✓ Frame.io લિંક સેટ થયેલ છે" : "+ Frame.io પ્રિવ્યૂ લિંક જોડો"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          )}

          {/* ── EMPLOYEE TAB 2: LEAVE APPLICATION ── */}
          {employeeTab === "leave" && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">મારી રજા અરજીઓ (My Leaves)</h3>
                  <p className="text-xs text-[#8E8E93]">
                    નવી રજાની અરજી કરો અથવા અગાઉની અરજીઓની સ્થિતિ જુઓ
                  </p>
                </div>
                <button
                  onClick={() => setShowLeaveApplyModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-xs font-bold hover:bg-[#58243E] transition flex items-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ નવી રજા અરજી</span>
                </button>
              </div>

              <div className="space-y-3">
                {leaveRequests.filter((l) => l.staffId === currentUser.id).length === 0 ? (
                  <p className="text-xs text-[#8E8E93] text-center py-6">
                    તમે કોઈ રજા માટે અરજી કરી નથી.
                  </p>
                ) : (
                  leaveRequests
                    .filter((l) => l.staffId === currentUser.id)
                    .map((lv) => (
                      <div
                        key={lv.id}
                        className="p-4 rounded-xl border border-[#E5E5EA] bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1C1C1E]">
                            {lv.startDate} થી {lv.endDate} ({lv.totalDays} દિવસ)
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-2xs font-bold ${
                              lv.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : lv.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {lv.status === "approved"
                              ? "✓ મંજૂર"
                              : lv.status === "rejected"
                              ? "✕ અસ્વીકાર"
                              : "● બાકી"}
                          </span>
                        </div>
                        <p className="text-[#3A3A3C] bg-[#F8F7F4] p-2 rounded-lg">
                          કારણ: "{lv.reason}"
                        </p>
                        {lv.adminComment && (
                          <p className="text-2xs text-[#6B2E4C] italic">
                            એડમિન પ્રતિક્રિયા: {lv.adminComment}
                          </p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* ── EMPLOYEE TAB 3: SALARY & PAY SLIP ── */}
          {employeeTab === "salary" && (
            <div className="apple-glass-card rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1E]">
                    માસિક પગાર અને પે-સ્લિપ (My Pay Slip)
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    તમારો બેઝિક પગાર, હાજરીના દિવસો અને ડાઉનલોડ સ્લિપ
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] hover:bg-white text-xs font-semibold flex items-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>પ્રિન્ટ સ્લિપ</span>
                </button>
              </div>

              {/* Printable Pay Slip Card */}
              <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4 shadow-sm text-xs">
                <div className="flex justify-between items-center border-b border-[#E5E5EA] pb-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#6B2E4C]">
                      RSE POST PRODUCTION HOUSE
                    </h4>
                    <p className="text-2xs text-[#8E8E93]">Gandhinagar, Gujarat • Monthly Pay Slip</p>
                  </div>
                  <span className="font-mono text-2xs text-[#8E8E93]">
                    {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#F8F7F4] p-3 rounded-xl">
                  <div>
                    <span className="text-2xs text-[#8E8E93] block">કર્મચારીનું નામ:</span>
                    <strong className="text-xs text-[#1C1C1E]">{currentUser.name}</strong>
                  </div>
                  <div>
                    <span className="text-2xs text-[#8E8E93] block">રોલ / હોદ્દો:</span>
                    <strong className="text-xs text-[#1C1C1E] capitalize">{currentUser.role}</strong>
                  </div>
                </div>

                <div className="divide-y divide-[#E5E5EA] font-mono text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-[#8E8E93]">બેઝિક માસિક પગાર (Base Salary):</span>
                    <span className="font-bold text-[#1C1C1E]">
                      ₹{currentUser.baseSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-[#8E8E93]">હાજરી ભરેલ દિવસો:</span>
                    <span className="font-bold text-emerald-800">
                      {
                        attendance.filter(
                          (a) =>
                            a.staffId === currentUser.id &&
                            a.date.startsWith(new Date().toISOString().slice(0, 7))
                        ).length
                      }{" "}
                      દિવસ
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between text-sm font-bold bg-[#F8F7F4] px-2 rounded-lg">
                    <span className="text-[#1C1C1E]">કુલ ચુકવવાપાત્ર રકમ (Net Payable):</span>
                    <span className="text-[#6B2E4C]">
                      ₹{currentUser.baseSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS & ACTION SHEETS
      ───────────────────────────────────────────────────────────── */}

      {/* MODAL 1: ADD NEW BOOKING */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-2xl bg-white max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-1.5">
                <Plus className="h-4 w-4 text-[#6B2E4C]" />
                <span>+ નવું સ્લોટ બુકિંગ ઉમેરો (Quick Slot Entry / Call)</span>
              </h3>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold p-1 rounded-lg hover:bg-[#F2F2F7] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-3">
              {/* Row 1: Client/Project Name & Studio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ક્લાયન્ટ / પ્રોજેક્ટ / કપલનું નામ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCouple}
                    onChange={(e) => setFormCouple(e.target.value)}
                    placeholder="દા.ત. Birthday Highlight / પ્રિયા & રાહુલ / Event Video"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    સ્ટુડિયો / ફોટોગ્રાફર નામ
                  </label>
                  <input
                    type="text"
                    value={formStudio}
                    onChange={(e) => setFormStudio(e.target.value)}
                    placeholder="દા.ત. વિષ્ણુ ફોટોગ્રાફી (ડાયરેક્ટ માટે ખાલી રાખો)"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
              </div>

              {/* Row 2: Phone & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    મોબાઈલ નંબર / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98250 11999"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    પ્રદેશ (Region)
                  </label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  >
                    <option value="indian">🇮🇳 Indian Client (INR ₹)</option>
                    <option value="foreign">🌍 Foreign Client (USD $)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Deliverable / Work Type & Assign Editor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    કામનો પ્રકાર / પેકેજ (Service & Deliverable) *
                  </label>
                  <select
                    value={formPackage}
                    onChange={(e) => {
                      const pkg = e.target.value;
                      setFormPackage(pkg);
                      if (pkg.includes("Birthday")) setFormPrice(4500);
                      else if (pkg.includes("Event Highlight")) setFormPrice(5000);
                      else if (pkg.includes("Pre-Wedding")) setFormPrice(7500);
                      else if (pkg.includes("Engagement") || pkg.includes("સગાઈ")) setFormPrice(5000);
                      else if (pkg.includes("Baby Shower") || pkg.includes("શ્રીમંત")) setFormPrice(4500);
                      else if (pkg.includes("Corporate") || pkg.includes("કોર્પોરેટ")) setFormPrice(10000);
                      else if (pkg.includes("Wedding Short Film")) setFormPrice(16500);
                      else if (pkg.includes("Wedding Highlight")) setFormPrice(6500);
                      else if (pkg.includes("Single-Cam")) setFormPrice(1550);
                      else if (pkg.includes("Multi-Cam")) setFormPrice(1850);
                      else if (pkg.includes("Vertical Reel")) setFormPrice(1200);
                      else if (pkg.includes("Insta Cut")) setFormPrice(1851);
                      else if (pkg.includes("Teaser")) setFormPrice(3500);
                      else setFormPrice(5000);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  >
                    <optgroup label="🎉 ઇવેન્ટ્સ અને સ્પેશિયલ વિડીયો (Events & Highlights)">
                      <option value="Birthday Highlight (બર્થડે હાઇલાઇટ)">🎂 Birthday Highlight (બર્થડે હાઇલાઇટ)</option>
                      <option value="Event Highlight (કોઈપણ ઇવેન્ટ હાઇલાઇટ)">🎊 Event Highlight (કોઈપણ ઇવેન્ટ હાઇલાઇટ)</option>
                      <option value="Pre-Wedding Film (પ્રી-વેડિંગ ફિલ્મ)">💍 Pre-Wedding Film (પ્રી-વેડિંગ ફિલ્મ)</option>
                      <option value="Engagement / Ring Ceremony (સગાઈ સેરેમની)">✨ Engagement / Ring Ceremony (સગાઈ સેરેમની)</option>
                      <option value="Baby Shower / Shrimant (શ્રીમંત / બેબી શાવર)">🍼 Baby Shower / Shrimant (શ્રીમંત / બેબી શાવર)</option>
                      <option value="Corporate Event / Commercial (કોર્પોરેટ ઇવેન્ટ)">🏢 Corporate Event / Commercial (કોર્પોરેટ ઇવેન્ટ)</option>
                    </optgroup>
                    <optgroup label="🎬 વેડિંગ ફિલ્મ્સ (Wedding Films)">
                      <option value="Wedding Highlight (૩ થી ૫ મિનિટ)">🎬 Wedding Highlight (૩ થી ૫ મિનિટ)</option>
                      <option value="Wedding Short Film (૩૦ થી ૪૦ મિનિટ)">🎞️ Wedding Short Film (૩૦ થી ૪૦ મિનિટ)</option>
                      <option value="Traditional Wedding Film (Single-Cam)">🎥 Traditional Film (Single-Cam)</option>
                      <option value="Traditional Wedding Film (Multi-Cam)">🎥 Traditional Film (Multi-Cam)</option>
                      <option value="Wedding Teaser / Trailer (૬૦ થી ૯૦ સેકન્ડ)">⏱️ Wedding Teaser / Trailer (૬૦-૯૦ સેકન્ડ)</option>
                      <option value="Vertical Reel / Insta Cut (9:16)">📱 Vertical Reel / Insta Cut (9:16)</option>
                      <option value="Other / Custom Project (અન્ય પ્રોજેક્ટ)">💡 Custom / Other Project (કસ્ટમ પ્રોજેક્ટ)</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    એડિટરને સોંપો (Assign Editor)
                  </label>
                  <select
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  >
                    <option value="">-- પછીથી સોંપો (Unassigned) --</option>
                    {staff
                      .filter((s) => s.role === "editor" || s.role === "admin")
                      .map((ed) => (
                        <option key={ed.id} value={ed.id}>
                          👤 {ed.name} ({ed.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Dates & Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    સ્લોટ તારીખ *
                  </label>
                  <input
                    type="date"
                    required
                    value={formSlotDate}
                    onChange={(e) => handleFormSlotDateChange(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-2xs font-bold text-[#8E8E93] uppercase">
                      ડિલિવરી તારીખ *
                    </label>
                    <span className="text-3xs text-[#6B2E4C] font-semibold">(+૫ દિવસ)</span>
                  </div>
                  <input
                    type="date"
                    required
                    min={formSlotDate}
                    value={formDeliveryDate}
                    onChange={(e) => setFormDeliveryDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl border border-[#6B2E4C]/30 bg-[#6B2E4C]/5 text-xs font-mono font-bold text-[#6B2E4C] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    કુલ રકમ (Total INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    જમા એડવાન્સ (INR)
                  </label>
                  <input
                    type="number"
                    value={formAdvanceAmount}
                    onChange={(e) => setFormAdvanceAmount(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
              </div>

              {/* Row 5: Advance Paid Checkbox & Delivery Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center bg-[#F9F9FB] p-2.5 rounded-2xl border border-[#E5E5EA]">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formAdvancePaid}
                    onChange={(e) => setFormAdvancePaid(e.target.checked)}
                    className="rounded text-[#6B2E4C] focus:ring-[#6B2E4C] h-4 w-4"
                  />
                  <span className="text-xs font-bold text-[#1C1C1E]">
                    ✓ એડવાન્સ રકમ જમા થઈ ગઈ છે (Advance Paid)
                  </span>
                </label>
                <div className="flex items-center space-x-2">
                  <label className="text-2xs font-bold text-[#8E8E93] uppercase whitespace-nowrap">
                    ફૂટેજ:
                  </label>
                  <select
                    value={formDeliveryMethod}
                    onChange={(e) => setFormDeliveryMethod(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  >
                    <option value="online">☁️ Google Drive / WeTransfer</option>
                    <option value="courier">🚚 HDD Courier Delivery</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Raw Link & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    રૉ ફૂટેજ લિંક (Drive URL - વૈકલ્પિક)
                  </label>
                  <input
                    type="url"
                    value={formRawLink}
                    onChange={(e) => setFormRawLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    વિશેષ નોંધ / ગીત પસંદગી (Notes - વૈકલ્પિક)
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="દા.ત. કેમેરા Sony FX3, ઇવેન્ટ સમય, વગેરે..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowNewBookingModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-medium text-[#1C1C1E] hover:bg-[#F2F2F7] transition"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] transition shadow-md active:scale-95 flex items-center space-x-1.5"
                >
                  <span>✓ સ્લોટ બુકિંગ સેવ કરો</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW EMPLOYEE WITH CUSTOM PERMISSIONS */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-2xl bg-white max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-1.5">
                <Users className="h-4 w-4 text-[#6B2E4C]" />
                <span>+ નવો એમ્પ્લોયી ઉમેરો (Add Staff & Access)</span>
              </h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  કર્મચારીનું નામ *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="દા.ત. મનોજ પ્રજાપતિ"
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ઈમેઈલ (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="manoj@rse-edit.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    પાસવર્ડ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="manoj@123"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    હોદ્દો (Role Preset)
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => {
                      const roleVal = e.target.value as Role;
                      setNewStaffRole(roleVal);
                      setNewStaffPermissions(getRoleDefaultPermissions(roleVal));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold"
                  >
                    <option value="editor">🎬 Editor (માત્ર પોતાના એડિટ્સ)</option>
                    <option value="outreach">📢 Outreach / Manager (બુકિંગ & ક્લાયન્ટ)</option>
                    <option value="accountant">💼 Accountant (બિલિંગ & હિસાબ)</option>
                    <option value="social">📱 Social Media</option>
                    {isSuperAdmin && <option value="admin">👑 Admin (મેનેજમેન્ટ)</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    બેઝિક માસિક પગાર (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newStaffSalary}
                    onChange={(e) => setNewStaffSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Granular Permissions Control */}
              <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold text-[#6B2E4C] uppercase flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>આ એમ્પ્લોયીને શું-શું દેખાવું જોઈએ? (Permissions)</span>
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {PERMISSION_LABELS.map((p) => (
                    <label
                      key={p.key}
                      className="flex items-start space-x-2 p-1.5 rounded-xl bg-white border border-[#E5E5EA] cursor-pointer hover:border-[#6B2E4C]/40 transition"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(newStaffPermissions[p.key])}
                        onChange={(e) =>
                          setNewStaffPermissions({
                            ...newStaffPermissions,
                            [p.key]: e.target.checked,
                          })
                        }
                        className="mt-0.5 rounded text-[#6B2E4C] focus:ring-[#6B2E4C] h-3.5 w-3.5"
                      />
                      <div className="leading-tight">
                        <span className="block font-bold text-2xs text-[#1C1C1E]">{p.label}</span>
                        <span className="block text-3xs text-[#8E8E93]">{p.hint}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E]"
                >
                  એમ્પ્લોયી સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 11: EDIT STAFF DETAILS & PERMISSIONS */}
      {editingStaffMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-lg p-6 rounded-3xl space-y-4 shadow-2xl bg-white max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 text-[#6B2E4C]" />
                <span>🔐 પરમિશન & ખાતા વિગત ({editingStaffMember.name})</span>
              </h3>
              <button
                onClick={() => setEditingStaffMember(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaffEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    કર્મચારીનું નામ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaffMember.name}
                    onChange={(e) =>
                      setEditingStaffMember({ ...editingStaffMember, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    પાસવર્ડ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStaffMember.password}
                    onChange={(e) =>
                      setEditingStaffMember({ ...editingStaffMember, password: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ઈમેઈલ (Login ID) *
                  </label>
                  <input
                    type="email"
                    required
                    value={editingStaffMember.email}
                    onChange={(e) =>
                      setEditingStaffMember({ ...editingStaffMember, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    બેઝિક માસિક પગાર (₹)
                  </label>
                  <input
                    type="number"
                    value={editingStaffMember.baseSalary}
                    onChange={(e) =>
                      setEditingStaffMember({
                        ...editingStaffMember,
                        baseSalary: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {!isSuperAdminUser(editingStaffMember) && (
                <>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                        હોદ્દો (Role Preset)
                      </label>
                      <select
                        value={editingStaffMember.role}
                        onChange={(e) => {
                          const roleVal = e.target.value as Role;
                          setEditingStaffMember({
                            ...editingStaffMember,
                            role: roleVal,
                            permissions: getRoleDefaultPermissions(roleVal),
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold"
                      >
                        <option value="editor">🎬 Editor</option>
                        <option value="outreach">📢 Outreach / Manager</option>
                        <option value="accountant">💼 Accountant</option>
                        <option value="social">📱 Social Media</option>
                        {isSuperAdmin && <option value="admin">👑 Admin</option>}
                      </select>
                    </div>
                    <div className="pt-4">
                      <label className="flex items-center space-x-2 p-2 rounded-xl bg-[#F8F7F4] border border-[#E5E5EA] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingStaffMember.isActive}
                          onChange={(e) =>
                            setEditingStaffMember({
                              ...editingStaffMember,
                              isActive: e.target.checked,
                            })
                          }
                          className="rounded text-emerald-600 h-4 w-4"
                        />
                        <span className="font-bold text-xs text-[#1C1C1E]">
                          {editingStaffMember.isActive ? "✓ ખાતું ચાલુ છે (Active)" : "⛔ ખાતું બંધ (Blocked)"}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Granular Permissions Control */}
                  <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-[#6B2E4C] uppercase">
                        તમે ઈચ્છો એ જ સ્ક્રીન & સુવિધા ચાલુ રાખો:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStaffMember({
                            ...editingStaffMember,
                            permissions: getRoleDefaultPermissions(editingStaffMember.role),
                          })
                        }
                        className="text-3xs font-bold text-[#6B2E4C] hover:underline"
                      >
                        Reset Role Default
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {PERMISSION_LABELS.map((p) => {
                        const curPermsObj =
                          editingStaffMember.permissions || getEffectivePermissions(editingStaffMember);
                        return (
                          <label
                            key={p.key}
                            className="flex items-start space-x-2 p-2 rounded-xl bg-white border border-[#E5E5EA] cursor-pointer hover:border-[#6B2E4C]/40 transition"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(curPermsObj[p.key])}
                              onChange={(e) =>
                                setEditingStaffMember({
                                  ...editingStaffMember,
                                  permissions: {
                                    ...curPermsObj,
                                    [p.key]: e.target.checked,
                                  },
                                })
                              }
                              className="mt-0.5 rounded text-[#6B2E4C] focus:ring-[#6B2E4C] h-4 w-4"
                            />
                            <div className="leading-tight">
                              <span className="block font-bold text-xs text-[#1C1C1E]">{p.label}</span>
                              <span className="block text-2xs text-[#8E8E93]">{p.hint}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {isSuperAdminUser(editingStaffMember) && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-2xs text-[#6B2E4C] font-semibold">
                  👑 Super Admin પાસે હંમેશા સમગ્ર ઓફિસ OS નો ૧૦૦% કંટ્રોલ સુરક્ષિત રહે છે.
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setEditingStaffMember(null)}
                  className="px-4 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] shadow-sm"
                >
                  ✓ પરમિશન સેવ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LEAVE APPLICATION */}
      {showLeaveApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-1.5">
                <CalendarDays className="h-4 w-4 text-[#6B2E4C]" />
                <span>રજા માટે અરજી કરો (Apply Leave)</span>
              </h3>
              <button
                onClick={() => setShowLeaveApplyModal(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    શરૂઆતની તારીખ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    આખરી તારીખ *
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    કુલ દિવસો
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    રજાનો પ્રકાર
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                  >
                    <option value="casual">Casual (સામાન્ય)</option>
                    <option value="sick">Sick / Medical (બીમારી)</option>
                    <option value="emergency">Emergency (તાકીદનું)</option>
                    <option value="planned">Planned (પરિવારિક)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  રજાનું કારણ *
                </label>
                <textarea
                  required
                  rows={3}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="રજા લેવાનું ચોક્કસ કારણ જણાવો..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setShowLeaveApplyModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E]"
                >
                  અરજી મોકલો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BOOKING DETAILS & FULL ADMIN EDIT */}
      {selectedBookingForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-xl p-6 rounded-3xl space-y-4 shadow-2xl bg-white max-h-[92vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-[#6B2E4C] bg-[#6B2E4C]/10 px-2 py-0.5 rounded-lg">
                  {selectedBookingForDetails.code}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5E5EA] text-[#3A3A3C] text-2xs capitalize font-semibold">
                  {isEditingBooking ? "✏️ એડિટ મોડ (Editing)" : selectedBookingForDetails.packageType}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {currentPerms.canEditBooking && !isEditingBooking && (
                  <button
                    type="button"
                    onClick={() => startEditingBooking(selectedBookingForDetails)}
                    className="px-3 py-1 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>એડિટ કરો</span>
                  </button>
                )}
                {currentPerms.canDeleteBooking && !isEditingBooking && (
                  <button
                    type="button"
                    title="બુકિંગ ડિલીટ કરો"
                    onClick={() =>
                      handleDeleteBooking(
                        selectedBookingForDetails.id,
                        selectedBookingForDetails.code,
                        selectedBookingForDetails.coupleNames
                      )
                    }
                    className="p-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedBookingForDetails(null);
                    setIsEditingBooking(false);
                    setEditFormData(null);
                  }}
                  className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold p-1 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Success Feedback Toast */}
            {editSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-1.5 animate-fadeIn">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {/* MODE 1: FULL ADMIN EDIT FORM */}
            {isEditingBooking && editFormData ? (
              <form onSubmit={handleSaveBookingEdit} className="space-y-3.5">
                {/* Couple & Studio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      કપલ / પ્રોજેક્ટ નામ *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.coupleNames}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, coupleNames: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      સ્ટુડિયો / ક્લાયન્ટનું નામ *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.studioOrClient}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, studioOrClient: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      મોબાઈલ નંબર / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="+91 98250 11999"
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      ઈમેઈલ (Email)
                    </label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="client@studio.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                </div>

                {/* Dates: Slot Date & Delivery Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      સ્લોટ તારીખ *
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.slotDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, slotDate: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      ડિલિવરી ટાર્ગેટ તારીખ *
                    </label>
                    <input
                      type="date"
                      required
                      value={editFormData.deliveryDate}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, deliveryDate: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#6B2E4C] focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                </div>

                {/* Package & Region */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      પેકેજ / કામનો પ્રકાર
                    </label>
                    <input
                      type="text"
                      value={editFormData.packageType || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, packageType: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#6B2E4C]"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      રીજન (Region)
                    </label>
                    <select
                      value={editFormData.region}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, region: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold"
                    >
                      <option value="indian">🇮🇳 Indian</option>
                      <option value="foreign">🌍 Foreign</option>
                    </select>
                  </div>
                </div>

                {/* Pipeline Stage & Assigned Editor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      પાઇપલાઇન સ્ટેજ (Current Stage)
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, status: e.target.value as any })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#6B2E4C]"
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stepNum}. {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      એડિટરને સોંપો (Assign Editor)
                    </label>
                    <select
                      value={editFormData.assignedTo || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, assignedTo: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold"
                    >
                      <option value="">-- એડિટર પસંદ કરો --</option>
                      {staff
                        .filter((s) => s.role === "editor" || s.role === "admin")
                        .map((ed) => (
                          <option key={ed.id} value={ed.id}>
                            👤 {ed.name} ({ed.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Raw Link & Frame.io Link */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      ગૂગલ ડ્રાઇવ / WeTransfer રૉ ફૂટેજ લિંક
                    </label>
                    <input
                      type="text"
                      value={editFormData.rawLink || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, rawLink: e.target.value })
                      }
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      Frame.io પ્રિવ્યૂ લિંક
                    </label>
                    <input
                      type="text"
                      value={editFormData.frameIoLink || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, frameIoLink: e.target.value })
                      }
                      placeholder="https://frame.io/rse/..."
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Camera & Songs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      કેમેરા / પ્રોફાઇલ
                    </label>
                    <input
                      type="text"
                      value={editFormData.cameraProfile || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, cameraProfile: e.target.value })
                      }
                      placeholder="Sony FX3 S-Log3 / Canon RAW"
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      સોંગ / મ્યુઝિક પસંદગી
                    </label>
                    <input
                      type="text"
                      value={editFormData.songPreference || ""}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, songPreference: e.target.value })
                      }
                      placeholder="ટ્રેક લિંક અથવા સૂચના"
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* ── Feature 4: Revision Round Tracker in Admin Edit ── */}
                <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-2xs font-bold text-[#6B2E4C] uppercase flex items-center space-x-1">
                      <span>🔄</span>
                      <span>રિવિઝન રાઉન્ડ ટ્રેકર (Revision Round)</span>
                    </label>
                    <div className="flex space-x-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            revisionRound: Math.max(0, (editFormData.revisionRound || 0) - 1),
                          })
                        }
                        className="px-2 py-0.5 rounded-lg bg-[#E5E5EA] text-[#1C1C1E] text-2xs font-bold hover:bg-[#D1D1D6]"
                      >
                        - ૧
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            revisionRound: (editFormData.revisionRound || 0) + 1,
                          })
                        }
                        className="px-2 py-0.5 rounded-lg bg-[#6B2E4C] text-white text-2xs font-bold hover:bg-[#58243E]"
                      >
                        + ૧ રિવિઝન ઉમેરો
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-2xs">
                    {[0, 1, 2, 3].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, revisionRound: r })}
                        className={`py-1 rounded-lg border font-bold transition ${
                          (editFormData.revisionRound || 0) === r
                            ? "bg-[#6B2E4C] text-white border-[#6B2E4C]"
                            : "bg-white text-[#3A3A3C] border-[#D1D1D6] hover:bg-[#F2F2F7]"
                        }`}
                      >
                        {r === 0 ? "v1 Initial" : r === 1 ? "Round 1" : r === 2 ? "Round 2" : `Round ${r}`}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-2xs text-[#8E8E93] mb-0.5">સુધારાની વિગત / Revision Notes:</label>
                    <input
                      type="text"
                      value={editFormData.revisionNotes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, revisionNotes: e.target.value })}
                      placeholder="દા.ત. ટીઝરમાં સોંગ ચેન્જ, હાઇલાઇટમાં સ્લો-મોશન એડજસ્ટ"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* ── Feature 5: Courier / SSD Tracking in Admin Edit ── */}
                <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-2xs font-bold text-[#6B2E4C] uppercase flex items-center space-x-1">
                      <Truck className="h-3 w-3" />
                      <span>કુરિયર / હાર્ડડ્રાઇવ (SSD) ટ્રેકિંગ</span>
                    </label>
                    <select
                      value={editFormData.deliveryMethod}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, deliveryMethod: e.target.value as any })
                      }
                      className="px-2 py-0.5 rounded-lg border border-[#D1D1D6] bg-white text-2xs font-bold"
                    >
                      <option value="online">🌐 ઓનલાઇન ડ્રાઇવ</option>
                      <option value="courier">🚚 કુરિયર SSD</option>
                    </select>
                  </div>

                  {editFormData.deliveryMethod === "courier" && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-2xs text-[#8E8E93] mb-0.5">કુરિયર કંપની:</label>
                          <input
                            type="text"
                            value={editFormData.ssdCourierCompany || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, ssdCourierCompany: e.target.value })
                            }
                            placeholder="Tirupati / DTDC / Maruti / By Hand"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-2xs text-[#8E8E93] mb-0.5">ટ્રેકિંગ / ડૉકેટ નંબર:</label>
                          <input
                            type="text"
                            value={editFormData.ssdTrackingNumber || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, ssdTrackingNumber: e.target.value })
                            }
                            placeholder="AWB / Docket No."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-2xs text-[#8E8E93] mb-1">SSD ફિઝિકલ સ્ટેટસ:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-2xs">
                          {[
                            { id: "not_sent", label: "⏳ નથી મોકલી" },
                            { id: "in_transit", label: "🚚 રસ્તામાં છે" },
                            { id: "received", label: "💾 સ્ટુડિયો આવી ગઈ" },
                            { id: "dispatched_back", label: "📦 પરત મોકલી" },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setEditFormData({ ...editFormData, ssdStatus: st.id as any })}
                              className={`py-1 rounded-lg border font-bold transition ${
                                (editFormData.ssdStatus || "not_sent") === st.id
                                  ? "bg-[#6B2E4C] text-white border-[#6B2E4C]"
                                  : "bg-white text-[#3A3A3C] border-[#D1D1D6] hover:bg-[#F2F2F7]"
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {editFormData.ssdStatus === "dispatched_back" && (
                        <div>
                          <label className="block text-2xs text-[#8E8E93] mb-0.5">
                            ક્લાયન્ટને પરત મોકલવાનો ડૉકેટ નંબર:
                          </label>
                          <input
                            type="text"
                            value={editFormData.ssdDispatchedDocket || ""}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, ssdDispatchedDocket: e.target.value })
                            }
                            placeholder="Return courier docket no."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pricing & Payments */}
                <div className="bg-[#F8F7F4] p-3.5 rounded-2xl border border-[#E5E5EA] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-[#6B2E4C] uppercase block">
                      પેમેન્ટ હિસાબ (Pricing & Payments)
                    </span>
                    <span className="text-2xs text-[#8E8E93]">૫૦% એડવાન્સ + ૫૦% આખરી</span>
                  </div>

                  {/* ── Smart Duration & Pricing Calculator Widget ── */}
                  <div className="bg-white p-3 rounded-xl border border-[#6B2E4C]/25 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-[#6B2E4C] uppercase flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>⏱️ સ્માર્ટ લંબાઈ કેલ્ક્યુલેટર (Auto Rate by Duration)</span>
                      </span>
                      <span className="text-2xs text-[#8E8E93]">નવા નિયમ મુજબ ઓટો-ગણતરી</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-2xs text-[#8E8E93] mb-0.5">સર્વિસ પ્રકાર:</label>
                        <select
                          value={calcSelectedService}
                          onChange={(e) => {
                            const srv = e.target.value;
                            setCalcSelectedService(srv);
                            handleApplyCalculatedPriceToEdit(srv, calcDurationInput, calcQuantity);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold"
                        >
                          <option value="in_wedding_highlight">Wedding Highlight (₹૧,૨૫૧/મિનિટ)</option>
                          <option value="in_trad_single_cam">Traditional Single-Cam (₹૧,૫૫૦/કલાક, Min 1h)</option>
                          <option value="in_trad_multi_cam">Traditional Multi-Cam (₹૧,૮૫૦/કલાક, Min 1h)</option>
                          <option value="in_wedding_short_film">Wedding Short Film (₹૧૬,૫૦૦ ફિક્સ)</option>
                          <option value="in_wedding_reel">Wedding Reel (₹૯૫૧/રીલ)</option>
                          <option value="in_wedding_insta_cut">Wedding Insta Cut (₹૧,૮૫૧/કટ)</option>
                          <option value="in_wedding_teaser">Wedding Teaser (₹૩,૫૦૦)</option>
                        </select>
                      </div>

                      {calcSelectedService === "in_wedding_highlight" ||
                      calcSelectedService === "in_trad_single_cam" ||
                      calcSelectedService === "in_trad_multi_cam" ? (
                        <div>
                          <label className="block text-2xs text-[#8E8E93] mb-0.5">
                            {calcSelectedService === "in_wedding_highlight"
                              ? "લંબાઈ (MM:SS, દા.ત. 05:40):"
                              : "લંબાઈ (HH:MM, દા.ત. 01:25 કે 0:35):"}
                          </label>
                          <input
                            type="text"
                            value={calcDurationInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCalcDurationInput(val);
                              handleApplyCalculatedPriceToEdit(calcSelectedService, val, calcQuantity);
                            }}
                            placeholder={calcSelectedService === "in_wedding_highlight" ? "05:40" : "01:25"}
                            className="w-full px-2 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-[#6B2E4C]"
                          />
                        </div>
                      ) : calcSelectedService === "in_wedding_reel" || calcSelectedService === "in_wedding_insta_cut" ? (
                        <div>
                          <label className="block text-2xs text-[#8E8E93] mb-0.5">નંગ / સંખ્યા (Quantity):</label>
                          <input
                            type="number"
                            min="1"
                            value={calcQuantity}
                            onChange={(e) => {
                              const q = Number(e.target.value) || 1;
                              setCalcQuantity(q);
                              handleApplyCalculatedPriceToEdit(calcSelectedService, calcDurationInput, q);
                            }}
                            className="w-full px-2 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold text-[#6B2E4C]"
                          />
                        </div>
                      ) : (
                        <div className="text-2xs text-[#8E8E93] flex items-center pt-4">
                          <span>ફિક્સ પેકેજ રેટ લાગુ પડશે</span>
                        </div>
                      )}

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyCalculatedPriceToEdit(calcSelectedService, calcDurationInput, calcQuantity)
                          }
                          className="w-full py-1.5 rounded-lg bg-[#6B2E4C] hover:bg-[#58243E] text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1 active:scale-95"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>ગણો & લાગુ કરો</span>
                        </button>
                      </div>
                    </div>

                    {calcFeedback && (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-2xs text-emerald-800 font-semibold flex items-center space-x-1 animate-fadeIn">
                        <span>{calcFeedback}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-2xs text-[#8E8E93] mb-0.5">કુલ રકમ ₹</label>
                      <input
                        type="number"
                        value={editFormData.pricing?.totalAmount || 0}
                        onChange={(e) => {
                          const tot = Number(e.target.value) || 0;
                          const adv = Math.round(tot / 2);
                          setEditFormData({
                            ...editFormData,
                            pricing: {
                              ...(editFormData.pricing || {
                                currency: "INR",
                                advancePaid: true,
                                finalPaid: false,
                              }),
                              totalAmount: tot,
                              advanceAmount: adv,
                              finalAmount: tot - adv,
                            },
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs text-[#8E8E93] mb-0.5">૫૦% એડવાન્સ ₹</label>
                      <input
                        type="number"
                        value={editFormData.pricing?.advanceAmount || 0}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            pricing: {
                              ...(editFormData.pricing || {
                                currency: "INR",
                                totalAmount: 0,
                                finalAmount: 0,
                                advancePaid: true,
                                finalPaid: false,
                              }),
                              advanceAmount: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs text-[#8E8E93] mb-0.5">આખરી ૫૦% ₹</label>
                      <input
                        type="number"
                        value={editFormData.pricing?.finalAmount || 0}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            pricing: {
                              ...(editFormData.pricing || {
                                currency: "INR",
                                totalAmount: 0,
                                advanceAmount: 0,
                                advancePaid: true,
                                finalPaid: false,
                              }),
                              finalAmount: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D1D6] bg-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E5EA] text-2xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.pricing?.advancePaid || false}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            pricing: {
                              ...(editFormData.pricing || {
                                totalAmount: 0,
                                advanceAmount: 0,
                                finalAmount: 0,
                                currency: "INR",
                                finalPaid: false,
                              }),
                              advancePaid: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-[#6B2E4C] h-3.5 w-3.5"
                      />
                      <span className="font-bold text-[#1C1C1E]">૫૦% એડવાન્સ જમા છે ✓</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.pricing?.finalPaid || false}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            pricing: {
                              ...(editFormData.pricing || {
                                totalAmount: 0,
                                advanceAmount: 0,
                                finalAmount: 0,
                                currency: "INR",
                                advancePaid: true,
                              }),
                              finalPaid: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-[#6B2E4C] h-3.5 w-3.5"
                      />
                      <span className="font-bold text-[#1C1C1E]">આખરી ૫૦% જમા છે ✓</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    વિશેષ સૂચનાઓ / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.notes || ""}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, notes: e.target.value })
                    }
                    placeholder="પ્રોજેક્ટ અંગે કોઈ વિશેષ નોંધ કે સૂચના..."
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA]">
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteBooking(
                        editFormData.id,
                        editFormData.code,
                        editFormData.coupleNames
                      )
                    }
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ડિલીટ કરો</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBooking(false);
                        setEditFormData(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-bold hover:bg-[#F8F7F4] transition"
                    >
                      રદ્દ કરો (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 active:scale-95"
                    >
                      <Check className="h-4 w-4" />
                      <span>ફેરફારો સાચવો (Save Changes)</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* MODE 2: VIEW DETAILS (With quick edit triggers) */
              <div className="space-y-3">
                {/* Special Labh Pancham 2026 Notice in Details Modal */}
                {selectedBookingForDetails.offerType === "labh_pancham_2026" && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-100/90 via-orange-100/70 to-amber-100/90 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl shrink-0">🪔</span>
                      <div>
                        <div className="font-extrabold text-xs text-[#6B2E4C] flex items-center space-x-1.5">
                          <span>RSE લાભ પાંચમ મુહૂર્ત બુકિંગ ઑફર '26</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-[#6B2E4C] font-black text-2xs">
                            15% OFF
                          </span>
                        </div>
                        <div className="text-2xs text-amber-900 font-medium">
                          {selectedBookingForDetails.pricing?.advancePaid
                            ? "✓ ટોકન પેમેન્ટ વેરિફાય થઈ ગયું છે. સ્લોટ સત્તાવાર કન્ફર્મ છે."
                            : "⚠️ ટોકન પેમેન્ટ હજી વેરિફાય થયું નથી. પેમેન્ટ વગર સ્લોટ બુક થયેલો ગણાશે નહીં."}
                        </div>
                      </div>
                    </div>
                    {currentPerms.canViewPricingAndInvoices && (
                    <div className="sm:text-right shrink-0">
                      {selectedBookingForDetails.pricing?.advancePaid ? (
                        <div className="font-mono text-xs font-black text-emerald-800 bg-white/90 px-2 py-1 rounded-lg border border-emerald-300">
                          ✓ સ્લોટ કન્ફર્મ
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...selectedBookingForDetails,
                              pricing: {
                                ...selectedBookingForDetails.pricing,
                                advancePaid: true,
                              },
                              notes: `${selectedBookingForDetails.notes || ""} | [✓ ₹1,000 પેમેન્ટ વેરિફાય & કન્ફર્મ]`,
                            };
                            updateBooking(updated);
                            setSelectedBookingForDetails(updated);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                        >
                          ✓ ₹1,000 પેમેન્ટ મંજૂર કરો
                        </button>
                      )}
                    </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E5E5EA] pb-2">
                  <div>
                    <h4 className="font-extrabold text-base text-[#1C1C1E]">
                      {selectedBookingForDetails.coupleNames}
                    </h4>
                    <p className="text-xs text-[#8E8E93]">{selectedBookingForDetails.studioOrClient}</p>
                    {currentPerms.canViewClientContacts && (
                      <p className="text-2xs font-mono text-[#8E8E93]">
                        ફોન: {selectedBookingForDetails.phone}
                      </p>
                    )}
                  </div>
                  {currentPerms.canViewClientContacts && (
                    <a
                      href={getWhatsAppUrl(
                        selectedBookingForDetails.phone,
                        getWhatsAppStageMessage(selectedBookingForDetails)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>WhatsApp ચેટ</span>
                    </a>
                  )}
                </div>

                {/* ── Feature 3: 1-Click WhatsApp Status Updates Box (Only when Client Contacts permitted) ── */}
                {currentPerms.canViewClientContacts && (
                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold text-emerald-900 uppercase flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-emerald-700" />
                        <span>૧-ક્લિક વોટ્સએપ સ્ટેટસ અપડેટ (Client WhatsApp)</span>
                      </span>
                      <a
                        href={getWhatsAppUrl(
                          selectedBookingForDetails.phone,
                          getWhatsAppStageMessage(selectedBookingForDetails)
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center space-x-1 shadow-sm active:scale-95"
                      >
                        <Send className="h-3 w-3" />
                        <span>મેસેજ મોકલો (Send)</span>
                      </a>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-2xs text-gray-800 font-sans whitespace-pre-line leading-relaxed shadow-2xs">
                      {getWhatsAppStageMessage(selectedBookingForDetails)}
                    </div>
                  </div>
                )}

                {/* ── Feature 4: Revision Round Tracker in View Mode ── */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA]">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xs font-bold text-[#8E8E93] uppercase">રિવિઝન રાઉન્ડ:</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-xs border ${
                        (selectedBookingForDetails.revisionRound || 0) === 0
                          ? "bg-gray-100 text-gray-700 border-gray-300"
                          : selectedBookingForDetails.revisionRound === 1
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : selectedBookingForDetails.revisionRound === 2
                          ? "bg-purple-100 text-purple-900 border-purple-300"
                          : "bg-red-100 text-red-900 border-red-300"
                      }`}
                    >
                      {(selectedBookingForDetails.revisionRound || 0) === 0
                        ? "v1 (ઓરિજિનલ કટ)"
                        : `🔄 Round #${selectedBookingForDetails.revisionRound}`}
                    </span>
                    {selectedBookingForDetails.revisionNotes && (
                      <span className="text-2xs text-[#3A3A3C] italic truncate max-w-[180px]">
                        ({selectedBookingForDetails.revisionNotes})
                      </span>
                    )}
                  </div>
                  {currentPerms.canEditBooking && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRound = (selectedBookingForDetails.revisionRound || 0) + 1;
                        const updated = {
                          ...selectedBookingForDetails,
                          revisionRound: nextRound,
                          status: "in_revision" as BookingStatus,
                        };
                        updateBooking(updated);
                        setSelectedBookingForDetails(updated);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#6B2E4C]/10 hover:bg-[#6B2E4C] text-[#6B2E4C] hover:text-white font-bold text-2xs transition active:scale-95"
                    >
                      + નવો રિવિઝન રાઉન્ડ
                    </button>
                  )}
                </div>

                {/* ── Feature 5: Courier SSD Physical Tracking in View Mode ── */}
                {selectedBookingForDetails.deliveryMethod === "courier" && (
                  <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center space-x-1">
                        <Truck className="h-3 w-3" />
                        <span>કુરિયર SSD વિગત:</span>
                      </span>
                      <span className="font-bold text-amber-900 px-2 py-0.5 rounded-md bg-white border border-amber-300">
                        {selectedBookingForDetails.ssdStatus === "received"
                          ? "💾 SSD સ્ટુડિયો આવી ગઈ ✓"
                          : selectedBookingForDetails.ssdStatus === "in_transit"
                          ? "🚚 SSD રસ્તામાં છે"
                          : selectedBookingForDetails.ssdStatus === "dispatched_back"
                          ? "📦 ક્લાયન્ટને પરત મોકલી દીધી"
                          : "⏳ ક્લાયન્ટે હજી નથી મોકલી"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-2xs text-[#3A3A3C]">
                      <span>
                        કુરિયર:{" "}
                        <strong>
                          {selectedBookingForDetails.ssdCourierCompany ||
                            selectedBookingForDetails.courierName ||
                            "ઉલ્લેખ નથી"}
                        </strong>
                      </span>
                      <span>
                        ટ્રેકિંગ / ડૉકેટ:{" "}
                        <strong className="font-mono">
                          {selectedBookingForDetails.ssdTrackingNumber ||
                            selectedBookingForDetails.docketNumber ||
                            "ઉલ્લેખ નથી"}
                        </strong>
                      </span>
                    </div>
                    {selectedBookingForDetails.ssdDispatchedDocket && (
                      <div className="text-2xs text-blue-800 pt-0.5">
                        પરત મોકલવાનો ડૉકેટ નંબર:{" "}
                        <strong className="font-mono">
                          {selectedBookingForDetails.ssdDispatchedDocket}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] text-2xs">
                  <div>
                    <span className="text-[#8E8E93] block">સ્લોટ તારીખ:</span>
                    <strong className="text-xs text-[#1C1C1E]">
                      {selectedBookingForDetails.slotDate}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#8E8E93] block">ડિલિવરી ટાર્ગેટ:</span>
                    <strong className="text-xs text-[#6B2E4C]">
                      {selectedBookingForDetails.deliveryDate}
                    </strong>
                  </div>
                </div>

                {/* Assignment to Editor (Only when All Bookings + Edit allowed) */}
                {currentPerms.canViewAllBookings && currentPerms.canEditBooking && (
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-[#8E8E93] uppercase">
                      એડિટરને સોંપો (Assign Staff Member):
                    </label>
                    <select
                      value={selectedBookingForDetails.assignedTo || ""}
                      onChange={(e) => {
                        assignBooking(selectedBookingForDetails.id, e.target.value);
                        setSelectedBookingForDetails({
                          ...selectedBookingForDetails,
                          assignedTo: e.target.value,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold"
                    >
                      <option value="">-- એડિટર પસંદ કરો --</option>
                      {staff
                        .filter((s) => s.role === "editor" || s.role === "admin")
                        .map((ed) => (
                          <option key={ed.id} value={ed.id}>
                            👤 {ed.name} ({ed.role})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Stage Progress */}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-[#8E8E93] uppercase">
                    પાઇપલાઇન સ્ટેજ (Current Stage):
                  </label>
                  <select
                    value={selectedBookingForDetails.status}
                    onChange={(e) => {
                      updateBookingStatus(selectedBookingForDetails.id, e.target.value as any);
                      setSelectedBookingForDetails({
                        ...selectedBookingForDetails,
                        status: e.target.value as any,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-bold text-[#6B2E4C]"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.stepNum}. {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Summary & Toggle (Strictly hidden when Pricing permission is OFF) */}
                {currentPerms.canViewPricingAndInvoices && (
                <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-2 text-xs">
                  <div className="flex justify-between items-center text-2xs">
                    <span className="font-semibold text-[#8E8E93]">૫૦% એડવાન્સ રકમ:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      ₹{(selectedBookingForDetails.pricing?.advanceAmount || 0).toLocaleString("en-IN")}{" "}
                      (જમા થયેલ ✓)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-2xs">
                    <span className="font-semibold text-[#8E8E93]">આખરી ૫૦% રકમ:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const curPricing = selectedBookingForDetails.pricing || {
                          advanceAmount: 0,
                          finalAmount: 0,
                          totalAmount: 0,
                          advancePaid: true,
                          finalPaid: false,
                        };
                        const updated = {
                          ...selectedBookingForDetails,
                          pricing: {
                            ...curPricing,
                            finalPaid: !curPricing.finalPaid,
                          },
                        };
                        updateBooking(updated);
                        setSelectedBookingForDetails(updated);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-2xs border transition ${
                        selectedBookingForDetails.pricing?.finalPaid
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                      }`}
                    >
                      ₹{(selectedBookingForDetails.pricing?.finalAmount || 0).toLocaleString("en-IN")} -{" "}
                      {selectedBookingForDetails.pricing?.finalPaid
                        ? "ચુકવાઈ ગયેલ ✓"
                        : "બાકી (ક્લિક કરી જમા કરો)"}
                    </button>
                  </div>
                </div>
                )}

                {/* Raw Footage Link */}
                <div>
                  <a
                    href={selectedBookingForDetails.rawLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs hover:bg-[#58243E] transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <HardDrive className="h-4 w-4" />
                    <span>ગૂગલ ડ્રાઇવ / WeTransfer રૉ ફૂટેજ ખોલો</span>
                  </a>
                </div>

                {/* Frame.io Link updater */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setFrameIoInputModalBooking(selectedBookingForDetails);
                      setTempFrameIoLink(selectedBookingForDetails.frameIoLink || "");
                    }}
                    className="w-full py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-900 font-bold text-xs hover:bg-pink-100 transition flex items-center justify-center space-x-1.5"
                  >
                    <span>
                      {selectedBookingForDetails.frameIoLink
                        ? "✓ Frame.io પ્રિવ્યૂ લિંક અપડેટ કરો"
                        : "+ Frame.io પ્રિવ્યૂ લિંક ઉમેરો"}
                    </span>
                  </button>
                </div>

                {/* Notes */}
                {selectedBookingForDetails.notes && (
                  <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA] space-y-1">
                    <span className="text-2xs font-bold text-[#8E8E93] uppercase">
                      વિશેષ સૂચનાઓ / Notes:
                    </span>
                    <p className="text-xs text-[#3A3A3C]">{selectedBookingForDetails.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-[#E5E5EA]">
                  <button
                    onClick={() => setSelectedBookingForDetails(null)}
                    className="px-4 py-1.5 rounded-xl bg-[#E5E5EA] text-[#1C1C1E] font-bold text-xs hover:bg-[#D1D1D6] transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: FRAME.IO PREVIEW LINK UPDATER */}
      {frameIoInputModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E]">
                Frame.io પ્રિવ્યૂ લિંક સેટ કરો
              </h3>
              <button
                onClick={() => setFrameIoInputModalBooking(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-2xs text-[#8E8E93]">
                પ્રોજેક્ટ: <strong>{frameIoInputModalBooking.coupleNames}</strong> (
                {frameIoInputModalBooking.code})
              </p>
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  Frame.io Review URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://frame.io/rse/..."
                  value={tempFrameIoLink}
                  onChange={(e) => setTempFrameIoLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-pink-50 border border-pink-200 text-pink-900 rounded-xl text-2xs space-y-1">
                <p className="font-bold">✓ ૭ દિવસનું કરેક્શન ટાઈમર શરૂ થશે:</p>
                <p>આ લિંક ક્લાયન્ટને મળ્યા પછી ૭ દિવસ સુધી રિવિઝન માન્ય રહેશે.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setFrameIoInputModalBooking(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tempFrameIoLink.trim()) {
                      updateFrameIo(frameIoInputModalBooking.id, tempFrameIoLink.trim());
                      setFrameIoInputModalBooking(null);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs"
                >
                  પ્રિવ્યૂ લિંક સેવ કરો
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: STAFF PAY SLIP POPUP */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E]">
                RSE STUDIO • EMPLOYEE PAY SLIP
              </h3>
              <button
                onClick={() => setSelectedStaffForSlip(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E5EA]">
                <p className="font-bold text-sm text-[#1C1C1E]">{selectedStaffForSlip.name}</p>
                <p className="text-2xs text-[#8E8E93] capitalize">
                  {selectedStaffForSlip.role} • {selectedStaffForSlip.email}
                </p>
              </div>

              <div className="divide-y divide-[#E5E5EA] font-mono text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-[#8E8E93]">બેઝિક માસિક પગાર:</span>
                  <span className="font-bold text-[#1C1C1E]">
                    ₹{selectedStaffForSlip.baseSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#8E8E93]">હાજરી ભરેલ દિવસો:</span>
                  <span className="font-bold text-emerald-800">
                    {
                      attendance.filter(
                        (a) =>
                          a.staffId === selectedStaffForSlip.id &&
                          a.date.startsWith(new Date().toISOString().slice(0, 7))
                      ).length
                    }{" "}
                    દિવસ
                  </span>
                </div>
                <div className="py-2.5 flex justify-between font-bold text-sm bg-[#F8F7F4] px-2 rounded-xl">
                  <span className="text-[#1C1C1E]">ચુકવવાપાત્ર રકમ (Net):</span>
                  <span className="text-[#6B2E4C]">
                    ₹{selectedStaffForSlip.baseSalary.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs font-semibold flex items-center space-x-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>પ્રિન્ટ</span>
                </button>
                <button
                  onClick={() => setSelectedStaffForSlip(null)}
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: WHATSAPP GROUP LINK */}
      {editingClientWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E]">
                WhatsApp Group Link: {editingClientWhatsApp.studioName}
              </h3>
              <button
                onClick={() => setEditingClientWhatsApp(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  WhatsApp Group Invite Link
                </label>
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={editingClientWhatsApp.url}
                  onChange={(e) =>
                    setEditingClientWhatsApp({
                      ...editingClientWhatsApp,
                      url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setEditingClientWhatsApp(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateClientWhatsAppGroup(
                      editingClientWhatsApp.id,
                      editingClientWhatsApp.url.trim()
                    );
                    setEditingClientWhatsApp(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs"
                >
                  Save Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: RESCHEDULE DELAYED PROJECT */}
      {rescheduleModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="apple-glass-card w-full max-w-md p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-1.5">
                <RefreshCw className="h-4 w-4 text-[#6B2E4C]" />
                <span>સ્લોટ આગળ ખસેડો (Reschedule Delayed Footage)</span>
              </h3>
              <button
                onClick={() => setRescheduleModalBooking(null)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-2xs text-[#8E8E93]">
                પ્રોજેક્ટ:{" "}
                <strong>
                  {rescheduleModalBooking.coupleNames} ({rescheduleModalBooking.code})
                </strong>
              </p>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  આગામી ખાલી સ્લોટ પસંદ કરો *
                </label>
                <input
                  type="date"
                  defaultValue={findNextAvailableSlot(
                    rescheduleModalBooking.slotDate,
                    rescheduleModalBooking.editorDays
                  )}
                  id="newSlotInput"
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white text-xs font-mono font-bold text-[#6B2E4C]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => setRescheduleModalBooking(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-xs"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const elem = document.getElementById("newSlotInput") as HTMLInputElement;
                    if (elem && elem.value) {
                      rescheduleBooking(
                        rescheduleModalBooking.id,
                        elem.value,
                        "Footage delayed by client"
                      );
                      setRescheduleModalBooking(null);
                    }
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#6B2E4C] text-white font-bold text-xs"
                >
                  સ્લોટ શિફ્ટ કરો
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: CREATE / GENERATE OFFICIAL INVOICE */}
      {(invoiceModalBooking || showNewInvoiceModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="apple-glass-card w-full max-w-2xl p-6 rounded-3xl space-y-4 shadow-2xl bg-white text-xs my-8">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="font-bold text-sm text-[#1C1C1E] flex items-center space-x-2">
                <FileText className="h-4 w-4 text-[#6B2E4C]" />
                <span>સત્તાવાર RSE ઇન્વોઇસ બનાવો (Generate Official Invoice)</span>
              </h3>
              <button
                onClick={() => {
                  setInvoiceModalBooking(null);
                  setShowNewInvoiceModal(false);
                }}
                className="text-[#8E8E93] hover:text-[#1C1C1E] font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);

                const clientName = fd.get("clientName") as string;
                const studioName = fd.get("studioName") as string;
                const phone = fd.get("phone") as string;
                const invoiceNumber = fd.get("invoiceNumber") as string;
                const issueDate = fd.get("issueDate") as string;
                const dueDate = fd.get("dueDate") as string;
                const itemDesc = fd.get("itemDesc") as string;
                const itemDuration = fd.get("itemDuration") as string;
                const totalAmount = parseFloat(fd.get("totalAmount") as string) || 0;
                const advancePaid = parseFloat(fd.get("advancePaid") as string) || 0;
                const balanceDue = Math.max(0, totalAmount - advancePaid);
                const notes = fd.get("notes") as string;

                const newInvoice: Omit<Invoice, "id" | "createdAt"> = {
                  invoiceNumber,
                  bookingId: invoiceModalBooking?.id,
                  bookingCode: invoiceModalBooking?.code,
                  clientName,
                  studioName,
                  phone,
                  issueDate,
                  dueDate,
                  items: [
                    {
                      id: `item_${Date.now()}`,
                      description: itemDesc,
                      duration: itemDuration,
                      unitPrice: totalAmount,
                      quantity: 1,
                      amount: totalAmount,
                    },
                  ],
                  subtotal: totalAmount,
                  discount: 0,
                  totalAmount,
                  advancePaid,
                  balanceDue,
                  status: balanceDue <= 0 ? "paid" : advancePaid > 0 ? "partially_paid" : "unpaid",
                  currency: "INR",
                  notes: notes || "All exports are delivered in ProRes 422 / 4K. Balance 50% due before master delivery.",
                  bankDetails: {
                    accountName: "RSE Post Production House",
                    accountNumber: "50200088991122",
                    ifsc: "HDFC0001234",
                    bankName: "HDFC Bank, Gandhinagar",
                    upiId: "rse.edit@upi",
                  },
                };

                const saved = await addInvoice(newInvoice);
                setInvoiceModalBooking(null);
                setShowNewInvoiceModal(false);
                setSelectedInvoiceForView(saved);
              }}
              className="space-y-4"
            >
              {/* Row 1: Invoice No, Issue Date, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ઇન્વોઇસ નંબર *
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    required
                    defaultValue={
                      invoiceModalBooking
                        ? `RSE/INV/${new Date().getFullYear()}/${invoiceModalBooking.code.replace("RSE/", "")}`
                        : `RSE/INV/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] font-mono font-bold text-[#6B2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ઇશ્યુ તારીખ *
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ડ્યુ ડેટ (Due Date)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Client Name, Studio Name, WhatsApp Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    ક્લાયન્ટ / કપલ નામ *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    required
                    defaultValue={invoiceModalBooking?.coupleNames || ""}
                    placeholder="દા.ત. Karan & Tanya"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    સ્ટુડિયો / પ્રોડક્શન
                  </label>
                  <input
                    type="text"
                    name="studioName"
                    defaultValue={invoiceModalBooking?.studioOrClient || ""}
                    placeholder="દા.ત. Lumina Films"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6]"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                    WhatsApp ફોન *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={invoiceModalBooking?.phone || ""}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] font-mono"
                  />
                </div>
              </div>

              {/* Row 3: Deliverable & Duration Calculation */}
              <div className="p-3.5 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] space-y-3">
                <span className="text-2xs font-bold text-[#6B2E4C] uppercase tracking-wider block">
                  સર્વિસ વિગત & રેટ કેલ્ક્યુલેશન (Service Item)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      સર્વિસ નામ / ડિસ્ક્રિપ્શન *
                    </label>
                    <input
                      type="text"
                      name="itemDesc"
                      required
                      defaultValue={
                        invoiceModalBooking
                          ? invoiceModalBooking.packageType || invoiceModalBooking.serviceId
                          : "Wedding Highlight (3 to 5 min) - Color Graded"
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      ડ્યુરેશન (MM:SS અથવા HH:MM)
                    </label>
                    <input
                      type="text"
                      name="itemDuration"
                      defaultValue={
                        invoiceModalBooking?.notes?.includes(":")
                          ? invoiceModalBooking.notes
                          : "05:40"
                      }
                      placeholder="દા.ત. 05:40"
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white font-mono font-bold text-[#6B2E4C]"
                    />
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      કુલ રકમ (Total Amount INR) *
                    </label>
                    <input
                      type="number"
                      name="totalAmount"
                      required
                      defaultValue={
                        invoiceModalBooking?.pricing?.totalAmount ||
                        (invoiceModalBooking ? 7089 : 12500)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white font-mono font-extrabold text-sm text-[#1C1C1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                      મળેલ ૫૦% એડવાન્સ રકમ (Advance Paid INR)
                    </label>
                    <input
                      type="number"
                      name="advancePaid"
                      defaultValue={
                        invoiceModalBooking?.pricing?.advanceAmount ||
                        (invoiceModalBooking?.pricing?.advancePaid
                          ? Math.round((invoiceModalBooking?.pricing?.totalAmount || 0) * 0.5)
                          : 0)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] bg-white font-mono font-bold text-sm text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  ઇન્વોઇસ નોટ્સ / શરતો
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue="All exports are delivered in ProRes 422 / 4K. Balance 50% must be cleared before master release. Payment via UPI / Bank Transfer."
                  className="w-full px-3 py-2 rounded-xl border border-[#D1D1D6] text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5E5EA]">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceModalBooking(null);
                    setShowNewInvoiceModal(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-semibold hover:bg-[#F8F7F4]"
                >
                  રદ્દ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>💾 ક્લાઉડમાં સેવ કરો & બિલ જુઓ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 10: OFFICIAL RSE PRINTABLE INVOICE / PDF VIEWER */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          {/* Print CSS styling embedded cleanly */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * { visibility: hidden !important; }
                #printableInvoiceArea, #printableInvoiceArea * { visibility: visible !important; }
                #printableInvoiceArea {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 32px !important;
                  background: white !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print { display: none !important; }
              }
            `
          }} />

          <div className="w-full max-w-3xl my-6 flex flex-col space-y-3">
            {/* Top Toolbar (Hidden when printing) */}
            <div className="no-print apple-glass-card bg-white p-3 rounded-2xl flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs text-[#1C1C1E]">
                  ઇન્વોઇસ: <span className="font-mono text-[#6B2E4C]">{selectedInvoiceForView.invoiceNumber}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${
                    selectedInvoiceForView.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedInvoiceForView.status === "partially_paid"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedInvoiceForView.status === "paid"
                    ? "PAID"
                    : selectedInvoiceForView.status === "partially_paid"
                    ? "50% ADVANCE PAID"
                    : "PAYMENT DUE"}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>🖨️ બિલ પ્રિન્ટ / Save as PDF</span>
                </button>
                {selectedInvoiceForView.phone && (
                  <a
                    href={`https://wa.me/${selectedInvoiceForView.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `નમસ્તે ${selectedInvoiceForView.clientName},\nRSE પોસ્ટ પ્રોડક્શન તરફથી ઇન્વોઇસ #${selectedInvoiceForView.invoiceNumber}:\nકુલ રકમ: ₹${selectedInvoiceForView.totalAmount}\nમળેલ એડવાન્સ: ₹${selectedInvoiceForView.advancePaid}\nબાકી રકમ: ₹${selectedInvoiceForView.balanceDue}\nથેન્ક યુ! - RSE Studio`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
                  >
                    <span>WA Share</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#D1D1D6] bg-white text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E]"
                >
                  ✕ બંધ કરો
                </button>
              </div>
            </div>

            {/* Official A4 Paper Invoice Sheet */}
            <div
              id="printableInvoiceArea"
              className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E5E5EA] shadow-2xl text-[#1C1C1E] space-y-6 font-sans"
            >
              {/* Header Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-[#6B2E4C] pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="h-8 w-8 rounded-xl bg-[#6B2E4C] text-white flex items-center justify-center font-bold text-sm">
                      R
                    </span>
                    <h1 className="text-xl font-extrabold tracking-tight text-[#1C1C1E]">
                      RSE POST PRODUCTION HOUSE
                    </h1>
                  </div>
                  <p className="text-2xs font-semibold text-[#6B2E4C] uppercase tracking-wider mt-1">
                    Boutique Wedding Video Editing & Cinema 4K Color Grading
                  </p>
                  <p className="text-xs text-[#8E8E93] mt-1">
                    Gandhinagar, Gujarat, India • Email: Keyur@rse-edit.com • Web: book.rsegnr.in
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider block">
                    TAX INVOICE / બિલ
                  </span>
                  <div className="text-base font-mono font-extrabold text-[#6B2E4C] mt-0.5">
                    {selectedInvoiceForView.invoiceNumber}
                  </div>
                  <div className="text-xs text-[#3A3A3C] mt-1">
                    તારીખ: <span className="font-mono font-semibold">{selectedInvoiceForView.issueDate}</span>
                  </div>
                  {selectedInvoiceForView.dueDate && (
                    <div className="text-2xs text-[#8E8E93]">
                      ડ્યુ ડેટ: <span className="font-mono">{selectedInvoiceForView.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To & Project Reference */}
              <div className="grid grid-cols-2 gap-6 bg-[#F8F7F4] p-4 rounded-2xl border border-[#E5E5EA]">
                <div>
                  <span className="text-2xs font-bold text-[#8E8E93] uppercase tracking-wider block mb-1">
                    બિલ મેળવનાર (Bill To)
                  </span>
                  <div className="font-bold text-sm text-[#1C1C1E]">
                    {selectedInvoiceForView.clientName}
                  </div>
                  {selectedInvoiceForView.studioName && (
                    <div className="text-xs text-[#6B2E4C] font-semibold mt-0.5">
                      {selectedInvoiceForView.studioName}
                    </div>
                  )}
                  <div className="text-xs font-mono text-[#3A3A3C] mt-1">
                    📞 {selectedInvoiceForView.phone}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xs font-bold text-[#8E8E93] uppercase tracking-wider block mb-1">
                    પ્રોજેક્ટ વિગત (Reference)
                  </span>
                  {selectedInvoiceForView.bookingCode && (
                    <div className="font-mono font-bold text-xs text-[#6B2E4C]">
                      બુકિંગ કોડ: {selectedInvoiceForView.bookingCode}
                    </div>
                  )}
                  <div className="text-xs text-[#8E8E93] mt-1">
                    સ્થળ: {selectedInvoiceForView.city || "Gujarat, India"}
                  </div>
                  <div className="text-2xs text-[#8E8E93]">
                    કરન્સી: {selectedInvoiceForView.currency || "INR"}
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-[#E5E5EA] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F7F4] text-[#8E8E93] text-2xs uppercase border-b border-[#E5E5EA]">
                    <tr>
                      <th className="px-4 py-3 font-bold">#</th>
                      <th className="px-4 py-3 font-bold">સર્વિસ / ડિસ્ક્રિપ્શન</th>
                      <th className="px-4 py-3 font-bold text-center">એક્સપોર્ટ ડ્યુરેશન</th>
                      <th className="px-4 py-3 font-bold text-right">રકમ (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {selectedInvoiceForView.items && selectedInvoiceForView.items.length > 0 ? (
                      selectedInvoiceForView.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="px-4 py-3 font-mono text-[#8E8E93]">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-[#1C1C1E]">
                            <div>{item.description}</div>
                            <div className="text-2xs text-[#8E8E93]">
                              Cinema Color Graded + Audio Mastered (ProRes 422 / 4K)
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-center text-[#6B2E4C]">
                            {item.duration || "Standard"}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-right text-[#1C1C1E]">
                            ₹{item.amount?.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-mono text-[#8E8E93]">1</td>
                        <td className="px-4 py-3 font-medium text-[#1C1C1E]">
                          વેડિંગ વિડિયો એડિટિંગ અને કલર ગ્રેડિંગ સર્વિસ
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-center text-[#6B2E4C]">-</td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-[#1C1C1E]">
                          ₹{selectedInvoiceForView.totalAmount?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Bank / Payment Info */}
                <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] space-y-1.5 text-xs">
                  <span className="text-2xs font-bold text-[#6B2E4C] uppercase tracking-wider block mb-1">
                    🏦 બેંક એકાઉન્ટ & પેમેન્ટ વિગત
                  </span>
                  <div>એકાઉન્ટ: <strong>{selectedInvoiceForView.bankDetails?.accountName || "RSE Post Production House"}</strong></div>
                  <div>બેંક: <strong>{selectedInvoiceForView.bankDetails?.bankName || "HDFC Bank"}</strong></div>
                  <div>એકાઉન્ટ નં: <span className="font-mono font-bold">{selectedInvoiceForView.bankDetails?.accountNumber || "50200088991122"}</span></div>
                  <div>IFSC: <span className="font-mono font-bold">{selectedInvoiceForView.bankDetails?.ifsc || "HDFC0001234"}</span></div>
                  <div>UPI ID: <span className="font-mono font-bold text-[#6B2E4C]">{selectedInvoiceForView.bankDetails?.upiId || "rse.edit@upi"}</span></div>
                </div>

                {/* Totals Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E5E5EA]">
                    <span className="text-[#8E8E93]">કુલ સબટોટલ (Subtotal):</span>
                    <span className="font-mono font-bold">₹{selectedInvoiceForView.totalAmount?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E5EA] text-emerald-700">
                    <span>મળેલ ૫૦% એડવાન્સ (Advance Paid):</span>
                    <span className="font-mono font-bold">- ₹{selectedInvoiceForView.advancePaid?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b-2 border-[#1C1C1E] text-sm font-extrabold text-[#6B2E4C]">
                    <span>બાકી રકમ (Net Balance Due):</span>
                    <span className="font-mono">₹{selectedInvoiceForView.balanceDue?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Authorized Signature */}
              <div className="flex items-end justify-between pt-6 border-t border-[#E5E5EA]">
                <div className="max-w-md space-y-1">
                  <span className="text-2xs font-bold text-[#8E8E93] uppercase">નોંધ / નિયમો:</span>
                  <p className="text-2xs text-[#8E8E93] leading-relaxed">
                    {selectedInvoiceForView.notes ||
                      "All exports are delivered in ProRes 422 / 4K. Balance 50% must be cleared before unwatermarked master release."}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs font-bold text-[#1C1C1E]">RSE Post Production House</div>
                  <div className="h-10"></div>
                  <div className="text-2xs text-[#8E8E93] border-t border-[#D1D1D6] pt-1">
                    Authorized Signatory (Keyur Rao / Nirali Dhorajiya)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-6 safe-bottom" />
    </div>
  );
}
