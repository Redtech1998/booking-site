"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  FOREIGN_SERVICES,
  INDIAN_SERVICES,
  ServiceDefinition,
} from "@/data/servicesData";
import { RegionType, DeliveryMethod, Booking } from "@/types";
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  Building2,
  Video,
  Send,
  HardDrive,
  Cloud,
  FolderSync,
  UserCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Sparkles,
  Gift,
  Truck,
  Check,
  Globe,
  MapPin,
  Tag,
  PlusCircle,
  X,
  Layers,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Lock,
  Star,
  Copy,
  Map,
  Navigation,
} from "lucide-react";

// Official Google Maps verified place URL for RSE | Post Production House
const RSE_GOOGLE_MAPS_URL = "https://maps.google.com/?cid=17962468400633901627";

export default function BookingPortalPage() {
  const {
    addBooking,
    getSlotAvailability,
    calculateDeliveryDate,
    findClientByPhone,
    findNextAvailableSlot,
    bookings,
  } = useApp();

  // Wizard Steps:
  // Step 1: Select Date (Interactive Visual Calendar First)
  // Step 2: Select Region & Multiple Deliverables (Conditional Reveal)
  // Step 3: Your Details (Auto-detected phone, Country/City)
  // Step 4: Data Delivery & Confirm (Foreign Online options vs Indian HDD/Online)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const wizardRef = useRef<HTMLDivElement>(null);

  // Month navigation for visual calendar (defaults dynamically to current live month)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 03) Offer Popup State
  const [showOfferPopup, setShowOfferPopup] = useState<boolean>(true);

  // Form Fields - Selected Date (defaults to dynamic ISO date)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    now.setDate(now.getDate() + 4);
    return now.toISOString().split("T")[0];
  });

  // Guard to ensure initial slot auto-selection runs strictly ONCE on mount
  // and NEVER overwrites the user's manual date/month selection during polling or background re-renders.
  const initialSlotInitialized = useRef<boolean>(false);

  // Automatically find and select the earliest available live slot on load (strictly once)
  useEffect(() => {
    if (initialSlotInitialized.current) return;
    try {
      const todayYmd = new Date().toISOString().split("T")[0];
      const nextAvail = findNextAvailableSlot(todayYmd, 2);
      if (nextAvail) {
        initialSlotInitialized.current = true;
        setSelectedDate(nextAvail);
        const parts = nextAvail.split("-");
        if (parts.length === 3) {
          setCalendarMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
        }
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll and auto-reframe smooth animation to top of wizard on step change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const el = wizardRef.current;
      if (el) {
        const yOffset = -80; // Offset for sticky header
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      }
    }
  }, [currentStep]);

  // 02) Region selection - only reveal services AFTER region is chosen (null by default)
  const [region, setRegion] = useState<RegionType | null>(null);

  // 07) Multiple Service Selection (empty by default until user chooses)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // Contact & Location Fields (Clean Separation of Studio, Owner, and Event)
  const [studioName, setStudioName] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("");
  const [coupleNames, setCoupleNames] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [country, setCountry] = useState<string>("India");
  const [city, setCity] = useState<string>("");

  // Creative & Music Direction
  const [songOption, setSongOption] = useState<"whatsapp" | "rse_choice" | "link">("whatsapp");
  const [songLink, setSongLink] = useState<string>("");

  // 06) Auto-detected Client Info & WhatsApp Group Link
  const [customerType, setCustomerType] = useState<"new" | "existing">("new");
  const [savedWhatsAppGroupUrl, setSavedWhatsAppGroupUrl] = useState<string | null>(null);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);

  // 05) Data Delivery (Foreign gets only Online options!)
  const [dataDeliveryMethod, setDataDeliveryMethod] = useState<DeliveryMethod>("online");
  const [foreignOnlineOption, setForeignOnlineOption] = useState<"client_link" | "request_rse_link">(
    "client_link"
  );
  // Physical Drive: Advance booking (ship closer to slot date) vs Dispatched today
  const [hddTiming, setHddTiming] = useState<"future" | "ready">("future");
  const [hddMethod, setHddMethod] = useState<"courier" | "porter_local">("courier");
  const [porterDriverPhone, setPorterDriverPhone] = useState<string>("");
  const [unavailablePrompt, setUnavailablePrompt] = useState<{ date: string; reason: string } | null>(
    null
  );

  const [courierName, setCourierName] = useState<string>("");
  const [docketNumber, setDocketNumber] = useState<string>("");
  const [dispatchDate, setDispatchDate] = useState<string>("");
  const [onlineDriveLink, setOnlineDriveLink] = useState<string>("");
  const [projectNotes, setProjectNotes] = useState<string>("");
  const [cameraProfile, setCameraProfile] = useState<string>("Sony S-Log3 / S-Gamut3.Cine");

  // Google Map Toggle & Address Copy State (Defaults to open for courier/porter)
  const [showAddressMap, setShowAddressMap] = useState<boolean>(true);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  const handleCopyAddress = () => {
    try {
      navigator.clipboard.writeText(
        "RSE Post Production House, 7th Floor, Radhe Infinity, 726, Raksha Shakti Cir, nr. Swaminarayan Dham, Urjanagar, Randesan, Gandhinagar, Gujarat 382421 (Contact: +91 93135 53726 / +91 88663 23567)"
      );
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch (_) {}
  };

  // Submission Status
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Private Tracker Modal
  const [showTrackerModal, setShowTrackerModal] = useState<boolean>(false);
  const [trackerQuery, setTrackerQuery] = useState<string>("");
  const [trackedBooking, setTrackedBooking] = useState<Booking | null>(null);

  // Check offer dismissal & restore draft on mount
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("rse_offer_dismissed");
      if (dismissed) setShowOfferPopup(false);

      const savedDraft = sessionStorage.getItem("rse_booking_draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.studioName) setStudioName(parsed.studioName);
        if (parsed.contactPerson) setContactPerson(parsed.contactPerson);
        if (parsed.coupleNames) setCoupleNames(parsed.coupleNames);
        if (parsed.whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
        if (parsed.clientEmail) setClientEmail(parsed.clientEmail);
        if (parsed.city) setCity(parsed.city);
      }
    } catch (_) {}
  }, []);

  // Auto-save draft on input change
  useEffect(() => {
    try {
      if (studioName || contactPerson || coupleNames || whatsappNumber || clientEmail) {
        sessionStorage.setItem(
          "rse_booking_draft",
          JSON.stringify({
            studioName,
            contactPerson,
            coupleNames,
            whatsappNumber,
            clientEmail,
            city,
          })
        );
      }
    } catch (_) {}
  }, [studioName, contactPerson, coupleNames, whatsappNumber, clientEmail, city]);

  const dismissOffer = () => {
    setShowOfferPopup(false);
    try {
      sessionStorage.setItem("rse_offer_dismissed", "true");
    } catch (_) {}
  };

  // Services according to selected region (empty if no region chosen yet)
  const availableServices =
    region === "foreign" ? FOREIGN_SERVICES : region === "indian" ? INDIAN_SERVICES : [];

  // Selected services list
  const selectedServicesList = availableServices.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const primaryService = selectedServicesList[0] || null;

  // Combined Promised Turnaround:
  // Base = max turnaround of selected services, plus +1 day for each additional deliverable
  const baseClientDays =
    selectedServicesList.length > 0
      ? Math.max(...selectedServicesList.map((s) => s.clientDays || 4), 4)
      : 0;
  const extraServicesBuffer = Math.max(0, selectedServicesList.length - 1);
  const totalCombinedClientDays = baseClientDays + extraServicesBuffer;

  // Delivery date calculation
  const promisedDeliveryDate = primaryService
    ? calculateDeliveryDate(primaryService.id, selectedDate, dataDeliveryMethod)
    : "-";

  // 07) Toggle service in multi-select list
  const toggleServiceSelection = (srvId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(srvId)) {
        return prev.filter((id) => id !== srvId);
      } else {
        return [...prev, srvId];
      }
    });
  };

  // 06) Real-time Auto-Detection when WhatsApp Phone changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setWhatsappNumber(rawVal);

    if (rawVal.replace(/\D/g, "").length >= 8) {
      const existing = findClientByPhone(rawVal);
      if (existing) {
        setCustomerType("existing");
        if (!studioName) setStudioName(existing.studioName);
        if (!contactPerson) setContactPerson(existing.contactPerson);
        if (!clientEmail) setClientEmail(existing.email);
        if (existing.country) setCountry(existing.country);
        if (existing.city) setCity(existing.city);
        if (existing.whatsappGroupUrl) setSavedWhatsAppGroupUrl(existing.whatsappGroupUrl);
        setAutoDetectNotice(
          `✓ Welcome back, ${existing.studioName}! Verified existing studio partner.`
        );
      } else {
        setCustomerType("new");
        setAutoDetectNotice(null);
      }
    }
  };

  // 04) Country Change Handler (sets default phone codes)
  const handleCountryChange = (cName: string) => {
    setCountry(cName);
    if (!whatsappNumber || whatsappNumber.startsWith("+")) {
      const codes: Record<string, string> = {
        "United States": "+1 ",
        "Canada": "+1 ",
        "United Kingdom": "+44 ",
        "Australia": "+61 ",
        "United Arab Emirates": "+971 ",
        "India": "+91 ",
      };
      if (codes[cName]) setWhatsappNumber(codes[cName]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (!studioName.trim() || !contactPerson.trim() || !whatsappNumber.trim()) {
      setSubmitError("Please fill all required studio, contact person, and phone fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const packageNames = selectedServicesList.map((s) => s.name);
      const combinedPackageTitle = packageNames.join(" + ");
      const totalBasePrice = selectedServicesList.reduce(
        (acc, s) => acc + (s.basePriceINR || 0),
        0
      );
      const advanceAmount = Math.round(totalBasePrice * 0.5);
      const finalAmount = totalBasePrice - advanceAmount;

      const newBooking = addBooking({
        source: "website",
        region: region || "indian",
        customerType,
        coupleNames: coupleNames.trim() || `${studioName} Wedding Film`,
        studioOrClient: studioName.trim(),
        contactPerson: contactPerson.trim(),
        phone: whatsappNumber.trim(),
        email: clientEmail.trim() || `${whatsappNumber.replace(/\D/g, "")}@rseclient.in`,
        country,
        city,
        whatsappGroupUrl: savedWhatsAppGroupUrl || undefined,
        eventDate: selectedDate,
        slotDate: selectedDate,
        deliveryDate: promisedDeliveryDate,
        serviceId: primaryService ? primaryService.id : "custom_package",
        packageType: combinedPackageTitle || "Custom Editing Package",
        serviceIds: selectedServiceIds,
        packagesList: packageNames,
        editorDays: primaryService ? primaryService.editorDays : 4,
        clientDays: totalCombinedClientDays,
        deliveryMethod: dataDeliveryMethod,
        courierName:
          dataDeliveryMethod === "courier"
            ? hddTiming === "future"
              ? hddMethod === "porter_local"
                ? "Porter / Local Hand Delivery (Advance Booking)"
                : "Courier Delivery (Advance Booking - Will ship before slot)"
              : hddMethod === "porter_local"
              ? `Porter / Local Drop: ${porterDriverPhone || "Scheduled"}`
              : courierName || "Courier Express"
            : undefined,
        docketNumber:
          dataDeliveryMethod === "courier"
            ? hddTiming === "future"
              ? "Will share on WhatsApp before cut-off"
              : docketNumber || "In Transit / Dispatched"
            : undefined,
        dispatchDate:
          dataDeliveryMethod === "courier"
            ? hddTiming === "future"
              ? undefined
              : dispatchDate || new Date().toISOString().split("T")[0]
            : undefined,
        onlineDriveLink:
          foreignOnlineOption === "request_rse_link"
            ? "RSE Dedicated Cloud Upload Link Requested"
            : onlineDriveLink || undefined,
        rseDriveRequested: foreignOnlineOption === "request_rse_link",
        rawLink:
          dataDeliveryMethod === "online"
            ? foreignOnlineOption === "request_rse_link"
              ? "RSE High-Speed Upload Link Requested"
              : onlineDriveLink || "https://drive.google.com/sample"
            : hddTiming === "future"
            ? `Physical HDD (Advance Booking - ${hddMethod === "porter_local" ? "Porter Drop" : "Courier"})`
            : hddMethod === "porter_local"
            ? `Porter / Local Hand Delivery (${porterDriverPhone || "Ahmedabad"})`
            : `Courier: ${courierName || "Express"} #${docketNumber || "In Transit"}`,
        cameraProfile: cameraProfile || undefined,
        songPreference:
          songOption === "rse_choice"
            ? "RSE Director's Choice (Narrative cinematic music)"
            : songOption === "link"
            ? `Custom Song Link: ${songLink}`
            : "Share songs via WhatsApp Studio Group",
        notes: projectNotes,
        ndaAccepted: region === "foreign" ? true : undefined,
        ndaAcceptedAt: region === "foreign" ? new Date().toISOString() : undefined,
        pricing: {
          totalAmount: totalBasePrice,
          advanceAmount,
          finalAmount,
          advancePaid: false,
          finalPaid: false,
          currency: region === "foreign" ? "USD" : "INR",
        },
        status: "new_deposit_pending",
      });

      setConfirmedBooking(newBooking);

      // Call Zoho Confirmation API in background
      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingCode: newBooking.code,
            clientEmail: newBooking.email,
            clientName: newBooking.coupleNames,
            studioName: newBooking.studioOrClient,
            slotDate: newBooking.slotDate,
            deliveryDate: newBooking.deliveryDate,
            packageName: newBooking.packageType,
            region: newBooking.region,
            pricing: newBooking.pricing,
            deliveryMethod: newBooking.deliveryMethod,
            ndaAccepted: newBooking.ndaAccepted,
          }),
        });
      } catch (_) {}
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 08) Book Another Slot for Same Studio
  const handleBookAnotherSlot = () => {
    setConfirmedBooking(null);
    setCurrentStep(1); // Go back to calendar
    setSelectedServiceIds([]); // Clean slate for new deliverables
    setCoupleNames(""); // Clean slate for next couple/event
    setCustomerType("existing");
    // Keeps studioName, contactPerson, whatsappNumber, clientEmail, region, country, city intact!
  };

  // Order Tracking
  const handleTrackOrder = () => {
    if (!trackerQuery.trim()) return;
    const clean = trackerQuery.trim().toLowerCase();
    const found = bookings.find(
      (b) =>
        b.code.toLowerCase() === clean ||
        b.phone.replace(/\D/g, "").includes(clean.replace(/\D/g, "")) ||
        b.studioOrClient.toLowerCase().includes(clean)
    );
    setTrackedBooking(found || null);
  };

  // Calendar Math
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const currentNow = new Date();
  const currentYear = currentNow.getFullYear();
  const currentMonth = currentNow.getMonth();
  const isPastMonth = year < currentYear || (year === currentYear && month <= currentMonth);

  const prevMonth = () => {
    if (isPastMonth) return;
    initialSlotInitialized.current = true;
    setCalendarMonth(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    initialSlotInitialized.current = true;
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  // Active in-progress edits count
  const activeEditsCount = bookings.filter(
    (b) => b.status === "in_edit_polish" || b.status === "in_selection_cut"
  ).length;

  return (
    <div className="min-h-screen bg-white text-[#2a2a2a] font-['Open_Sans',sans-serif]">
      {/* ── 01) LIVE PRODUCTION QUEUE & STATUS TICKER ── */}
      <div className="bg-[#6b2e4c] text-[#f5e6cc] text-xs py-2 px-4 border-b border-[#a83d5b]/30">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold">
              Live Production Queue: {activeEditsCount || 3} Projects in Master Post-Production
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-[#f5e6cc]/90">
            <span className="hidden sm:inline">• Adobe Premiere Pro & Apple FCP X</span>
            <span>• DaVinci Resolve Cinema Color Grading</span>
            <span>• 100% On-Time Delivery Guarantee</span>
          </div>
        </div>
      </div>

      {/* ── Official Header ── */}
      <header className="border-b border-[#e5e5e5] bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link href="/book" className="flex items-center space-x-2.5 text-decoration-none group">
            <img
              src="/rse-logo.png"
              alt="RSE Post Production House"
              className="h-10 w-10 rounded-full object-contain shadow-sm border border-[#6b2e4c]/20 group-hover:scale-105 transition-transform"
            />
            <span className="font-['Montserrat',sans-serif] text-sm sm:text-base font-bold text-[#6b2e4c] tracking-wide">
              Post Production House
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowTrackerModal(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e5e5e5] bg-[#f8f8f8] hover:bg-[#f0f0f0] text-[#4a4a4a] transition-all"
            >
              <Search className="h-3.5 w-3.5 text-[#6b2e4c]" />
              <span>Track Project Status</span>
            </button>

            <a
              href="https://rsegnr.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#6b2e4c] hover:underline hidden md:inline"
            >
              rsegnr.in ↗
            </a>
          </div>
        </div>
      </header>

      {/* ── 03) SPECIAL OFFER POPUP MODAL ── */}
      {showOfferPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border-2 border-[#6b2e4c] rounded-[1.5rem] max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={dismissOffer}
              className="absolute top-4 right-4 text-[#666] hover:text-[#0f0f10] p-1 rounded-full hover:bg-slate-100"
              title="Close"
            >
              <X size={20} />
            </button>

            <div className="h-12 w-12 rounded-full bg-[#f5e6cc] text-[#6b2e4c] flex items-center justify-center mx-auto shadow-sm">
              <Gift size={24} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#6b2e4c14] text-[#6b2e4c]">
                Exclusive Studio Offer
              </span>
              <h3 className="font-['Montserrat',sans-serif] text-xl font-extrabold text-[#0f0f10]">
                Experience RSE Wedding Editing
              </h3>
              <p className="text-xs text-[#4a4a4a] max-w-sm mx-auto">
                International Studios get a <strong>100% Free 5-Minute Sample Edit</strong> (Zero
                financial commitment). Experience our film grading and narrative flow first-hand.
              </p>
            </div>

            <div className="bg-[#f8f8f8] p-3 rounded-xl border border-[#e5e5e5] text-xs text-left space-y-1 text-[#4a4a4a]">
              <p className="flex items-center space-x-1.5 text-[#166534] font-semibold">
                <Check size={14} />
                <span>Dedicated Senior Colorist & Narrative Editor</span>
              </p>
              <p className="flex items-center space-x-1.5 text-[#166534] font-semibold">
                <Check size={14} />
                <span>100% Non-Disclosure Agreement (NDA) Protected</span>
              </p>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRegion("foreign");
                  setSelectedServiceIds(["f_demo_5m"]);
                  dismissOffer();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs shadow-md shadow-[#6b2e4c4d] transition-all"
              >
                Claim Free 5-Min Demo
              </button>
              <button
                type="button"
                onClick={dismissOffer}
                className="px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-xs font-semibold text-[#4a4a4a] hover:bg-slate-50"
              >
                Explore All Slots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Booking Section ── */}
      <main className="py-8 sm:py-10 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h1 className="font-['Montserrat',sans-serif] text-3xl sm:text-4xl font-extrabold text-[#0f0f10] tracking-tight">
            Book Your{" "}
            <span className="bg-gradient-to-r from-[#6b2e4c] to-[#a83d5b] bg-clip-text text-transparent">
              Editing Slot
            </span>
          </h1>
          <p className="text-[#4a4a4a] text-sm max-w-md mx-auto">
            Check availability and book your bespoke editing slot in 4 simple steps
          </p>
        </div>

        {/* 🔒 Trust & Quality Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 flex items-center space-x-2.5 shadow-sm hover:border-[#6b2e4c]/30 transition-all">
            <div className="h-9 w-9 rounded-lg bg-[#6b2e4c14] text-[#6b2e4c] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#0f0f10]">100% NDA Protected</h5>
              <p className="text-[11px] text-[#666]">Zero client footage leakage guarantee</p>
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 flex items-center space-x-2.5 shadow-sm hover:border-[#22c55e]/30 transition-all">
            <div className="h-9 w-9 rounded-lg bg-[#22c55e1a] text-[#166534] flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#0f0f10]">Guaranteed Schedule</h5>
              <p className="text-[11px] text-[#666]">Locked delivery timeline with zero delays</p>
            </div>
          </div>

          <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 flex items-center space-x-2.5 shadow-sm hover:border-[#a83d5b]/30 transition-all">
            <div className="h-9 w-9 rounded-lg bg-[#a83d5b14] text-[#a83d5b] flex items-center justify-center shrink-0">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-[#0f0f10]">Direct Cloud Ingest</h5>
              <p className="text-[11px] text-[#666]">High-speed dedicated Google Drive upload</p>
            </div>
          </div>
        </div>

        {/* 4 Step Progress Pills */}
        <div className="w-full max-w-xl mx-auto pt-1">
          {/* Mobile Current Step Tag */}
          <div className="sm:hidden flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold text-[#6b2e4c] uppercase tracking-wider">
              Step {currentStep} of 4:
            </span>
            <span className="text-xs font-bold text-[#0f0f10]">
              {currentStep === 1 && "Select Preferred Date"}
              {currentStep === 2 && "Choose Deliverables"}
              {currentStep === 3 && "Studio & Couple Details"}
              {currentStep === 4 && "Data Delivery & Confirmation"}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-1">
            {[
              { s: 1, label: "Select Date" },
              { s: 2, label: "Deliverables" },
              { s: 3, label: "Studio Details" },
              { s: 4, label: "Delivery & Submit" },
            ].map((item) => (
              <button
                key={item.s}
                type="button"
                disabled={item.s > currentStep}
                onClick={() => item.s < currentStep && setCurrentStep(item.s)}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
                  currentStep === item.s
                    ? "bg-[#6b2e4c] text-white shadow-md font-semibold ring-2 ring-[#6b2e4c]/30"
                    : currentStep > item.s
                    ? "bg-[#22c55e] text-white cursor-pointer hover:bg-[#16a34a]"
                    : "bg-[#f5f5f5] text-[#888] cursor-not-allowed opacity-75"
                }`}
              >
                <span
                  className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-bold ${
                    currentStep === item.s
                      ? "bg-white/20 text-white"
                      : currentStep > item.s
                      ? "bg-white/20 text-white"
                      : "bg-[#e5e5e5] text-[#666]"
                  }`}
                >
                  {currentStep > item.s ? "✓" : item.s}
                </span>
                <span className="hidden xs:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONFIRMATION SCREEN */}
        {confirmedBooking ? (
          <div className="bg-white border border-[#e5e5e5] rounded-[1.5rem] shadow-xl p-8 sm:p-12 text-center space-y-6 max-w-3xl mx-auto">
            <div className="flex justify-center items-center">
              <img
                src="/rse-logo.png"
                alt="RSE Logo"
                className="h-16 w-16 rounded-full object-contain shadow-md border-2 border-[#6b2e4c]/20"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#166534] px-3 py-1 rounded-full bg-[#22c55e1a]">
                SLOT RESERVED SUCCESSFULLY
              </span>
              <h2 className="font-['Montserrat',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#0f0f10] mt-2">
                Booking Request Confirmed!
              </h2>
              <p className="text-xs text-[#4a4a4a]">
                Booking Reference:{" "}
                <span className="font-mono font-bold text-[#6b2e4c] text-base">
                  {confirmedBooking.code}
                </span>
              </p>
            </div>

            <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-5 text-left text-xs space-y-3">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#e5e5e5]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] block">Studio</span>
                  <span className="font-bold text-[#0f0f10] text-sm">
                    {confirmedBooking.studioOrClient}
                  </span>
                  <span className="text-[11px] text-[#666]">
                    {confirmedBooking.city ? `${confirmedBooking.city}, ` : ""}
                    {confirmedBooking.country || ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] block">Contact</span>
                  <span className="font-bold text-[#0f0f10] text-sm">
                    {confirmedBooking.coupleNames}
                  </span>
                  <span className="text-[11px] text-[#666] font-mono block">
                    {confirmedBooking.phone}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] block">
                    Deliverables ({confirmedBooking.packagesList?.length || 1})
                  </span>
                  <span className="font-semibold text-[#0f0f10] block">
                    {confirmedBooking.packageType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] block">Slot Date</span>
                  <span className="font-mono font-bold text-[#6b2e4c]">{confirmedBooking.slotDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] block">Delivery Due</span>
                  <span className="font-mono font-bold text-[#166534]">{confirmedBooking.deliveryDate}</span>
                </div>
              </div>
            </div>

            {/* Payment Terms & NDA Acknowledgment */}
            <div className="bg-[#f5e6cc]/30 border border-[#f5e6cc] rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#6b2e4c]">Payment & Production Terms</span>
                <span className="badge bg-[#22c55e1a] text-[#166534] border border-[#22c55e4d] font-bold text-2xs">
                  {confirmedBooking.region === "foreign" ? "🔒 100% NDA Protected" : "📄 Official Quotation"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#4a4a4a]">
                <div className="bg-white p-2.5 rounded-lg border border-[#e5e5e5]">
                  <span className="text-[#666] block">Stage 1: Advance Deposit</span>
                  <strong className="text-[#6b2e4c] font-bold">50% to reserve slot & start Premiere / FCP X ingest</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-[#e5e5e5]">
                  <span className="text-[#666] block">Stage 2: Final Balance</span>
                  <strong className="text-[#0f0f10] font-bold">50% upon Frame.io sign-off & master delivery</strong>
                </div>
              </div>
              <p className="text-[10px] text-[#666]">
                📩 Confirmation with project specs has been dispatched via Zoho Mail to{" "}
                <span className="font-mono font-bold text-[#0f0f10]">{confirmedBooking.email}</span>.
              </p>
            </div>

            {/* Courier / Porter Ingest Address Card on Confirmation Screen */}
            {confirmedBooking.deliveryMethod === "courier" && (
              <div className="bg-[#f5e6cc]/40 border border-[#f5e6cc] rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 font-bold text-[#6b2e4c]">
                    <MapPin className="h-4 w-4 text-[#a83d5b]" />
                    <span>Courier / Porter Dispatch Address:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#e5e5e5] text-[#4a4a4a] hover:border-[#6b2e4c] hover:text-[#6b2e4c] transition-all self-start sm:self-auto"
                  >
                    {copiedAddress ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Address for Porter / Courier</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-[#222] leading-relaxed">
                  <strong className="text-xs text-[#6b2e4c] block">RSE Post Production House</strong>
                  <p className="font-semibold text-[#111] m-0">7th Floor, Radhe Infinity, 726, Raksha Shakti Cir,</p>
                  <p className="text-[#333] m-0">nr. Swaminarayan Dham, Urjanagar, Randesan, Gandhinagar, Gujarat – 382421</p>
                  <p className="text-[#666] pt-1 m-0">Receiving Contact: <strong>+91 93135 53726</strong> / <strong>+91 88663 23567</strong></p>
                </div>
              </div>
            )}

            {/* 06) WhatsApp Group & 08) Book Another Slot Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              {confirmedBooking.whatsappGroupUrl ? (
                <a
                  href={confirmedBooking.whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold text-xs shadow-md transition-all"
                >
                  <Phone className="h-4 w-4" />
                  <span>Open Your Studio WhatsApp Group</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/919313553726?text=${encodeURIComponent(
                    `Hello RSE Team, I have booked an editing slot! Booking Code: ${confirmedBooking.code} (${confirmedBooking.studioOrClient} - ${confirmedBooking.coupleNames}). Deliverables: ${confirmedBooking.packageType}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs shadow-md shadow-[#6b2e4c4d] transition-all"
                >
                  <Phone className="h-4 w-4" />
                  <span>Connect with Team on WhatsApp</span>
                </a>
              )}

              {confirmedBooking.deliveryMethod === "courier" && (
                <a
                  href={RSE_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border-2 border-[#e5e5e5] bg-white hover:border-[#6b2e4c] text-[#0f0f10] font-semibold text-xs shadow-sm transition-all"
                >
                  <MapPin className="h-4 w-4 text-[#6b2e4c]" />
                  <span>Google Maps Location (For Driver / Porter)</span>
                </a>
              )}

              {/* 08) Book Another Slot Button */}
              <button
                type="button"
                onClick={handleBookAnotherSlot}
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border-2 border-[#6b2e4c] text-[#6b2e4c] hover:bg-[#6b2e4c] hover:text-[#f5e6cc] font-semibold text-xs transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Book Another Slot</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM CONTAINER */
          <div
            ref={wizardRef}
            className="bg-white border border-[#e5e5e5] rounded-[1.5rem] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-4 sm:p-10 max-w-4xl mx-auto space-y-6"
          >
            {submitError && (
              <div className="bg-[#ef44441a] border border-[#ef44444d] text-[#991b1b] p-3 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* ── STEP 1: VISUAL CALENDAR FIRST ── */}
            {currentStep === 1 && (
              <div className="animate-step-fade space-y-6">
                <div>
                  <h3 className="font-['Montserrat',sans-serif] text-lg sm:text-xl font-bold text-[#6b2e4c] flex items-center space-x-2 pb-2 border-b-2 border-[#e5e5e5]">
                    <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#a83d5b]" />
                    <span>Select Your Preferred Date</span>
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mt-1">
                    Check our studio live availability and choose an active editing slot
                  </p>
                </div>

                {/* Visual Month Calendar */}
                <div className="border border-[#e5e5e5] rounded-2xl p-3 sm:p-6 bg-white space-y-4">
                  {/* Month Switcher Header with Jump to Today */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-['Montserrat',sans-serif] text-base sm:text-lg font-bold text-[#0f0f10]">
                        {monthNames[month]} {year}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          initialSlotInitialized.current = true;
                          const now = new Date();
                          setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-[#6b2e4c]/20 bg-[#f5e6cc]/50 text-[#6b2e4c] hover:bg-[#f5e6cc] transition-all cursor-pointer"
                        title="Jump to current month"
                      >
                        Today
                      </button>
                    </div>

                    <div className="flex items-center space-x-1 border border-[#e5e5e5] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={prevMonth}
                        disabled={isPastMonth}
                        className={`p-1 sm:p-1.5 rounded transition-all ${
                          isPastMonth ? "opacity-30 cursor-not-allowed text-[#bbb]" : "hover:bg-[#f5f5f5] text-[#4a4a4a] cursor-pointer"
                        }`}
                        title={isPastMonth ? "Cannot navigate to past months" : "Previous Month"}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1 sm:p-1.5 rounded hover:bg-[#f5f5f5] text-[#4a4a4a] cursor-pointer transition-all"
                        title="Next Month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Days Header */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-[11px] uppercase text-[#666] py-1 border-b border-[#e5e5e5]">
                    <span className="text-[#ef4444]">Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`offset-${i}`} className="h-14 sm:h-20 rounded-lg sm:rounded-xl bg-transparent" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNumber = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                        dayNumber
                      ).padStart(2, "0")}`;
                      const dayOfWeek = new Date(year, month, dayNumber).getDay();
                      const isSelected = selectedDate === dateStr;

                      const now = new Date();
                      const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                      const isToday = dateStr === todayYmd;
                      const isPast = dateStr < todayYmd;

                      const avail = getSlotAvailability(dateStr);
                      const isSunday = dayOfWeek === 0;

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            initialSlotInitialized.current = true;
                            if (isPast) {
                              setUnavailablePrompt({
                                date: dateStr,
                                reason: "Past date (cannot select historical dates)",
                              });
                              return;
                            }
                            if (avail.isAvailable) {
                              setSelectedDate(dateStr);
                              setUnavailablePrompt(null);
                            } else {
                              setUnavailablePrompt({
                                date: dateStr,
                                reason: avail.reason || (isSunday ? "Sunday (Studio Closed)" : "Capacity Full"),
                              });
                            }
                          }}
                          className={`h-14 sm:h-20 p-1 sm:p-2 rounded-lg sm:rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-[#6b2e4c] bg-[#6b2e4c] text-white shadow-md ring-2 ring-[#6b2e4c]"
                              : isPast
                              ? "border-[#f0f0f0] bg-[#fafafa] text-[#bbb] opacity-45 cursor-not-allowed"
                              : !avail.isAvailable
                              ? "border-[#e5e5e5] bg-[#f8f8f8] text-[#999] opacity-75 hover:opacity-100 hover:border-amber-400 cursor-pointer"
                              : "border-[#e5e5e5] bg-white hover:border-[#a83d5b] hover:bg-[#6b2e4c08] text-[#0f0f10] active:scale-[0.98]"
                          } ${isToday && !isSelected ? "ring-2 ring-amber-500/50 border-amber-500" : ""}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs sm:text-sm font-bold">{dayNumber}</span>
                            {isToday && (
                              <span
                                className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${
                                  isSelected ? "bg-white/25 text-white" : "bg-amber-100 text-amber-900 border border-amber-300"
                                }`}
                              >
                                Today
                              </span>
                            )}
                            {isSunday && !isToday && (
                              <span
                                className={`text-[8px] sm:text-[9px] font-bold px-1 rounded ${
                                  isSelected ? "bg-white/20 text-white" : "bg-[#e5e5e5] text-[#666]"
                                }`}
                              >
                                Off
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] truncate w-full">
                            {isSelected ? (
                              <span className="font-bold text-white flex items-center justify-center sm:justify-start space-x-0.5 text-[9px] sm:text-[10px]">
                                <Check className="h-2.5 w-2.5" />
                                <span className="hidden sm:inline">Selected</span>
                              </span>
                            ) : isPast ? (
                              <span className="text-[8px] sm:text-[9px] text-[#bbb] text-center sm:text-left block">
                                Past
                              </span>
                            ) : !avail.isAvailable ? (
                              <span className="text-[8px] sm:text-[9px] text-[#999] text-center sm:text-left truncate block">
                                {isSunday ? "Closed" : "Booked"}
                              </span>
                            ) : (
                              <span className="text-[8px] sm:text-[9px] font-semibold text-[#16a34a] flex items-center justify-center sm:justify-start space-x-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a] shrink-0"></span>
                                <span className="hidden sm:inline">Available</span>
                                <span className="sm:hidden">Open</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#e5e5e5] text-[11px] sm:text-xs text-[#4a4a4a]">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] inline-block"></span>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] inline-block"></span>
                        <span>Booked</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#94a3b8] inline-block"></span>
                        <span>Sunday</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full border border-amber-500 bg-amber-100 inline-block"></span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* When clicking an unavailable date: contextual alert */}
                  {unavailablePrompt && (
                    {...(() => {
                      const nextAvail = findNextAvailableSlot(
                        unavailablePrompt.date,
                        4
                      );
                      return (
                        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn mt-2">
                          <div className="flex items-start sm:items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                            <div>
                              <span className="font-bold text-amber-900 block sm:inline">
                                {unavailablePrompt.date} is unavailable ({unavailablePrompt.reason}).
                              </span>
                              <span className="text-[11px] text-amber-800 sm:ml-1">
                                Next available open slot is <strong>{nextAvail}</strong>.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              initialSlotInitialized.current = true;
                              setSelectedDate(nextAvail);
                              setUnavailablePrompt(null);
                              const parts = nextAvail.split("-");
                              if (parts.length === 3) {
                                setCalendarMonth(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1));
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-bold text-2xs transition-all shadow-sm shrink-0 self-start sm:self-auto"
                          >
                            Select {nextAvail} →
                          </button>
                        </div>
                      );
                    })()}
                  )}
                </div>

                {/* Selected Date Box */}
                {selectedDate && (
                  <div className="bg-[#22c55e1a] border border-[#22c55e4d] text-[#166534] rounded-xl p-4 flex items-center space-x-3 text-xs">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-[#166534]">
                        Selected Production Date:
                      </span>
                      <strong className="text-sm font-['Montserrat',sans-serif]">
                        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs shadow-md shadow-[#6b2e4c4d] transition-all flex items-center space-x-2"
                  >
                    <span>Lock Preferred Date & Continue →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: REGION & MULTIPLE DELIVERABLES (02 & 07) ── */}
            {currentStep === 2 && (
              <div className="animate-step-fade space-y-6">
                <div>
                  <h3 className="font-['Montserrat',sans-serif] text-xl font-bold text-[#6b2e4c] flex items-center space-x-2 pb-2 border-b-2 border-[#e5e5e5]">
                    <Video className="h-6 w-6 text-[#a83d5b]" />
                    <span>Select Client Region & Deliverables</span>
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mt-1">
                    First choose your location, then select one or multiple editing deliverables.
                  </p>
                </div>

                {/* 02) First Select Region */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#6b2e4c] block">
                    1. Select Studio Region:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRegion("indian");
                        setSelectedServiceIds([]);
                        setCountry("India");
                        setDataDeliveryMethod("online");
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        region === "indian"
                          ? "border-[#6b2e4c] bg-[#6b2e4c14] font-bold ring-2 ring-[#6b2e4c] shadow-sm"
                          : "border-[#e5e5e5] bg-white hover:border-[#a83d5b] hover:bg-[#6b2e4c08] text-[#4a4a4a]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🇮🇳</span>
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            region === "indian"
                              ? "bg-[#6b2e4c] border-[#6b2e4c] text-white"
                              : "border-[#ccc] bg-white"
                          }`}
                        >
                          {region === "indian" && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#6b2e4c] mt-2">Indian Studio Partner</p>
                      <p className="text-xs text-[#666] font-normal mt-0.5">
                        Highlights, short films, multicam traditional, reels & fast HDD/Drive sync
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRegion("foreign");
                        setSelectedServiceIds([]);
                        setCountry("United States");
                        setDataDeliveryMethod("online");
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        region === "foreign"
                          ? "border-[#6b2e4c] bg-[#6b2e4c14] font-bold ring-2 ring-[#6b2e4c] shadow-sm"
                          : "border-[#e5e5e5] bg-white hover:border-[#a83d5b] hover:bg-[#6b2e4c08] text-[#4a4a4a]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">🌍</span>
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            region === "foreign"
                              ? "bg-[#6b2e4c] border-[#6b2e4c] text-white"
                              : "border-[#ccc] bg-white"
                          }`}
                        >
                          {region === "foreign" && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#6b2e4c] mt-2">International Client</p>
                      <p className="text-xs text-[#666] font-normal mt-0.5">
                        Free 5-min sample demo, documentary films, NDA protection & cloud upload
                      </p>
                    </button>
                  </div>
                </div>

                {/* If No Region Selected Yet, Show Visual Guidance Placeholder */}
                {!region && (
                  <div className="bg-[#f8f8f8] border-2 border-dashed border-[#e5e5e5] rounded-2xl p-8 text-center space-y-2 animate-fadeIn">
                    <div className="h-10 w-10 rounded-full bg-[#f5e6cc] text-[#6b2e4c] flex items-center justify-center mx-auto shadow-sm">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#6b2e4c]">
                      Please Select Your Studio Region Above to View Packages
                    </h4>
                    <p className="text-xs text-[#666] max-w-md mx-auto">
                      Select either <strong>Indian Studio Partner</strong> or <strong>International Client</strong> above to display our tailored editing deliverables, turnaround schedules, and pricing.
                    </p>
                  </div>
                )}

                {/* 07) Deliverables Revealed ONLY after Region is Selected */}
                {region && (
                  <div className="space-y-3 pt-2 border-t border-[#e5e5e5] animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-['Montserrat',sans-serif] text-sm font-bold text-[#6b2e4c]">
                          2. Select Editing Deliverables
                        </h4>
                        <p className="text-[11px] text-[#666]">
                          Select one or more deliverables • Combined turnaround calculates automatically
                        </p>
                      </div>
                      <span className="text-xs text-[#166534] font-semibold bg-[#22c55e1a] px-3 py-1 rounded-full border border-[#22c55e4d]">
                        {selectedServiceIds.length} Selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableServices.map((srv) => {
                        const isSelected = selectedServiceIds.includes(srv.id);
                        return (
                          <div
                            key={srv.id}
                            onClick={() => toggleServiceSelection(srv.id)}
                            className={`border-2 rounded-2xl p-4 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between relative transform active:scale-[0.99] hover:-translate-y-0.5 ${
                              isSelected
                                ? "border-[#6b2e4c] bg-[#6b2e4c]/5 shadow-[0_4px_20px_-2px_rgba(107,46,76,0.12)] ring-1 ring-[#6b2e4c]"
                                : "border-[#e5e5e5] bg-white hover:border-[#a83d5b] hover:shadow-md"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <span className="font-['Montserrat',sans-serif] font-bold text-xs sm:text-sm text-[#6b2e4c]">
                                  {srv.name}
                                </span>
                                <div
                                  className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "bg-[#6b2e4c] border-[#6b2e4c] text-white"
                                      : "border-[#ccc] bg-white"
                                  }`}
                                >
                                  {isSelected && <Check size={10} />}
                                </div>
                              </div>

                              {srv.isFreeDemo && (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                                  <Gift className="h-2.5 w-2.5 inline mr-1" />
                                  100% FREE DEMO
                                </span>
                              )}
                              <p className="text-[11px] text-[#666] line-clamp-2 mt-1">
                                {srv.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs text-[#4a4a4a] pt-3 mt-2 border-t border-[#e5e5e5]">
                              <span className="text-[10px] font-semibold text-[#a83d5b] uppercase tracking-wider">
                                Turnaround:
                              </span>
                              <span className="font-bold text-[#0f0f10] bg-[#f8f8f8] px-2 py-0.5 rounded-lg border border-[#e5e5e5] text-[11px]">
                                Est. {srv.clientDays} Days
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Deliverables Summary Pill */}
                    <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#6b2e4c]">
                          Selected Deliverables ({selectedServicesList.length}):
                        </span>
                        <span className="text-[#16a34a] font-bold font-mono">
                          Promised Delivery Due: {promisedDeliveryDate}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedServicesList.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#e5e5e5] text-[#2a2a2a]"
                          >
                            <span>{s.name}</span>
                            <span className="text-[#666] text-[10px]">({s.clientDays}d)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-ghost text-xs text-[#4a4a4a] hover:text-[#0f0f10]"
                  >
                    ← Back to Date
                  </button>
                  <button
                    type="button"
                    disabled={!region || selectedServiceIds.length === 0}
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs shadow-md shadow-[#6b2e4c4d] transition-all flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Continue to Studio Details →</span>
                  </button>
                </div>
                {(!region || selectedServiceIds.length === 0) && (
                  <p className="text-[11px] text-[#a83d5b] text-right font-medium">
                    {!region
                      ? "* Please select your region to continue"
                      : "* Please select at least 1 editing deliverable to continue"}
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 3: YOUR DETAILS (04 & 06) ── */}
            {currentStep === 3 && (
              <div className="animate-step-fade space-y-6">
                <div>
                  <h3 className="font-['Montserrat',sans-serif] text-xl font-bold text-[#6b2e4c] flex items-center space-x-2 pb-2 border-b-2 border-[#e5e5e5]">
                    <User className="h-6 w-6 text-[#a83d5b]" />
                    <span>Studio & Contact Information</span>
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mt-1">
                    Enter your contact and location details for project delivery and WhatsApp updates
                  </p>
                </div>

                {/* 06) Auto-Detection Message if existing */}
                {autoDetectNotice && (
                  <div className="bg-[#22c55e1a] border border-[#22c55e4d] text-[#166534] rounded-xl p-3 text-xs flex items-center space-x-2">
                    <CheckCircle size={16} className="shrink-0" />
                    <span className="font-semibold">{autoDetectNotice}</span>
                  </div>
                )}

                {/* 04) Dynamic Country / City for Foreign vs Indian */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {region === "foreign" ? (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                        <Globe size={16} />
                        <span>Country *</span>
                      </label>
                      <select
                        value={country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] bg-white outline-none"
                      >
                        <option value="United States">United States (+1)</option>
                        <option value="United Kingdom">United Kingdom (+44)</option>
                        <option value="Canada">Canada (+1)</option>
                        <option value="Australia">Australia (+61)</option>
                        <option value="United Arab Emirates">United Arab Emirates / Dubai (+971)</option>
                        <option value="Germany">Germany (+49)</option>
                        <option value="France">France (+33)</option>
                        <option value="Other">Other Country</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                        <MapPin size={16} />
                        <span>State / Region *</span>
                      </label>
                      <input
                        type="text"
                        value={country === "India" ? "India" : country}
                        disabled
                        className="w-full border-2 border-[#e5e5e5] rounded-xl px-3.5 py-2.5 text-xs text-[#666] bg-slate-50"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <MapPin size={16} />
                      <span>City / State *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={
                        region === "foreign" ? "e.g. London / New York / Toronto" : "e.g. Ahmedabad / Mumbai / Surat"
                      }
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] outline-none"
                    />
                  </div>
                </div>

                {/* Studio, Owner & Event / Couple Name (Clean 3-Field Separation) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Building2 size={16} />
                      <span>Studio / Brand Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Lumina Films"
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] outline-none"
                    />
                    <span className="text-[10px] text-[#666]">Official Studio or Production House Name</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <User size={16} />
                      <span>Contact Person Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Amit Patel"
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] outline-none"
                    />
                    <span className="text-[10px] text-[#666]">Primary Contact Person or Director</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Sparkles size={16} />
                      <span>Couple / Event Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={coupleNames}
                      onChange={(e) => setCoupleNames(e.target.value)}
                      placeholder="e.g. Aarav & Diya Wedding"
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] outline-none"
                    />
                    <span className="text-[10px] text-[#666]">Wedding Couple or Project Title</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Phone size={16} />
                      <span>WhatsApp Number (with country code) *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={handlePhoneChange}
                      placeholder={region === "foreign" ? "+1 555 0199 / +44 77..." : "+91 98250 11999"}
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-xs text-[#0f0f10] font-mono outline-none"
                    />
                    <span className="text-[11px] text-[#666] block">
                      We will contact you on WhatsApp for project updates
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Mail size={16} />
                      <span>Email Address (Confirmation & Invoices) *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@studio.com"
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-[#0f0f10] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="btn-ghost text-xs text-[#4a4a4a] hover:text-[#0f0f10]"
                  >
                    ← Back to Deliverables
                  </button>
                  <button
                    type="button"
                    disabled={!studioName.trim() || !contactPerson.trim() || !whatsappNumber.trim()}
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs shadow-md shadow-[#6b2e4c4d] transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <span>Proceed to Data Delivery →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: DATA DELIVERY & SUBMIT (05) ── */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmit} className="animate-step-fade space-y-6">
                <div>
                  <h3 className="font-['Montserrat',sans-serif] text-xl font-bold text-[#6b2e4c] flex items-center space-x-2 pb-2 border-b-2 border-[#e5e5e5]">
                    <Send className="h-6 w-6 text-[#a83d5b]" />
                    <span>Data Delivery & Final Confirmation</span>
                  </h3>
                  <p className="text-xs text-[#4a4a4a] mt-1">
                    {region === "foreign"
                      ? "High-speed secure cloud transfer for International Clients"
                      : "How will you send the project data?"}
                  </p>
                </div>

                {/* 05) Foreign gets ONLY Online Options (Paste Link vs Request RSE Link) */}
                {region === "foreign" ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Cloud size={16} />
                      <span>Select Cloud Transfer Method (International Data) *</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setForeignOnlineOption("client_link")}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          foreignOnlineOption === "client_link"
                            ? "border-[#6b2e4c] bg-[#6b2e4c14] ring-1 ring-[#6b2e4c]"
                            : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Cloud size={24} className="text-[#6b2e4c]" />
                          <div>
                            <div className="font-bold text-xs text-[#6b2e4c]">
                              I have a Cloud Link
                            </div>
                            <div className="text-[11px] text-[#666]">
                              Paste your Google Drive, Dropbox, WeTransfer link
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setForeignOnlineOption("request_rse_link")}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          foreignOnlineOption === "request_rse_link"
                            ? "border-[#6b2e4c] bg-[#6b2e4c14] ring-1 ring-[#6b2e4c]"
                            : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <FolderSync size={24} className="text-[#6b2e4c]" />
                          <div>
                            <div className="font-bold text-xs text-[#6b2e4c]">
                              Request RSE Studio Drive Link
                            </div>
                            <div className="text-[11px] text-[#666]">
                              We will send you a dedicated high-speed upload link
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {foreignOnlineOption === "client_link" ? (
                      <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 space-y-2 text-xs">
                        <label className="text-[11px] font-bold text-[#6b2e4c] block">
                          Paste Your Google Drive / Dropbox / WeTransfer Folder URL *
                        </label>
                        <input
                          type="url"
                          required
                          value={onlineDriveLink}
                          onChange={(e) => setOnlineDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono bg-white"
                        />
                      </div>
                    ) : (
                      <div className="bg-[#22c55e1a] border border-[#22c55e4d] text-[#166534] rounded-xl p-3.5 text-xs flex items-center space-x-2">
                        <CheckCircle size={16} className="shrink-0" />
                        <span>
                          Our team will generate a high-speed dedicated RSE Upload folder link and
                          send it to your WhatsApp/Email within 2 hours.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Indian Client: Option between Online vs Physical Drive */
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <HardDrive size={16} />
                      <span>How will you deliver the project footage? *</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setDataDeliveryMethod("online")}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          dataDeliveryMethod === "online"
                            ? "border-[#6b2e4c] bg-[#6b2e4c14] ring-1 ring-[#6b2e4c]"
                            : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Cloud size={24} className="text-[#6b2e4c]" />
                          <div>
                            <div className="font-bold text-xs text-[#6b2e4c]">Online Cloud Drive</div>
                            <div className="text-[11px] text-[#666]">
                              Google Drive, WeTransfer, Dropbox (+1.5d buffer)
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setDataDeliveryMethod("courier")}
                        className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                          dataDeliveryMethod === "courier"
                            ? "border-[#6b2e4c] bg-[#6b2e4c14] ring-1 ring-[#6b2e4c]"
                            : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Truck size={24} className="text-[#6b2e4c]" />
                          <div>
                            <div className="font-bold text-xs text-[#6b2e4c]">Physical Hard Drive / SSD</div>
                            <div className="text-[11px] text-[#666]">
                              Courier (BlueDart/DTDC) or Porter / Local Drop
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {dataDeliveryMethod === "courier" ? (
                      <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 space-y-4 text-xs">
                        {/* Drive Dispatch Timing Option */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-[#6b2e4c] uppercase tracking-wide block">
                            When will you send your Hard Drive / SSD? *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setHddTiming("future")}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                hddTiming === "future"
                                  ? "border-[#6b2e4c] bg-white ring-1 ring-[#6b2e4c] shadow-sm font-semibold"
                                  : "border-[#e5e5e5] bg-white/70 hover:border-[#a83d5b] text-[#4a4a4a]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#6b2e4c]">
                                  Advance Slot Booking
                                </span>
                                {hddTiming === "future" && <Check className="h-3.5 w-3.5 text-[#6b2e4c]" />}
                              </div>
                              <p className="text-[11px] text-[#666] font-normal mt-1 leading-relaxed">
                                No tracking number needed today. Reserve your slot now and ship your SSD closer to the slot date.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setHddTiming("ready")}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                hddTiming === "ready"
                                  ? "border-[#6b2e4c] bg-white ring-1 ring-[#6b2e4c] shadow-sm font-semibold"
                                  : "border-[#e5e5e5] bg-white/70 hover:border-[#a83d5b] text-[#4a4a4a]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#6b2e4c]">
                                  Already Dispatched / Sending Today
                                </span>
                                {hddTiming === "ready" && <Check className="h-3.5 w-3.5 text-[#6b2e4c]" />}
                              </div>
                              <p className="text-[11px] text-[#666] font-normal mt-1 leading-relaxed">
                                Enter your courier tracking number or local Porter / hand-delivery details below.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* If ready/dispatched: Select Courier vs Porter */}
                        {hddTiming === "ready" && (
                          <div className="space-y-3 pt-2 border-t border-[#e5e5e5] animate-fadeIn">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <label className="text-[11px] font-bold text-[#6b2e4c]">Dispatch Method:</label>
                              <div className="inline-flex rounded-lg border border-[#e5e5e5] bg-white p-0.5">
                                <button
                                  type="button"
                                  onClick={() => setHddMethod("courier")}
                                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    hddMethod === "courier"
                                      ? "bg-[#6b2e4c] text-white"
                                      : "text-[#666] hover:text-[#0f0f10]"
                                  }`}
                                >
                                  Courier (BlueDart / DTDC / Tirupati)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHddMethod("porter_local")}
                                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    hddMethod === "porter_local"
                                      ? "bg-[#6b2e4c] text-white"
                                      : "text-[#666] hover:text-[#0f0f10]"
                                  }`}
                                >
                                  Porter / Hand Drop (Ahmedabad & Gandhinagar)
                                </button>
                              </div>
                            </div>

                            {hddMethod === "courier" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[11px] text-[#4a4a4a] block font-semibold mb-1">
                                    Courier Partner *
                                  </label>
                                  <input
                                    type="text"
                                    value={courierName}
                                    onChange={(e) => setCourierName(e.target.value)}
                                    placeholder="BlueDart / DTDC / Tirupati"
                                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-[#4a4a4a] block font-semibold mb-1">
                                    Docket / AWB Tracking # *
                                  </label>
                                  <input
                                    type="text"
                                    value={docketNumber}
                                    onChange={(e) => setDocketNumber(e.target.value)}
                                    placeholder="AWB / Docket Number"
                                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-[#4a4a4a] block font-semibold mb-1">
                                    Dispatch Date *
                                  </label>
                                  <input
                                    type="date"
                                    value={dispatchDate}
                                    onChange={(e) => setDispatchDate(e.target.value)}
                                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono bg-white"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-[#e5e5e5]">
                                <div>
                                  <label className="text-[11px] text-[#4a4a4a] block font-semibold mb-1">
                                    Delivery Partner / Service
                                  </label>
                                  <select
                                    value={courierName || "Porter Bike / Van"}
                                    onChange={(e) => setCourierName(e.target.value)}
                                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs bg-white"
                                  >
                                    <option value="Porter Bike / Van">Porter (Bike / 3-Wheeler / 4-Wheeler)</option>
                                    <option value="Borzo / WeFast">Borzo / WeFast</option>
                                    <option value="Uber Package">Uber Package</option>
                                    <option value="Self / Studio Hand Delivery">Self / Studio Team Hand Drop</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[11px] text-[#4a4a4a] block font-semibold mb-1">
                                    Driver Phone or Live Link (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={porterDriverPhone}
                                    onChange={(e) => setPorterDriverPhone(e.target.value)}
                                    placeholder="Driver phone or share link in WhatsApp group"
                                    className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs bg-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Verified Gandhinagar Studio Ingest Address Box with Google Map & Copy */}
                        <div className="bg-[#f5e6cc]/40 border border-[#f5e6cc] rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-1.5 font-bold text-[#6b2e4c]">
                              <MapPin className="h-4 w-4 text-[#a83d5b]" />
                              <span>RSE Gandhinagar Studio Receiving Address:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={handleCopyAddress}
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#e5e5e5] text-[#4a4a4a] hover:border-[#6b2e4c] hover:text-[#6b2e4c] transition-all"
                              >
                                {copiedAddress ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-700">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy for Porter / Courier</span>
                                  </>
                                )}
                              </button>
                              <a
                                href={RSE_GOOGLE_MAPS_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#6b2e4c] text-[#f5e6cc] hover:bg-[#a83d5b] transition-all shadow-sm"
                              >
                                <Navigation className="h-3 w-3" />
                                <span>Open Maps ↗</span>
                              </a>
                            </div>
                          </div>

                          <div className="text-[#0f0f10] text-[11px] leading-relaxed">
                            <p className="font-bold text-xs text-[#6b2e4c]">RSE Post Production House</p>
                            <p className="font-semibold text-[#111]">
                              7th Floor, Radhe Infinity, 726, Raksha Shakti Cir,
                            </p>
                            <p className="text-[#333]">
                              nr. Swaminarayan Dham, Urjanagar, Randesan, Gandhinagar, Gujarat – 382421
                            </p>
                            <p className="text-[#4a4a4a] text-[11px] pt-1">
                              Attn: Media Ingest & Reception • Phone: <strong>+91 93135 53726</strong> / <strong>+91 88663 23567</strong>
                            </p>
                            <p className="text-[#666] text-[10px] pt-0.5">
                              Receiving Hours: Mon – Sat, 10:00 AM – 7:00 PM • Direct delivery via BlueDart, DTDC, Tirupati, or Porter.
                            </p>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddressMap(!showAddressMap)}
                              className="text-[11px] font-bold text-[#6b2e4c] hover:underline inline-flex items-center space-x-1"
                            >
                              <Map className="h-3 w-3" />
                              <span>{showAddressMap ? "Hide Studio Map Preview ▲" : "Show Studio Map Preview (Google Maps) ▼"}</span>
                            </button>
                          </div>

                          {showAddressMap && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-[#e5e5e5] shadow-sm animate-fadeIn">
                              <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3667.5894980127655!2d72.6373621753186!3d23.185177879060134!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395c2bc7a6f1934b%3A0xf94781d754f6723b!2sRSE%20%7C%20Post%20Production%20House!5e0!3m2!1sen!2sin!4v1793273125237!5m2!1sen!2sin"
                                width="100%"
                                height="220"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 space-y-2 text-xs">
                        <label className="text-[11px] font-bold text-[#6b2e4c] block">
                          Google Drive / Dropbox / WeTransfer Link *
                        </label>
                        <input
                          type="url"
                          required
                          value={onlineDriveLink}
                          onChange={(e) => setOnlineDriveLink(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono bg-white"
                        />
                      </div>
                    )}

                    {/* Footage Ingest Cut-off Deadline Banner */}
                    {selectedDate && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                          <Clock className="h-4 w-4 text-amber-700 shrink-0" />
                          <span>Footage Ingest Cut-off Deadline:</span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed">
                          Your production slot begins on <strong>{selectedDate}</strong>. To ensure guaranteed delivery, your footage must{" "}
                          <strong>
                            {new Date(new Date(selectedDate).getTime() - 86400000).toISOString().split("T")[0]}
                          </strong>{" "}
                          {dataDeliveryMethod === "courier"
                            ? "reach our Gandhinagar studio by 6:00 PM."
                            : "be fully uploaded to your cloud drive link by 11:59 PM."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Smart Song & Music Direction Selector */}
                <div className="space-y-3 pt-3 border-t border-[#e5e5e5]">
                  <div>
                    <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                      <Sparkles size={16} />
                      <span>Song / Music Preference</span>
                    </label>
                    <p className="text-[11px] text-[#666]">
                      Choose how audio tracks should be selected for your project:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSongOption("whatsapp")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        songOption === "whatsapp"
                          ? "border-[#6b2e4c] bg-[#6b2e4c]/5 ring-1 ring-[#6b2e4c]"
                          : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">📱</span>
                        {songOption === "whatsapp" && <Check className="h-3.5 w-3.5 text-[#6b2e4c]" />}
                      </div>
                      <p className="font-bold text-xs text-[#6b2e4c] mt-1.5">Share on WhatsApp</p>
                      <p className="text-[11px] text-[#666] mt-0.5">
                        We will share audio tracks or playlists in your studio WhatsApp group
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSongOption("rse_choice")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        songOption === "rse_choice"
                          ? "border-[#6b2e4c] bg-[#6b2e4c]/5 ring-1 ring-[#6b2e4c]"
                          : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">🎧</span>
                        {songOption === "rse_choice" && <Check className="h-3.5 w-3.5 text-[#6b2e4c]" />}
                      </div>
                      <p className="font-bold text-xs text-[#6b2e4c] mt-1.5">RSE Director's Choice</p>
                      <p className="text-[11px] text-[#666] mt-0.5">
                        Our senior editors select the best cinematic licensed score
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSongOption("link")}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        songOption === "link"
                          ? "border-[#6b2e4c] bg-[#6b2e4c]/5 ring-1 ring-[#6b2e4c]"
                          : "border-[#e5e5e5] bg-white hover:border-[#a83d5b]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">🔗</span>
                        {songOption === "link" && <Check className="h-3.5 w-3.5 text-[#6b2e4c]" />}
                      </div>
                      <p className="font-bold text-xs text-[#6b2e4c] mt-1.5">Paste Song Link</p>
                      <p className="text-[11px] text-[#666] mt-0.5">
                        Paste Spotify, YouTube, or Drive music URL
                      </p>
                    </button>
                  </div>

                  {songOption === "link" && (
                    <input
                      type="url"
                      value={songLink}
                      onChange={(e) => setSongLink(e.target.value)}
                      placeholder="Paste Spotify / YouTube song URL here..."
                      className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl px-3.5 py-2 text-xs font-mono outline-none bg-white"
                    />
                  )}
                </div>

                {/* Camera Profile & LUT Quick-Chips */}
                <div className="space-y-2 pt-3 border-t border-[#e5e5e5]">
                  <label className="text-xs font-bold text-[#6b2e4c] block">
                    Camera Log / Color Profile
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Sony S-Log3 / S-Gamut3.Cine",
                      "Canon C-Log3",
                      "Apple ProRes Log",
                      "DJI D-Log M (Drone)",
                      "Rec709 Standard",
                      "Mixed Cameras",
                    ].map((profile) => (
                      <button
                        key={profile}
                        type="button"
                        onClick={() => setCameraProfile(profile)}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          cameraProfile === profile
                            ? "bg-[#6b2e4c] border-[#6b2e4c] text-white shadow-sm font-semibold"
                            : "bg-white border-[#e5e5e5] text-[#4a4a4a] hover:border-[#a83d5b]"
                        }`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1 pt-2 border-t border-[#e5e5e5]">
                  <label className="text-xs font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                    <MessageSquare size={16} />
                    <span>Special Instructions / Creative Notes</span>
                  </label>
                  <textarea
                    rows={2}
                    value={projectNotes}
                    onChange={(e) => setProjectNotes(e.target.value)}
                    placeholder="LUT preferences, specific audio vows, wedding story brief, pacing preferences, or special cuts..."
                    className="w-full border-2 border-[#e5e5e5] focus:border-[#a83d5b] rounded-xl p-3 text-base sm:text-xs text-[#0f0f10] outline-none"
                  />
                </div>

                {/* Final Booking Summary Box */}
                <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 space-y-2 text-xs">
                  <h4 className="font-['Montserrat',sans-serif] font-bold text-[#6b2e4c] text-xs uppercase tracking-wide">
                    Final Reservation Summary
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                    <div>
                      <span className="text-[#666] block">Slot Date:</span>
                      <strong className="text-[#0f0f10] font-mono">{selectedDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Promised Delivery:</span>
                      <strong className="text-[#16a34a] font-mono">{promisedDeliveryDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Studio:</span>
                      <strong className="text-[#0f0f10]">{studioName}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Couple / Event:</span>
                      <strong className="text-[#0f0f10]">{coupleNames || "Wedding Project"}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Contact Person:</span>
                      <strong className="text-[#0f0f10]">{contactPerson}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Location:</span>
                      <strong className="text-[#0f0f10]">
                        {city ? `${city}, ` : ""}
                        {country}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">WhatsApp:</span>
                      <strong className="text-[#0f0f10] font-mono">{whatsappNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Deliverables ({selectedServicesList.length}):</span>
                      <strong className="text-[#6b2e4c] truncate block">
                        {selectedServicesList.map((s) => s.name).join(", ")}
                      </strong>
                    </div>
                  </div>
                </div>

                  <div className="bg-[#f5e6cc]/40 border border-[#f5e6cc] rounded-xl p-3 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#6b2e4c] block">Payment Terms & NDA Protection</span>
                      <span className="text-[11px] text-[#666]">
                        50% Advance to reserve slot • 50% upon final master approval • 100% NDA Protected
                      </span>
                    </div>
                    <span className="bg-[#6b2e4c] text-[#f5e6cc] font-bold px-3 py-1 rounded-full text-2xs uppercase tracking-wider shrink-0">
                      50% Advance
                    </span>
                  </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="btn-ghost text-xs text-[#4a4a4a] hover:text-[#0f0f10]"
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#6b2e4c] to-[#a83d5b] hover:opacity-95 text-[#f5e6cc] font-bold text-xs shadow-lg shadow-[#6b2e4c4d] transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Reserving Slot & Syncing...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Slot Reservation (50% Advance)</span>
                        <Send className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Order Tracking Modal ── */}
        {showTrackerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white border border-[#e5e5e5] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-3">
                <h3 className="font-['Montserrat',sans-serif] text-sm font-bold text-[#6b2e4c] flex items-center space-x-1.5">
                  <Search className="h-4 w-4 text-[#a83d5b]" />
                  <span>Track Project Status</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTrackerModal(false)}
                  className="text-[#666] hover:text-[#0f0f10] text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-[#4a4a4a]">
                  Enter your Booking Code (e.g. RSE-001) or registered WhatsApp number:
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="RSE-001 or +91 98250..."
                    value={trackerQuery}
                    onChange={(e) => setTrackerQuery(e.target.value)}
                    className="border-2 border-[#e5e5e5] rounded-lg px-3 py-2 text-xs font-mono flex-1 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTrackOrder}
                    className="px-4 py-2 rounded-lg bg-[#6b2e4c] hover:bg-[#a83d5b] text-[#f5e6cc] font-semibold text-xs"
                  >
                    Track
                  </button>
                </div>
              </div>

              {trackedBooking ? (
                <div className="bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#6b2e4c] text-sm">
                      {trackedBooking.code}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#e5e5e5] text-[#2a2a2a]">
                      {trackedBooking.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4a4a4a]">
                    <div>
                      <span className="text-[#666] block">Project:</span>
                      <strong className="text-[#0f0f10]">{trackedBooking.coupleNames}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Studio:</span>
                      <strong className="text-[#0f0f10]">{trackedBooking.studioOrClient}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Slot Date:</span>
                      <strong className="font-mono text-[#0f0f10]">{trackedBooking.slotDate}</strong>
                    </div>
                    <div>
                      <span className="text-[#666] block">Guaranteed Delivery:</span>
                      <strong className="font-mono text-[#16a34a]">{trackedBooking.deliveryDate}</strong>
                    </div>
                  </div>

                  {trackedBooking.whatsappGroupUrl && (
                    <div className="pt-2 border-t border-[#e5e5e5]">
                      <a
                        href={trackedBooking.whatsappGroupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#22c55e] font-bold hover:underline inline-flex items-center space-x-1"
                      >
                        <Phone size={13} />
                        <span>Open Studio WhatsApp Group</span>
                      </a>
                    </div>
                  )}

                  {trackedBooking.frameIoLink && (
                    <div className="pt-2 border-t border-[#e5e5e5]">
                      <a
                        href={trackedBooking.frameIoLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#6b2e4c] font-bold hover:underline inline-flex items-center space-x-1"
                      >
                        <span>Open Frame.io Preview Link (7-Day Revision)</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : trackerQuery ? (
                <p className="text-xs text-[#999] text-center py-2">
                  No active project found with this code or phone number.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* 📱 Mobile Sticky Action Bar */}
        {!confirmedBooking && currentStep < 5 && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e5e5e5] p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between">
            <div className="space-y-0.5 text-left">
              <span className="text-[10px] uppercase font-bold text-[#666] block">
                Step {currentStep} of 4:
              </span>
              <span className="text-xs font-bold text-[#6b2e4c] truncate block max-w-[170px]">
                {currentStep === 1
                  ? `Slot: ${selectedDate}`
                  : currentStep === 2
                  ? `${selectedServiceIds.length} Deliverable(s)`
                  : currentStep === 3
                  ? studioName || "Studio Details"
                  : "Final Review"}
              </span>
            </div>

            <button
              type="button"
              disabled={
                (currentStep === 2 && (!region || selectedServiceIds.length === 0)) ||
                (currentStep === 3 &&
                  (!studioName.trim() || !contactPerson.trim() || !whatsappNumber.trim())) ||
                (currentStep === 4 && isSubmitting)
              }
              onClick={() => {
                if (currentStep < 4) {
                  setCurrentStep((prev) => prev + 1);
                } else {
                  const formElem = document.querySelector("form");
                  if (formElem) formElem.requestSubmit();
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#6b2e4c] text-[#f5e6cc] font-bold text-xs shadow-md transition-all disabled:opacity-40"
            >
              {currentStep === 4
                ? isSubmitting
                  ? "Reserving..."
                  : "Confirm Slot"
                : "Continue →"}
            </button>
          </div>
        )}
      </main>

      {/* ── Official Footer ── */}
      <footer className="border-t border-[#e5e5e5] py-8 text-center text-xs text-[#666] space-y-3 bg-[#fcfcfc] mt-12">
        <div className="flex justify-center">
          <img
            src="/rse-logo.png"
            alt="RSE Logo"
            className="h-9 w-9 rounded-full object-contain shadow-sm border border-[#6b2e4c]/20"
          />
        </div>
        <p className="font-semibold text-xs text-[#2a2a2a]">RSE Post Production House • Gandhinagar, Gujarat</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a
            href="https://rsegnr.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#6b2e4c] font-semibold hover:underline"
          >
            Official Website (rsegnr.in)
          </a>
          <span className="text-[#ccc]">•</span>
          <a
            href={RSE_GOOGLE_MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="text-[#6b2e4c] font-semibold hover:underline inline-flex items-center space-x-1"
          >
            <MapPin className="h-3 w-3" />
            <span>Google Maps Location & Reviews ↗</span>
          </a>
          <span className="text-[#ccc]">•</span>
          <a
            href="tel:+919313553726"
            className="text-[#4a4a4a] hover:text-[#0f0f10]"
          >
            Support: +91 93135 53726
          </a>
        </div>
        <p className="text-[11px] text-[#999] pt-1">
          © {new Date().getFullYear()} RSE Post Production House. All rights reserved. 100% NDA Protected.
        </p>
      </footer>
    </div>
  );
}
