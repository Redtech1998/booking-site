"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { STAFF } from "@/data/seed";
import { Booking, BookingStatus, StaffMember, Client } from "@/types";
import {
  Kanban,
  Calendar,
  Users,
  Plus,
  ExternalLink,
  Globe,
  Phone,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
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
} from "lucide-react";

// ─── 8-Stage Production Kanban ──────────────────────────────────────
const STAGES: {
  id: BookingStatus;
  label: string;
  countColor: string;
  description: string;
}[] = [
  {
    id: "new_deposit_pending",
    label: "૧. નવું / ૫૦% એડવાન્સ",
    countColor: "bg-amber-100 text-amber-900 border-amber-300",
    description: "સ્લોટ બુકિંગ - ડિપોઝીટ બાકી",
  },
  {
    id: "awaiting_footage",
    label: "૨. ડેટાની રાહમાં",
    countColor: "bg-blue-100 text-blue-900 border-blue-300",
    description: "HDD કુરિયર કે ડ્રાઇવ લિંક",
  },
  {
    id: "in_selection_cut",
    label: "૩. સિલેક્શન અને કટ",
    countColor: "bg-indigo-100 text-indigo-900 border-indigo-300",
    description: "Premiere Pro Culling",
  },
  {
    id: "in_edit_polish",
    label: "૪. ફાઇનલ એડિટિંગ",
    countColor: "bg-purple-100 text-purple-900 border-purple-300",
    description: "કલર ગ્રેડ & સાઉન્ડ",
  },
  {
    id: "preview_sent",
    label: "૫. પ્રિવ્યૂ Frame.io",
    countColor: "bg-pink-100 text-pink-900 border-pink-300",
    description: "૭ દિવસનું કરેક્શન ટાઈમર",
  },
  {
    id: "in_revision",
    label: "૬. શનિવાર કરેક્શન",
    countColor: "bg-orange-100 text-orange-900 border-orange-300",
    description: "ક્લાયન્ટ ફીડબેક કામ",
  },
  {
    id: "ready_for_final",
    label: "૭. આખરી ૫૦% બાકી",
    countColor: "bg-cyan-100 text-cyan-900 border-cyan-300",
    description: "બિલિંગ ક્લીયરન્સ",
  },
  {
    id: "delivered_done",
    label: "૮. ડિલિવર થયેલ ✅",
    countColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "સંપૂર્ણ પૂર્ણ થયેલ",
  },
];

export default function HomePage() {
  const {
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
    updateClientWhatsAppGroup,
    services,
    updateServicePrice,
    holidays,
    addHoliday,
    removeHoliday,
    findNextAvailableSlot,
    attendance,
    punchIn,
    punchOut,
    todayRecord,
  } = useApp();

  // Login Form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Tab: 'kanban' | 'slots' | 'clients' | 'staff' | 'settings'
  const [adminTab, setAdminTab] = useState<
    "kanban" | "slots" | "clients" | "staff" | "settings"
  >("kanban");

  // Employee Tab
  const [employeeTab, setEmployeeTab] = useState<"my_tasks" | "my_salary">("my_tasks");

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
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

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | "indian" | "foreign">("all");

  // New Booking form fields
  const [formCouple, setFormCouple] = useState("");
  const [formStudio, setFormStudio] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRegion, setFormRegion] = useState<"indian" | "foreign">("indian");
  const [formEventDate, setFormEventDate] = useState("2026-11-20");
  const [formSlotDate, setFormSlotDate] = useState("2026-11-05");
  const [formDeliveryDate, setFormDeliveryDate] = useState("2026-11-12");
  const [formPackage, setFormPackage] = useState("Wedding Highlight");
  const [formDeliveryMethod, setFormDeliveryMethod] = useState<"courier" | "online">("online");
  const [formRawLink, setFormRawLink] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPrice, setFormPrice] = useState(25000);

  // New Holiday form
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || "ખોટો ઈમેઈલ અથવા પાસવર્ડ");
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCouple.trim() || !formStudio.trim()) return;

    addBooking({
      source: "manual",
      region: formRegion,
      customerType: "new",
      coupleNames: formCouple,
      studioOrClient: formStudio,
      phone: formPhone,
      email: formEmail,
      eventDate: formEventDate,
      slotDate: formSlotDate,
      deliveryDate: formDeliveryDate,
      serviceId: formRegion === "foreign" ? "f_wedding_highlight" : "in_wedding_highlight",
      packageType: formPackage,
      editorDays: 3,
      clientDays: 5,
      deliveryMethod: formDeliveryMethod,
      rawLink: formRawLink || "https://drive.google.com/sample",
      notes: formNotes,
      pricing: {
        totalAmount: Number(formPrice) || 25000,
        advanceAmount: Math.round((Number(formPrice) || 25000) * 0.5),
        finalAmount: Math.round((Number(formPrice) || 25000) * 0.5),
        advancePaid: true,
        finalPaid: false,
        currency: formRegion === "foreign" ? "USD" : "INR",
      },
      status: "awaiting_footage",
    });

    setFormCouple("");
    setFormStudio("");
    setFormPhone("");
    setFormEmail("");
    setFormRawLink("");
    setFormNotes("");
    setShowNewModal(false);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchQuery =
      b.coupleNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.studioOrClient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery);

    const matchRegion = regionFilter === "all" || b.region === regionFilter;
    return matchQuery && matchRegion;
  });

  // -------------------------------------------------------------
  // SCREEN 1: LOGIN (Email & Password)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <img
                src="/rse-logo.png"
                alt="RSE Post Production House"
                className="h-16 w-16 rounded-full object-contain shadow-md border-2 border-[#6b2e4c]/20"
              />
            </div>
            <h1 className="text-xl font-bold text-ink tracking-tight">Post Production House</h1>
            <p className="text-xs text-ink-2">Workstation Login • તમારો ઈમેઈલ અને પાસવર્ડ નાખીને લોગિન કરો</p>
          </div>

          <div className="card p-6 space-y-4 shadow-float">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded bg-danger-bg border border-danger/30 text-danger text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="label">ઈમેઈલ આઈડી (Email ID) *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-ink-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@rse.studio"
                    className="input pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="label">પાસવર્ડ (Password) *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-ink-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-9 pr-9 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-ink-3 hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5">
                લોગિન કરો (Sign In)
              </button>
            </form>

            <div className="pt-3 border-t border-line space-y-2">
              <p className="text-2xs text-ink-3 font-semibold uppercase tracking-wider text-center">
                ઝડપી ટેસ્ટ લોગિન (Click to Auto-fill):
              </p>
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <button
                  type="button"
                  onClick={() => handleQuickFill("harsh@rse.studio", "rse@123")}
                  className="p-2 rounded border border-line bg-subtle hover:bg-surface text-left"
                >
                  <p className="font-bold text-ink">Harsh Patel</p>
                  <p className="text-ink-3">Admin (Owner)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("smit@rse.studio", "smit@123")}
                  className="p-2 rounded border border-line bg-subtle hover:bg-surface text-left"
                >
                  <p className="font-bold text-ink">Smit Shah</p>
                  <p className="text-ink-3">Lead Editor</p>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center text-2xs text-ink-3">
            <Link href="/book" className="text-brand hover:underline font-semibold">
              → ક્લાયન્ટ બુકિંગ પોર્ટલ (book.rsegnr.in) ખોલો
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCREEN 2: LOGGED IN (ADMIN or EMPLOYEE DESK)
  // -------------------------------------------------------------
  const isAdmin = currentUser.role === "admin";

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col text-ink">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-surface border-b border-line px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/rse-logo.png"
                alt="RSE Post Production House"
                className="h-9 w-9 rounded-full object-contain shadow-sm border border-[#6b2e4c]/20"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm tracking-tight text-ink">Post Production OS</span>
                  <span className="badge bg-purple-100 text-purple-900 border border-purple-300 font-bold text-2xs">
                    Admin Workstation
                  </span>
                </div>
                <p className="text-2xs text-ink-3">ગાંધીનગર • Post Production Suite</p>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="hidden lg:flex items-center bg-subtle p-1 rounded-lg border border-line text-xs">
              <button
                onClick={() => setAdminTab("kanban")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                  adminTab === "kanban"
                    ? "bg-surface text-ink shadow-sm font-bold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>કાનબન પાઇપલાઇન ({bookings.length})</span>
              </button>

              <button
                onClick={() => setAdminTab("slots")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                  adminTab === "slots"
                    ? "bg-surface text-ink shadow-sm font-bold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>બધા સ્લોટ્સ રજિસ્ટર</span>
              </button>

              <button
                onClick={() => setAdminTab("clients")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                  adminTab === "clients"
                    ? "bg-surface text-ink shadow-sm font-bold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>ક્લાયન્ટ્સ ડિરેક્ટરી ({clients.length})</span>
              </button>

              <button
                onClick={() => setAdminTab("staff")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                  adminTab === "staff"
                    ? "bg-surface text-ink shadow-sm font-bold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>સ્ટાફ & પેરોલ</span>
              </button>

              <button
                onClick={() => setAdminTab("settings")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                  adminTab === "settings"
                    ? "bg-surface text-ink shadow-sm font-bold"
                    : "text-ink-2 hover:text-ink"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>સર્વિસિસ ભાવ & રજાઓ</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2.5">
              <button onClick={() => setShowNewModal(true)} className="btn-primary text-xs py-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>+ નવું કામ ઉમેરો</span>
              </button>

              <Link
                href="/book"
                target="_blank"
                className="btn-outline text-xs hidden sm:inline-flex"
              >
                <span>બુકિંગ સાઇટ</span>
                <ExternalLink className="h-3 w-3 text-ink-3" />
              </Link>

              <div className="flex items-center space-x-2 pl-2 border-l border-line">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-ink leading-tight">{currentUser.name}</p>
                  <p className="text-2xs text-brand font-semibold leading-tight">Admin</p>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded text-ink-3 hover:text-danger hover:bg-danger-bg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: 8-STAGE KANBAN PIPELINE */}
          {adminTab === "kanban" && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-line">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-ink">કંપની કાનબન પાઇપલાઇન:</span>
                  <div className="flex items-center space-x-1 bg-subtle p-0.5 rounded border border-line text-2xs">
                    <button
                      onClick={() => setRegionFilter("all")}
                      className={`px-2 py-0.5 rounded ${
                        regionFilter === "all" ? "bg-surface font-bold text-ink" : "text-ink-2"
                      }`}
                    >
                      બધા ({bookings.length})
                    </button>
                    <button
                      onClick={() => setRegionFilter("indian")}
                      className={`px-2 py-0.5 rounded ${
                        regionFilter === "indian"
                          ? "bg-surface font-bold text-ink"
                          : "text-ink-2"
                      }`}
                    >
                      🇮🇳 Indian ({bookings.filter((b) => b.region === "indian").length})
                    </button>
                    <button
                      onClick={() => setRegionFilter("foreign")}
                      className={`px-2 py-0.5 rounded ${
                        regionFilter === "foreign"
                          ? "bg-surface font-bold text-ink"
                          : "text-ink-2"
                      }`}
                    >
                      🌍 Foreign ({bookings.filter((b) => b.region === "foreign").length})
                    </button>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-3" />
                  <input
                    type="text"
                    placeholder="કપલ, સ્ટુડિયો, કોડ શોધો..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-8 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* 8-Stage Horizontal Scrollable Kanban Board */}
              <div className="flex space-x-3.5 overflow-x-auto pb-4 select-none">
                {STAGES.map((stage) => {
                  const stageItems = filteredBookings.filter((b) => b.status === stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="bg-subtle/80 rounded-xl border border-line p-2.5 space-y-2.5 min-w-[280px] max-w-[280px] min-h-[550px] flex flex-col shrink-0"
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between px-1 pb-1.5 border-b border-line">
                        <div>
                          <span className="text-xs font-bold text-ink block leading-tight">
                            {stage.label}
                          </span>
                          <span className="text-2xs text-ink-3">{stage.description}</span>
                        </div>
                        <span className={`badge border font-mono text-xs ${stage.countColor}`}>
                          {stageItems.length}
                        </span>
                      </div>

                      {/* Cards Container */}
                      <div className="space-y-2.5 flex-1">
                        {stageItems.length === 0 ? (
                          <div className="h-28 rounded-lg border border-dashed border-line flex items-center justify-center text-2xs text-ink-3">
                            કોઈ પ્રોજેક્ટ નથી
                          </div>
                        ) : (
                          stageItems.map((item) => {
                            const assignedMember = STAFF.find((s) => s.id === item.assignedTo);
                            const isFootageDelayed =
                              item.status === "awaiting_footage" &&
                              new Date(item.slotDate) <= new Date();

                            return (
                              <div
                                key={item.id}
                                onClick={() => setSelectedBookingForDetails(item)}
                                className={`card p-3 space-y-2.5 cursor-pointer hover:border-ink-2 transition-all hover:shadow-card ${
                                  isFootageDelayed ? "border-danger/50 bg-danger-bg/20" : ""
                                }`}
                              >
                                {/* Header: Code & Region */}
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="font-mono font-bold text-ink-2">{item.code}</span>
                                  <div className="flex items-center space-x-1">
                                    <span className="badge bg-subtle text-ink-2 border border-line">
                                      {item.region === "foreign"
                                        ? `🌍 ${item.country || "Foreign"}`
                                        : "🇮🇳 Indian"}
                                    </span>
                                    {item.deliveryMethod === "courier" ? (
                                      <span className="badge bg-amber-50 text-amber-800 border border-amber-200">
                                        <Truck className="h-2.5 w-2.5 mr-0.5" />
                                        HDD
                                      </span>
                                    ) : (
                                      <span className="badge bg-blue-50 text-blue-800 border border-blue-200">
                                        <Cloud className="h-2.5 w-2.5 mr-0.5" />
                                        Drive
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Couple & Studio */}
                                <div>
                                  <h4 className="text-sm font-bold text-ink leading-snug">
                                    {item.coupleNames}
                                  </h4>
                                  <p className="text-xs text-ink-2 truncate mt-0.5">
                                    {item.studioOrClient}
                                  </p>
                                </div>

                                {/* Dates & Duration */}
                                <div className="text-2xs bg-subtle p-2 rounded-lg space-y-1 text-ink-2">
                                  <div className="flex justify-between">
                                    <span className="text-ink-3">પ્રોડક્શન સ્લોટ:</span>
                                    <span className="font-mono font-bold text-ink">{item.slotDate}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-ink-3">ડિલિવરી ડ્યૂ:</span>
                                    <span className="font-mono font-bold text-brand">
                                      {item.deliveryDate}
                                    </span>
                                  </div>
                                  <div className="pt-0.5 border-t border-line/60">
                                    <div className="flex justify-between items-center">
                                      <span className="text-ink-3">પેકેજ:</span>
                                      <span className="font-medium text-ink truncate max-w-[140px]">
                                        {item.packageType}
                                      </span>
                                    </div>
                                    {item.packagesList && item.packagesList.length > 1 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {item.packagesList.map((pkg, idx) => (
                                          <span
                                            key={idx}
                                            className="badge bg-surface text-ink text-2xs border border-line"
                                          >
                                            {pkg}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {item.rseDriveRequested && (
                                  <div className="text-2xs bg-blue-50 text-blue-900 border border-blue-200 px-2 py-1 rounded font-medium flex items-center space-x-1">
                                    <Cloud className="h-3 w-3 text-blue-600 shrink-0" />
                                    <span>RSE Drive લિંક રિક્વેસ્ટ કરેલ</span>
                                  </div>
                                )}

                                {/* Missing Footage Alert & 1-Click WhatsApp Button */}
                                {item.status === "awaiting_footage" && (
                                  <div className="space-y-1.5 pt-1">
                                    {isFootageDelayed && (
                                      <div className="text-2xs bg-danger-bg text-danger px-2 py-1 rounded font-bold border border-danger/20 flex items-center space-x-1">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        <span>ડેટા મોડો થયો છે!</span>
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendFootageReminder(item.id, "whatsapp");
                                        }}
                                        className="btn-outline text-2xs py-1 px-2 text-ok border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex-1 flex items-center justify-center space-x-1"
                                      >
                                        <Phone className="h-3 w-3" />
                                        <span>WhatsApp Reminder</span>
                                      </button>

                                      <button
                                        type="button"
                                        title="Shift to Next Available Slot"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRescheduleModalBooking(item);
                                        }}
                                        className="p-1 rounded border border-line bg-surface hover:bg-subtle text-ink-3 hover:text-ink"
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Frame.io & 7-Day Countdown */}
                                {item.status === "preview_sent" && (
                                  <div className="space-y-1 pt-1">
                                    <div className="text-2xs bg-pink-50 text-pink-900 p-1.5 rounded border border-pink-200 flex items-center justify-between">
                                      <span>Frame.io Preview Active</span>
                                      <span className="font-mono font-bold">7-Day Timer</span>
                                    </div>
                                    {item.frameIoLink && (
                                      <a
                                        href={item.frameIoLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-2xs text-brand font-bold hover:underline inline-flex items-center space-x-1"
                                      >
                                        <span>Open Frame.io Link</span>
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    )}
                                  </div>
                                )}

                                {/* Editor & Status Dropdown */}
                                <div className="pt-2 border-t border-line flex items-center justify-between text-2xs">
                                  {assignedMember ? (
                                    <span className="font-semibold text-ink-2">
                                      👤 {assignedMember.name.split(" ")[0]}
                                    </span>
                                  ) : (
                                    <span className="text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">
                                      અસાઇન બાકી
                                    </span>
                                  )}

                                  <select
                                    value={item.status}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      updateBookingStatus(item.id, e.target.value as BookingStatus)
                                    }
                                    className="text-2xs bg-surface border border-line rounded px-1.5 py-0.5 font-bold text-ink focus:outline-none"
                                  >
                                    {STAGES.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.label.split(". ")[1]}
                                      </option>
                                    ))}
                                  </select>
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

          {/* TAB 2: ALL SLOTS REGISTER */}
          {adminTab === "slots" && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">બધા સ્લોટ્સ અને ઓર્ડર્સનું રજિસ્ટર</h3>
                  <p className="text-xs text-ink-2">
                    ઇન્ડિયન અને ફોરેન બંને ક્લાયન્ટ્સના સ્લોટ્સ, તારીખો અને એડિટિંગ હિસાબ
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold bg-subtle px-2.5 py-1 rounded border border-line text-ink">
                  Total Bookings: {bookings.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-subtle text-ink-2 border-b border-line text-2xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Code & Region</th>
                      <th className="px-4 py-3">Couple & Studio</th>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Slot Date</th>
                      <th className="px-4 py-3">Delivery Date</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3">Assigned Editor</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Raw Assets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-subtle/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-ink">{b.code}</span>
                          <span className="block mt-0.5">
                            {b.region === "foreign" ? (
                              <span className="badge bg-purple-50 text-purple-700 border border-purple-200">
                                🌍 Foreign
                              </span>
                            ) : (
                              <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                                🇮🇳 Indian
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{b.coupleNames}</p>
                          <p className="text-2xs text-ink-2">{b.studioOrClient}</p>
                          <p className="text-2xs text-ink-3 font-mono">{b.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-ink-2">{b.packageType}</td>
                        <td className="px-4 py-3 font-mono font-medium text-ink">{b.slotDate}</td>
                        <td className="px-4 py-3 font-mono font-bold text-brand">
                          {b.deliveryDate}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-subtle border border-line capitalize">
                            {b.deliveryMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={b.assignedTo || ""}
                            onChange={(e) => assignBooking(b.id, e.target.value)}
                            className="text-xs bg-surface border border-line rounded px-2 py-1 text-ink"
                          >
                            <option value="">(કોઈ નહીં - Select)</option>
                            {STAFF.filter((s) => s.role === "editor").map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-subtle border border-line font-medium text-ink capitalize text-2xs">
                            {b.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={b.rawLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-brand font-medium hover:underline text-2xs"
                          >
                            <span>Open Assets</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENTS & DIRECTORY (AUTO-SYNCED) */}
          {adminTab === "clients" && (
            <div className="card p-5 space-y-4">
              <div className="border-b border-line pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    ક્લાયન્ટ્સ ડિરેક્ટરી અને લેજર (Auto-Registered Clients)
                  </h3>
                  <p className="text-xs text-ink-2">
                    બુકિંગ ફોર્મ ભરતા જ દરેક ક્લાયન્ટ અહીં ઓટોમેટિક સેવ થાય છે, જેથી બિલિંગ અને ફરી
                    બુકિંગમાં સરળતા રહે
                  </p>
                </div>
                <span className="badge bg-brand-light text-brand border border-brand-border font-bold text-xs">
                  {clients.length} Registered Partners
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-subtle text-ink-2 border-b border-line text-2xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Studio Name</th>
                      <th className="px-4 py-3">Contact Person</th>
                      <th className="px-4 py-3">WhatsApp / Phone</th>
                      <th className="px-4 py-3">Location / Region</th>
                      <th className="px-4 py-3">Studio WhatsApp Group</th>
                      <th className="px-4 py-3">Bookings</th>
                      <th className="px-4 py-3">Total Billed</th>
                      <th className="px-4 py-3">Pending Balance</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-subtle/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-ink">{c.studioName}</td>
                        <td className="px-4 py-3 text-ink-2">{c.contactPerson}</td>
                        <td className="px-4 py-3 font-mono text-ink">{c.phone}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-subtle border border-line capitalize">
                            {c.region === "foreign"
                              ? `🌍 ${c.country || "Foreign"}`
                              : `🇮🇳 ${c.city || "India"}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.whatsappGroupUrl ? (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={c.whatsappGroupUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="badge bg-emerald-50 text-emerald-800 border border-emerald-200 hover:underline inline-flex items-center space-x-1"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                <span>Group Linked</span>
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingClientWhatsApp({
                                    id: c.id,
                                    studioName: c.studioName,
                                    url: c.whatsappGroupUrl || "",
                                  })
                                }
                                className="text-ink-3 hover:text-ink text-2xs underline ml-1"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingClientWhatsApp({
                                  id: c.id,
                                  studioName: c.studioName,
                                  url: "",
                                })
                              }
                              className="badge bg-surface text-brand border border-dashed border-brand-border hover:bg-brand-light transition-colors text-2xs cursor-pointer"
                            >
                              + Add Group Link
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-brand">
                          {c.totalBookings} Orders
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-ink">
                          ₹{c.totalBilled.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {c.totalPending > 0 ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ₹{c.totalPending.toLocaleString("en-IN")} Due
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              All Paid ✓
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-ok font-semibold hover:underline text-2xs"
                          >
                            <Phone className="h-3 w-3" />
                            <span>Chat</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS (PRICING & HOLIDAYS) */}
          {adminTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              {/* Service Pricing Manager */}
              <div className="card p-5 space-y-4">
                <div className="border-b border-line pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">સર્વિસિસ અને પ્રાઇસિંગ મેનેજર</h3>
                    <p className="text-xs text-ink-2">
                      ઇન્ડિયન અને ફોરેન સર્વિસિસના ભાવ અહીંથી અપડેટ કરો
                    </p>
                  </div>
                </div>

                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-lg border border-line bg-surface flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-ink">{srv.name}</span>
                          <span className="badge bg-subtle text-ink-3 border border-line text-2xs">
                            {srv.region}
                          </span>
                        </div>
                        <p className="text-2xs text-ink-3">
                          એડિટર: {srv.editorDays}d • ડિલિવરી: {srv.clientDays}d
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="font-mono font-bold text-ink text-xs">
                          ₹{(srv.basePriceINR || 0).toLocaleString("en-IN")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newP = prompt(`નવો ભાવ નાખો for ${srv.name} (INR):`, String(srv.basePriceINR || 0));
                            if (newP && !isNaN(Number(newP))) {
                              updateServicePrice(srv.id, Number(newP));
                            }
                          }}
                          className="p-1 rounded hover:bg-subtle text-ink-3 hover:text-ink"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Holidays & Closed Days Manager */}
              <div className="card p-5 space-y-4">
                <div className="border-b border-line pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">જાહેર રજાઓ અને બંધ દિવસો</h3>
                    <p className="text-xs text-ink-2">
                      કેલેન્ડરમાં જે તારીખો બ્લોક રાખવી હોય તેની યાદી
                    </p>
                  </div>
                </div>

                {/* Add Holiday Form */}
                <div className="p-3 bg-subtle rounded-lg border border-line space-y-2 text-xs">
                  <span className="font-bold text-ink text-2xs uppercase">નવી રજા ઉમેરો:</span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="input font-mono text-xs"
                    />
                    <input
                      type="text"
                      placeholder="તહેવાર / રજાનું નામ..."
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      className="input text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newHolidayDate && newHolidayName.trim()) {
                          addHoliday({ date: newHolidayDate, name: newHolidayName.trim() });
                          setNewHolidayDate("");
                          setNewHolidayName("");
                        }
                      }}
                      className="btn-primary text-xs shrink-0"
                    >
                      ઉમેરો
                    </button>
                  </div>
                </div>

                {/* Holidays List */}
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {holidays.map((h) => (
                    <div
                      key={h.date}
                      className="p-2.5 rounded-lg border border-line bg-surface flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-ink">{h.date}</span>
                        <span className="text-ink-2">{h.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHoliday(h.date)}
                        className="text-danger hover:text-danger/80 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF & PAYROLL (EXISTING) */}
          {adminTab === "staff" && (
            <div className="card p-5 space-y-5">
              <div className="border-b border-line pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    સ્ટાફ રોસ્ટર, હાજરી અને પેરોલ (Master Payroll)
                  </h3>
                  <p className="text-xs text-ink-2">
                    દરેક કર્મચારીની હાજરી, માસિક પગાર અને પે-સ્લિપ મેનેજમેન્ટ
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-brand bg-brand-light px-3 py-1 rounded border border-brand-border">
                  Monthly Payroll: ₹
                  {STAFF.reduce((acc, s) => acc + s.baseSalary, 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-subtle text-ink-2 border-b border-line text-2xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Staff Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Today Status</th>
                      <th className="px-4 py-3">Monthly Base Salary</th>
                      <th className="px-4 py-3">Delivered</th>
                      <th className="px-4 py-3 text-right">Pay Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {STAFF.map((member) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const record = attendance.find(
                        (a) => a.staffId === member.id && a.date === todayStr
                      );
                      const isOnline = record && !record.punchOut;
                      const cutsDelivered = bookings.filter(
                        (b) => b.assignedTo === member.id && b.status === "delivered_done"
                      ).length;

                      return (
                        <tr key={member.id} className="hover:bg-subtle/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-ink">{member.name}</p>
                            <p className="text-2xs text-ink-3 font-mono">{member.email}</p>
                          </td>
                          <td className="px-4 py-3 capitalize text-ink-2">{member.role}</td>
                          <td className="px-4 py-3">
                            {isOnline ? (
                              <span className="badge bg-ok-bg text-ok border border-emerald-200">
                                ● In Duty
                              </span>
                            ) : (
                              <span className="badge bg-subtle text-ink-3 border border-line">
                                Offline
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-ink">
                            ₹{member.baseSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-ink-2">
                            {cutsDelivered} Films
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedStaffForSlip(member)}
                              className="btn-outline text-2xs py-1"
                            >
                              <FileText className="h-3 w-3" />
                              <span>View Slip</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* MODAL: RESCHEDULE DELAYED BOOKING */}
        {rescheduleModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md p-6 space-y-4 shadow-float">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="text-sm font-bold text-ink flex items-center space-x-1.5">
                  <RefreshCw className="h-4 w-4 text-brand" />
                  <span>સ્લોટ આગળ ખસેડો (Reschedule Delayed Project)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setRescheduleModalBooking(null)}
                  className="text-ink-3 hover:text-ink text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-ink-2">
                  પ્રોજેક્ટ:{" "}
                  <strong>
                    {rescheduleModalBooking.coupleNames} ({rescheduleModalBooking.code})
                  </strong>
                </p>

                <div>
                  <label className="label">આગામી ખાલી સ્લોટ પસંદ કરો *</label>
                  <input
                    type="date"
                    defaultValue={findNextAvailableSlot(
                      rescheduleModalBooking.slotDate,
                      rescheduleModalBooking.editorDays
                    )}
                    id="newSlotInput"
                    className="input font-mono"
                  />
                  <p className="text-2xs text-ink-3 mt-1">
                    સિસ્ટમે આપોઆપ આગામી સૌથી પહેલો ખાલી સ્લોટ પસંદ કર્યો છે.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 text-amber-900 rounded border border-amber-200 text-2xs space-y-1">
                  <p className="font-bold">✓ ઓટોમેટિક નોટિસ જશે:</p>
                  <p>
                    ક્લાયન્ટને નવી સ્લોટ તારીખ અને નવી ડિલિવરી તારીખનો મેસેજ વ્હોટ્સએપ પર સેન્ડ થશે.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalBooking(null)}
                    className="btn-ghost"
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
                    className="btn-primary"
                  >
                    સ્લોટ શિફ્ટ કરો
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: BOOKING DETAIL & FRAME.IO LINK */}
        {selectedBookingForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="card w-full max-w-xl p-6 space-y-4 shadow-float max-h-[90vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-brand text-sm">
                    {selectedBookingForDetails.code}
                  </span>
                  <span className="badge bg-subtle border border-line capitalize">
                    {selectedBookingForDetails.region}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="text-ink-3 hover:text-ink text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-line">
                <div>
                  <span className="text-2xs text-ink-3 block">Couple</span>
                  <span className="font-bold text-ink text-sm">
                    {selectedBookingForDetails.coupleNames}
                  </span>
                </div>
                <div>
                  <span className="text-2xs text-ink-3 block">Studio</span>
                  <span className="font-bold text-ink">{selectedBookingForDetails.studioOrClient}</span>
                </div>
                <div>
                  <span className="text-2xs text-ink-3 block">Phone / WhatsApp</span>
                  <a
                    href={`https://wa.me/${selectedBookingForDetails.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-ok font-bold hover:underline inline-flex items-center space-x-1"
                  >
                    <span>{selectedBookingForDetails.phone}</span>
                    <Phone className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-2xs text-ink-3 block">Email</span>
                  <span className="font-mono text-ink-2">{selectedBookingForDetails.email}</span>
                </div>
              </div>

              {/* Dates & Logistics */}
              <div className="grid grid-cols-3 gap-2 bg-subtle p-3 rounded-lg border border-line text-2xs">
                <div>
                  <span className="text-ink-3 block">Production Slot</span>
                  <span className="font-mono font-bold text-ink">
                    {selectedBookingForDetails.slotDate}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block">Delivery Due</span>
                  <span className="font-mono font-bold text-brand">
                    {selectedBookingForDetails.deliveryDate}
                  </span>
                </div>
                <div>
                  <span className="text-ink-3 block">Delivery Mode</span>
                  <span className="font-bold text-ink capitalize">
                    {selectedBookingForDetails.deliveryMethod}
                  </span>
                </div>
              </div>

              {/* Packages List (Multi-Service Deliverables) */}
              {selectedBookingForDetails.packagesList && selectedBookingForDetails.packagesList.length > 0 && (
                <div className="bg-subtle p-3 rounded-lg border border-line text-2xs space-y-1.5">
                  <span className="font-bold text-ink block">
                    પસંદ કરેલ સર્વિસિસ ({selectedBookingForDetails.packagesList.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBookingForDetails.packagesList.map((pkg, idx) => (
                      <span
                        key={idx}
                        className="badge bg-surface text-ink font-semibold border border-line"
                      >
                        ✓ {pkg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* RSE Drive Requested Banner */}
              {selectedBookingForDetails.rseDriveRequested && (
                <div className="text-2xs bg-blue-50 text-blue-900 border border-blue-200 p-2.5 rounded-lg flex items-center space-x-2">
                  <Cloud className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold block">ક્લાયન્ટે RSE ગૂગલ ડ્રાઇવ અપલોડ લિંક માંગી છે</span>
                    <span className="text-blue-700">આ ફોરેન ક્લાયન્ટને ડેટા અપલોડ માટે ડેડિકેટેડ ફોલ્ડર લિંક મોકલો.</span>
                  </div>
                </div>
              )}

              {/* Studio WhatsApp Group Connect */}
              {selectedBookingForDetails.whatsappGroupUrl && (
                <div className="text-2xs bg-emerald-50 text-emerald-900 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-ok shrink-0" />
                    <div>
                      <span className="font-bold block">સ્ટુડિયો વ્હોટ્સએપ ગ્રુપ લિંક જોડાયેલ છે</span>
                      <span className="text-emerald-700">આ સ્ટુડિયો માટેનું ડેડિકેટેડ કોમ્યુનિકેશન ગ્રુપ.</span>
                    </div>
                  </div>
                  <a
                    href={selectedBookingForDetails.whatsappGroupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="badge bg-ok text-white font-bold hover:bg-ok-hover py-1 px-2.5 inline-flex items-center space-x-1"
                  >
                    <span>Open Group</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Footage & Specs */}
              <div className="space-y-1.5 text-2xs">
                {selectedBookingForDetails.cameraProfile && (
                  <p>
                    <strong className="text-ink">Camera & Profile:</strong>{" "}
                    {selectedBookingForDetails.cameraProfile}
                  </p>
                )}
                {selectedBookingForDetails.footageSizeGB && (
                  <p>
                    <strong className="text-ink">Data Size:</strong>{" "}
                    {selectedBookingForDetails.footageSizeGB} GB
                  </p>
                )}
                {selectedBookingForDetails.songPreference && (
                  <p>
                    <strong className="text-ink">Song / Music:</strong>{" "}
                    {selectedBookingForDetails.songPreference}
                  </p>
                )}
                {selectedBookingForDetails.notes && (
                  <p className="italic bg-surface p-2 rounded border border-line">
                    &ldquo;{selectedBookingForDetails.notes}&rdquo;
                  </p>
                )}
              </div>

              {/* Frame.io Link Entry */}
              <div className="p-3 bg-pink-50/50 rounded-lg border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink text-2xs flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-pink-600" />
                    <span>Frame.io Preview Link (7-Day Revision Trigger)</span>
                  </span>
                  {selectedBookingForDetails.correctionDueAt && (
                    <span className="text-2xs font-mono font-bold text-pink-800">
                      Due: {new Date(selectedBookingForDetails.correctionDueAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="url"
                    defaultValue={selectedBookingForDetails.frameIoLink || ""}
                    id="frameIoModalInput"
                    placeholder="https://frame.io/rse/..."
                    className="input text-2xs font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("frameIoModalInput") as HTMLInputElement;
                      if (input && input.value) {
                        updateFrameIo(selectedBookingForDetails.id, input.value);
                        setSelectedBookingForDetails(null);
                      }
                    }}
                    className="btn-primary text-2xs py-1"
                  >
                    સેવ & ટાઈમર શરૂ
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-line">
                <a
                  href={selectedBookingForDetails.rawLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-outline text-2xs py-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>રો ફુટેજ લિંક ખોલો</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="btn-ghost text-xs"
                >
                  બંધ કરો
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD MANUAL WORK */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg p-6 space-y-4 shadow-float">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink">+ નવા કામ / સ્લોટની એન્ટ્રી</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-ink-3 hover:text-ink text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">કપલનું નામ *</label>
                    <input
                      type="text"
                      required
                      value={formCouple}
                      onChange={(e) => setFormCouple(e.target.value)}
                      placeholder="e.g. Aarav & Diya"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">સ્ટુડિયો નામ *</label>
                    <input
                      type="text"
                      required
                      value={formStudio}
                      onChange={(e) => setFormStudio(e.target.value)}
                      placeholder="e.g. Lumina Films"
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">ફોન / WhatsApp *</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 / +44..."
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="label">પ્રદેશ (Region)</label>
                    <select
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value as any)}
                      className="input"
                    >
                      <option value="indian">🇮🇳 Indian Client</option>
                      <option value="foreign">🌍 Foreign Client</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">સ્લોટ તારીખ *</label>
                    <input
                      type="date"
                      value={formSlotDate}
                      onChange={(e) => setFormSlotDate(e.target.value)}
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="label">ડિલિવરી તારીખ *</label>
                    <input
                      type="date"
                      value={formDeliveryDate}
                      onChange={(e) => setFormDeliveryDate(e.target.value)}
                      className="input font-mono font-bold text-brand"
                    />
                  </div>
                  <div>
                    <label className="label">કુલ રકમ (INR)</label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="input font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                  <button type="button" onClick={() => setShowNewModal(false)} className="btn-ghost">
                    રદ્દ કરો
                  </button>
                  <button type="submit" className="btn-primary">
                    સેવ કરો
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SALARY SLIP */}
        {selectedStaffForSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md p-6 space-y-4 shadow-float text-xs">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-sm font-bold text-ink">RSE STUDIO • SALARY SLIP</h3>
                <button
                  onClick={() => setSelectedStaffForSlip(null)}
                  className="text-ink-3 hover:text-ink text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-subtle p-3 rounded space-y-1">
                <p className="font-bold text-ink text-sm">{selectedStaffForSlip.name}</p>
                <p className="text-2xs text-ink-2 capitalize">
                  {selectedStaffForSlip.role} • {selectedStaffForSlip.email}
                </p>
              </div>

              <div className="border border-line rounded overflow-hidden">
                <table className="w-full text-left font-mono text-2xs">
                  <tbody className="divide-y divide-line">
                    <tr>
                      <td className="px-3 py-2 text-ink-2">બેઝિક માસિક પગાર</td>
                      <td className="px-3 py-2 text-right font-bold text-ink">
                        ₹{selectedStaffForSlip.baseSalary.toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr className="bg-subtle font-bold text-xs">
                      <td className="px-3 py-2 text-ink">ચુકવવાપાત્ર રકમ</td>
                      <td className="px-3 py-2 text-right text-brand">
                        ₹{selectedStaffForSlip.baseSalary.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                <button onClick={() => window.print()} className="btn-outline text-xs">
                  <Printer className="h-3.5 w-3.5" />
                  <span>પ્રિન્ટ</span>
                </button>
                <button onClick={() => setSelectedStaffForSlip(null)} className="btn-primary text-xs">
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: EDIT CLIENT WHATSAPP GROUP LINK */}
        {editingClientWhatsApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md p-5 space-y-4 shadow-float text-xs">
              <div className="flex items-center justify-between border-b border-line pb-2">
                <h4 className="font-bold text-ink text-sm flex items-center space-x-1.5">
                  <Phone className="h-4 w-4 text-ok" />
                  <span>WhatsApp Group: {editingClientWhatsApp.studioName}</span>
                </h4>
                <button
                  onClick={() => setEditingClientWhatsApp(null)}
                  className="text-ink-3 hover:text-ink text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-2xs text-ink-2 leading-relaxed">
                આ સ્ટુડિયો માટેનો વ્હોટ્સએપ ગ્રુપ ઇનવાઇટ લિંક (WhatsApp Group Link) અહીં પેસ્ટ કરો.
                જ્યારે આ ક્લાયન્ટ ફરીથી બુકિંગ પોર્ટલ પર નંબર નાખશે, ત્યારે એમને ઓટોમેટિક એમનું આ
                ગ્રુપ જોડાણ મળશે.
              </p>
              <div className="space-y-1">
                <label className="label text-2xs">WhatsApp Group Invite URL</label>
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
                  className="input text-xs font-mono"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setEditingClientWhatsApp(null)}
                  className="btn-outline text-xs py-1.5"
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
                  className="btn-primary text-xs py-1.5"
                >
                  Save Group Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // EMPLOYEE DESK
  const myTasks = bookings.filter((b) => b.assignedTo === currentUser.id);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="sticky top-0 z-40 bg-surface border-b border-line px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-md bg-brand text-white flex items-center justify-center font-black text-sm">
              R
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-ink">RSE | OS</span>
                <span className="rounded border border-line bg-subtle px-1.5 py-0.5 text-2xs font-bold text-ink-2 capitalize">
                  {currentUser.role} Desk
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {todayRecord?.punchOut ? (
              <span className="badge bg-subtle text-ink-3 border border-line">Shift Completed</span>
            ) : todayRecord ? (
              <button onClick={punchOut} className="btn-outline text-2xs text-danger py-1 px-2.5">
                Punch Out
              </button>
            ) : (
              <button onClick={punchIn} className="btn-primary text-2xs py-1 px-2.5">
                Punch In
              </button>
            )}

            <button onClick={logout} title="Logout" className="p-1.5 rounded text-ink-3 hover:text-danger">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-4">
        <div className="card p-4 flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-base font-bold text-ink">નમસ્તે, {currentUser.name} 👋</h2>
            <p className="text-xs text-ink-2">તમારા ખાતામાં સોંપાયેલા પ્રોજેક્ટ્સ:</p>
          </div>
          <span className="badge bg-ok-bg text-ok border border-emerald-200">● In Duty</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myTasks.map((task) => (
            <div key={task.id} className="card p-4 space-y-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-2xs font-bold text-ink-2">{task.code}</span>
                <span className="badge bg-subtle border border-line capitalize">
                  {task.status.replace(/_/g, " ")}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-ink">{task.coupleNames}</h4>
                <p className="text-xs text-ink-2">{task.studioOrClient}</p>
              </div>

              <div className="bg-subtle p-2.5 rounded space-y-1 text-2xs">
                <div className="flex justify-between">
                  <span className="text-ink-3">ડિલિવરી ડ્યૂ:</span>
                  <span className="font-mono font-bold text-brand">{task.deliveryDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-line flex items-center justify-between text-2xs">
                <a
                  href={task.rawLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand font-bold hover:underline"
                >
                  Open Assets
                </a>

                <select
                  value={task.status}
                  onChange={(e) => updateBookingStatus(task.id, e.target.value as any)}
                  className="input py-1 text-2xs font-bold"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label.split(". ")[1]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
